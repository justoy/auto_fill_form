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
    // Get all input fields that need autofill
    const inputs = this.getEligibleInputs(element);

    // Create a simplified representation of each input field
    const fieldData = inputs.map((input, index) => {
      const field: any = {
        index,
        tagName: input.tagName.toLowerCase(),
        type: input.type || 'text',
        name: input.name || '',
        id: input.id || '',
        placeholder: input.placeholder || '',
        'aria-label': input.getAttribute('aria-label') || '',
        'aria-describedby': input.getAttribute('aria-describedby') || '',
        class: input.className || '',
        required: input.hasAttribute('required'),
        maxlength: input.getAttribute('maxlength') || '',
        pattern: input.getAttribute('pattern') || ''
      };

      // Add label text if available
      const label = this.findLabelForInput(input);
      if (label) {
        field.label = label.textContent?.trim() || '';
      }

      // For select elements, include option values (not text to avoid sensitive data)
      if (input.tagName.toLowerCase() === 'select') {
        const selectElement = input as unknown as HTMLSelectElement;
        field.options = Array.from(selectElement.options).map(option => ({
          value: option.value,
          // Don't include text content to avoid potential sensitive data
        }));
      }

      // For textarea, include additional attributes
      if (input.tagName.toLowerCase() === 'textarea') {
        const textarea = input as unknown as HTMLTextAreaElement;
        field.rows = textarea.rows || '';
        field.cols = textarea.cols || '';
      }

      return field;
    });

    return JSON.stringify(fieldData, null, 2);
  }

  private findLabelForInput(input: HTMLInputElement): HTMLLabelElement | null {
    // Try to find label by 'for' attribute
    if (input.id) {
      const label = input.ownerDocument?.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement;
      if (label) return label;
    }

    // Try to find label as parent or sibling
    let parent = input.parentElement;
    while (parent) {
      const label = parent.querySelector('label');
      if (label) return label as HTMLLabelElement;
      parent = parent.parentElement;
    }

    return null;
  }

  private async fillForm(formInfo: FormInfo, mapping: FormMapping, profile: UserProfile): Promise<void> {
    for (const [selector, profileKey] of Object.entries(mapping)) {
      const value = this.getProfileValue(profile, profileKey);
      if (!value) continue;

      const input = this.findInputBySelector(formInfo.element, selector);
      if (input) {
        await this.fillInput(input, value);
      }
    }
  }

  private getProfileValue(profile: UserProfile, profileKey: string): string {
    // Check if profile has the new categorized structure
    if (profile.categories && Array.isArray(profile.categories)) {
      // Search through all categories for the field
      for (const category of profile.categories) {
        const field = category.fields.find(f => f.key === profileKey);
        if (field) {
          return field.value;
        }
      }
      return '';
    }

    // Fallback for legacy profile structure
    return (profile as any)[profileKey] || '';
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
