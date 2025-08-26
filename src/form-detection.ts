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

    // 1. Detect actual <form> elements
    const formElements = document.querySelectorAll('form');
    formElements.forEach((form) => {
      const inputs = this.getEligibleInputs(form);
      if (inputs.length > 1) {
        forms.push({
          element: form as HTMLElement,
          type: 'form',
          inputs
        });
        processedElements.add(form);

        // Mark all inputs as processed to avoid double-detection
        inputs.forEach(input => processedElements.add(input));
      }
    });

    // 2. Detect form-like containers outside of forms
    const containerSelectors = ['div', 'section', 'fieldset', 'main', 'article'];

    containerSelectors.forEach((selector) => {
      const containers = document.querySelectorAll(selector);
      containers.forEach((container) => {
        // Skip if already processed
        if (processedElements.has(container)) return;

        // Skip if inside a form
        if (container.closest('form')) return;

        // Skip if already processed by attribute
        if (container.hasAttribute('data-llm-autofill-processed')) return;

        // Skip navigation/filter containers
        if (this.isNavigationContainer(container)) return;

        const inputs = this.getEligibleInputs(container);

        // Only process if has inputs that aren't already part of a detected form
        const unprocessedInputs = inputs.filter(input => !processedElements.has(input));

        // Check if inputs look like actual form fields
        if (unprocessedInputs.length >= 2 && this.hasFormLikeInputs(unprocessedInputs)) {
          // Check if this container would be a subset of an already detected form
          const wouldBeDuplicate = forms.some(existingForm =>
            existingForm.element.contains(container) || container.contains(existingForm.element)
          );

          if (!wouldBeDuplicate) {
            forms.push({
              element: container as HTMLElement,
              type: 'container',
              inputs: unprocessedInputs
            });
            processedElements.add(container);
            unprocessedInputs.forEach(input => processedElements.add(input));
            container.setAttribute('data-llm-autofill-processed', 'true');
          }
        }
      });
    });

    return forms;
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
