/**
 * UI Management Module
 *
 * Handles button creation and user interface interactions including:
 * - Creating and styling autofill buttons
 * - Positioning buttons relative to forms
 * - Managing button states during processing
 * - Handling button click events and user feedback
 */

import { FormInfo } from './types';

export class UIManager {
  private static readonly BUTTON_ID_PREFIX = 'llm-autofill-btn-';
  private static readonly BUTTON_CLASS = 'llm-autofill-button';

  private formCounter = 0;

  public hasExistingButton(element: HTMLElement): boolean {
    // Check if button exists within the element or nearby
    const existingButton = element.querySelector(`.${UIManager.BUTTON_CLASS}`) ||
                          element.parentNode?.querySelector(`.${UIManager.BUTTON_CLASS}`);
    return !!existingButton;
  }

  public injectButton(formInfo: FormInfo, onClick: () => Promise<void>): void {
    const button = this.createButton();
    const buttonId = `${UIManager.BUTTON_ID_PREFIX}${this.formCounter++}`;
    button.id = buttonId;

    // Position button relative to the form
    this.positionButton(button, formInfo.element);

    // Add click handler
    button.addEventListener('click', async () => {
      await this.handleButtonClick(button, onClick);
    });

    // Insert the button
    if (formInfo.element.parentNode) {
      formInfo.element.parentNode.insertBefore(button, formInfo.element);
    }
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = UIManager.BUTTON_CLASS;
    button.textContent = '🤖 Auto Fill with LLM';
    button.type = 'button';

    // Add some basic styling
    Object.assign(button.style, {
      background: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      margin: '8px 0',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s',
      zIndex: '10000',
      position: 'relative'
    });

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.background = '#45a049';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#4CAF50';
    });

    return button;
  }

  private positionButton(button: HTMLButtonElement, formElement: HTMLElement): void {
    // First, try to find a submit button within the form
    const submitButton = this.findSubmitButton(formElement);

    if (submitButton) {
      console.log('Positioning button near submit button:', submitButton);
      // Position near the submit button
      const submitParent = submitButton.parentNode;
      if (submitParent) {
        // Insert right before the submit button for better proximity
        submitParent.insertBefore(button, submitButton);

        // Add some spacing between the autofill button and submit button
        button.style.marginRight = '8px';
        button.style.marginBottom = '4px';
        console.log('Button positioned before submit button');
      } else {
        console.log('Submit button has no parent, using fallback');
        // Fallback if submit button has no parent
        const rect = formElement.getBoundingClientRect();
        if (rect.top < 100) {
          formElement.parentNode?.insertBefore(button, formElement.nextSibling);
        } else {
          formElement.parentNode?.insertBefore(button, formElement);
        }
      }
    } else {
      console.log('No submit button found, using fallback positioning');
      // Fallback to original positioning logic
      const rect = formElement.getBoundingClientRect();

      // If form is near the top, put button below; otherwise above
      if (rect.top < 100) {
        formElement.parentNode?.insertBefore(button, formElement.nextSibling);
      } else {
        formElement.parentNode?.insertBefore(button, formElement);
      }
    }
  }

  private findSubmitButton(formElement: HTMLElement): HTMLInputElement | HTMLButtonElement | null {
    // Look for submit buttons by type and value
    const submitInputs = formElement.querySelectorAll('input[type="submit"], input[value*="submit" i]');
    if (submitInputs.length > 0) {
      console.log('Found submit input:', submitInputs[0]);
      return submitInputs[0] as HTMLInputElement;
    }

    // Look for button elements with submit type or text
    const submitButtons = formElement.querySelectorAll('button[type="submit"], button[value*="submit" i]');
    if (submitButtons.length > 0) {
      console.log('Found submit button:', submitButtons[0]);
      return submitButtons[0] as HTMLButtonElement;
    }

    // Look for any button that might be a submit button (common patterns)
    const allButtons = formElement.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      const value = (btn as HTMLButtonElement).value?.toLowerCase() || '';
      if (text.includes('submit') || text.includes('send') || value.includes('submit')) {
        console.log('Found submit-like button:', btn);
        return btn as HTMLButtonElement;
      }
    }

    console.log('No submit button found in form:', formElement);
    return null;
  }

  private async handleButtonClick(button: HTMLButtonElement, onClick: () => Promise<void>): Promise<void> {
    // Update button state
    const originalText = button.textContent;
    button.textContent = '🔄 Processing...';
    button.disabled = true;

    try {
      await onClick();

      // Success feedback
      button.textContent = '✅ Filled!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Autofill failed:', error);

      // Error feedback
      button.textContent = '❌ Failed';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }
}
