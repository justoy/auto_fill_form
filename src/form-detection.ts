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
    const processedElements = new Set<Element>();

    // Use DFS to detect forms and form-like containers at each level
    this.dfsDetectForms(document.body, forms, processedElements);

    return forms;
  }

  private dfsDetectForms(element: Element, forms: FormInfo[], processedElements: Set<Element>): void {
    // Skip if already processed
    if (processedElements.has(element)) return;

    // 1. Check if this is a form element
    if (element.tagName === 'FORM') {
      const inputs = this.getDirectInputs(element);
      if (inputs.length > 1) {
        forms.push({
          element: element as HTMLElement,
          type: 'form',
          inputs
        });
        processedElements.add(element);
        inputs.forEach(input => processedElements.add(input));
      }
    }
    // 2. Check if this is a form-like container
    else if (this.isFormLikeContainer(element)) {
      const inputs = this.getDirectInputs(element);
      if (inputs.length >= 2 && this.hasFormLikeInputs(inputs)) {
        forms.push({
          element: element as HTMLElement,
          type: 'container',
          inputs
        });
        processedElements.add(element);
        inputs.forEach(input => processedElements.add(input));
        (element as HTMLElement).setAttribute('data-llm-autofill-processed', 'true');
      }
    }

    // 3. Recursively process children (DFS)
    for (let i = 0; i < element.children.length; i++) {
      this.dfsDetectForms(element.children[i], forms, processedElements);
    }
  }

  private isFormLikeContainer(element: Element): boolean {
    // Skip navigation/filter containers
    if (this.isNavigationContainer(element)) return false;

    // Only consider these container types
    const containerTags = ['DIV', 'SECTION', 'FIELDSET', 'MAIN', 'ARTICLE'];
    return containerTags.includes(element.tagName);
  }

  public getEligibleInputs(container: Element): HTMLInputElement[] {
    // Only include input types that typically need autofill with personal data
    // Explicitly exclude hidden inputs and other non-autofillable types
    const inputSelector = 'input[type="text"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], input:not([type]):not([type="hidden"]), textarea';
    const inputs = container.querySelectorAll(inputSelector);

    return Array.from(inputs).filter((input) => {
      const htmlInput = input as HTMLInputElement;
      // Skip hidden, disabled, or non-autofillable inputs
      return !htmlInput.hidden &&
             !htmlInput.disabled &&
             htmlInput.type !== 'hidden' &&
             htmlInput.type !== 'submit' &&
             htmlInput.type !== 'button' &&
             htmlInput.type !== 'radio' &&
             htmlInput.type !== 'checkbox';
    }) as HTMLInputElement[];
  }

  // Get only direct inputs, excluding those in nested forms/containers
  private getDirectInputs(container: Element): HTMLInputElement[] {
    const allInputs = this.getEligibleInputs(container);
    const nestedInputs = new Set<HTMLInputElement>();

    // Find all nested forms and containers that could have inputs
    const nestedSelectors = ['form', 'div', 'section', 'fieldset', 'main', 'article'];
    nestedSelectors.forEach(selector => {
      const nestedElements = container.querySelectorAll(`:scope > ${selector}`);
      nestedElements.forEach(nestedElement => {
        const inputs = this.getEligibleInputs(nestedElement);
        inputs.forEach(input => nestedInputs.add(input));
      });
    });

    // Return only inputs that are direct children, not in nested elements
    return allInputs.filter(input => !nestedInputs.has(input));
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
