/**
 * Form Detection Module
 *
 * Handles all form detection logic including:
 * - Detecting form elements and form-like containers
 * - Identifying eligible input fields for autofill
 * - Filtering out navigation/filter containers
 * - Pattern matching for form-like content
 */

import { FormInfo } from './types';

export class FormDetector {
  private static readonly NAVIGATION_SELECTORS = [
    '[class*="nav"]', '[id*="nav"]', '[class*="menu"]', '[id*="menu"]',
    '[class*="filter"]', '[id*="filter"]', '[class*="search"]', '[id*="search"]',
    'nav', 'header', '.dropdown-nav', '#dropdown-nav-outer-wrapper'
  ];

  private static readonly FORM_LIKE_PATTERNS = [
    /name/i, /email/i, /phone/i, /address/i, /city/i, /state/i, /zip/i, /postal/i,
    /first/i, /last/i, /company/i, /job/i, /birth/i, /date/i,
    /passport/i, /license/i, /id/i, /ssn/i, /tax/i,
    /card/i, /member/i, /payment/i, /billing/i, /shipping/i,
    /account/i, /user/i, /login/i, /register/i, /signup/i
  ];

  private static readonly FILTER_PATTERNS = [
    /filter/i, /search/i, /query/i, /find/i, /sort/i, /tag/i
  ];

  public detectForms(): FormInfo[] {
    const forms: FormInfo[] = [];
    const processedInputs = new Set<HTMLInputElement>();

    // Use DFS to collect inputs and create forms bottom-up
    this.dfsDetectForms(document.body, forms, processedInputs);

    return forms;
  }

  private dfsDetectForms(element: Element, forms: FormInfo[], processedInputs: Set<HTMLInputElement>): HTMLInputElement[] {
    // Base case: if this is an eligible input, return it
    if (this.isEligibleInput(element)) {
      const input = element as HTMLInputElement;
      return processedInputs.has(input) ? [] : [input];
    }

    // Skip navigation containers entirely
    if (this.isNavigationContainer(element)) {
      return [];
    }

    // Collect inputs from all children
    const childInputs: HTMLInputElement[] = [];
    for (let i = 0; i < element.children.length; i++) {
      const inputs = this.dfsDetectForms(element.children[i], forms, processedInputs);
      childInputs.push(...inputs);
    }

    // If we have fewer than 2 inputs, just return them (don't create a form)
    if (childInputs.length < 2) {
      return childInputs;
    }

    // If we have 2+ inputs and this is a form-like container, create a form
    if (this.shouldCreateForm(element, childInputs)) {
      forms.push({
        element: element as HTMLElement,
        type: element instanceof HTMLFormElement ? 'form' : 'container',
        inputs: childInputs
      });

      // Mark these inputs as processed so they won't be included in parent forms
      childInputs.forEach(input => processedInputs.add(input));
      (element as HTMLElement).setAttribute('data-llm-autofill-processed', 'true');

      // Return empty array since we've "consumed" these inputs
      return [];
    }

    // Otherwise, return the inputs for potential parent forms
    return childInputs;
  }

  private isEligibleInput(element: Element): boolean {
    // Check if it's an input or textarea element using instanceof
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
      return false;
    }

    // Handle textarea elements
    if (element instanceof HTMLTextAreaElement) {
      return !element.hidden && !element.disabled;
    }

    // Handle input elements
    const input = element as HTMLInputElement;

    // Include common autofillable input types
    const allowedTypes = ['text', 'email', 'tel', 'password', 'number', 'url', 'date'];
    const inputType = input.type || 'text';

    if (!allowedTypes.includes(inputType)) {
      return false;
    }

    // Skip hidden, disabled, or non-autofillable inputs
    return !input.hidden &&
           !input.disabled &&
           input.type !== 'hidden' &&
           input.type !== 'submit' &&
           input.type !== 'button' &&
           input.type !== 'radio' &&
           input.type !== 'checkbox';
  }

  private shouldCreateForm(element: Element, inputs: HTMLInputElement[]): boolean {
    // Always create forms for <form> elements
    if (element instanceof HTMLFormElement) {
      return true;
    }

    // For other containers, check if it's a valid container type using instanceof
    if (element instanceof HTMLDivElement) {
      // Check if inputs look like actual form fields (not just filters/search)
      return this.hasFormLikeInputs(inputs);
    }

    return false;
  }

  public getEligibleInputs(container: Element): HTMLInputElement[] {
    // Get all potential input elements
    const inputSelector = 'input, textarea';
    const inputs = container.querySelectorAll(inputSelector);

    return Array.from(inputs).filter((input) => {
      return this.isEligibleInput(input);
    }) as HTMLInputElement[];
  }

  private isNavigationContainer(container: Element): boolean {
    // Skip navigation-related containers
    return FormDetector.NAVIGATION_SELECTORS.some(selector =>
      container.matches(selector) || container.closest(selector)
    );
  }

  private hasFormLikeInputs(inputs: HTMLInputElement[]): boolean {
    // Check if inputs look like actual form fields (not just filters/search)
    const formLikePatterns = FormDetector.FORM_LIKE_PATTERNS;
    const filterPatterns = FormDetector.FILTER_PATTERNS;

    // If any input has form-like patterns, consider it a form
    const hasFormLike = inputs.some(input => {
      const text = input.name + input.id + input.placeholder + input.getAttribute('aria-label') || '';
      return formLikePatterns.some(pattern => pattern.test(text));
    });

    // If all inputs are clearly filters/search, skip it
    const allFilterLike = inputs.every(input => {
      const text = input.name + input.id + input.placeholder + input.getAttribute('aria-label') || '';
      return filterPatterns.some(pattern => pattern.test(text));
    });

    return hasFormLike && !allFilterLike;
  }

  public hasFormLikeContent(element: Element): boolean {
    const inputs = this.getEligibleInputs(element);
    return inputs.length >= 2;
  }
}
