/**
 * Form Filling Module
 *
 * Manages form filling operations including:
 * - Communicating with background script for form mapping
 * - Sanitizing form HTML for LLM processing
 * - Filling form fields based on mapping and user profile
 * - Handling input selection and value setting
 */

import { FormInfo, FormMapping, UserProfile } from './types';

export class FormFiller {
  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  public async handleAutofill(formInfo: FormInfo): Promise<void> {
    // Get sanitized form HTML
    const formHtml = this.sanitizeFormHtml(formInfo.element);

    // Request mapping from background script
    const response = await this.sendMessage({
      action: 'GET_FORM_MAPPING',
      formHtml
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Get user profile
    const profileResponse = await this.sendMessage({
      action: 'GET_PROFILE'
    });

    if (profileResponse.error) {
      throw new Error(profileResponse.error);
    }

    // Fill the form
    await this.fillForm(formInfo, response.mapping, profileResponse.profile);
  }

  private sanitizeFormHtml(element: HTMLElement): string {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove current values and sensitive attributes
    const inputs = clone.querySelectorAll('input, textarea, select');
    inputs.forEach((input: any) => {
      input.value = '';
      input.removeAttribute('value');
      // Keep structural attributes that help LLM understand the field
      // but remove any user data
    });

    // Remove scripts and event handlers
    const scripts = clone.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove style attributes that might contain sensitive info
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el: any) => {
      // Remove event handlers
      const attributes = Array.from(el.attributes);
      attributes.forEach((attr: any) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return clone.outerHTML;
  }

  private async fillForm(formInfo: FormInfo, mapping: FormMapping, profile: UserProfile): Promise<void> {
    for (const [selector, profileKey] of Object.entries(mapping)) {
      const value = profile[profileKey];
      if (!value) continue;

      const input = this.findInputBySelector(formInfo.element, selector);
      if (input) {
        await this.fillInput(input, value);
      }
    }
  }

  private findInputBySelector(container: HTMLElement, selector: string): HTMLInputElement | null {
    // Parse selector format: "id:value", "name:value", or "index:value"
    const [type, value] = selector.split(':', 2);

    switch (type) {
      case 'id':
        return container.querySelector(`#${CSS.escape(value)}`) as HTMLInputElement;

      case 'name':
        return container.querySelector(`[name="${CSS.escape(value)}"]`) as HTMLInputElement;

      case 'index':
        // Get eligible inputs from the container
        const inputs = this.getEligibleInputs(container);
        const index = parseInt(value, 10);
        return inputs[index] || null;

      default:
        console.warn('Unknown selector type:', type);
        return null;
    }
  }

  private getEligibleInputs(container: Element): HTMLInputElement[] {
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

  private async fillInput(input: HTMLInputElement, value: string): Promise<void> {
    // Set the value
    input.value = value;

    // Dispatch events to notify the page
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new Event('blur', { bubbles: true })
    ];

    events.forEach(event => {
      input.dispatchEvent(event);
    });

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
