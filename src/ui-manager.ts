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
    const existingButton = element.querySelector(`.${UIManager.BUTTON_CLASS}`);
    return !!existingButton;
  }

  public injectButton(formInfo: FormInfo, onClick: () => Promise<void>): void {
    const button = this.createButton();
    const buttonId = `${UIManager.BUTTON_ID_PREFIX}${this.formCounter++}`;
    button.id = buttonId;

    // Add click handler first
    button.addEventListener('click', async () => {
      await this.handleButtonClick(button, onClick);
    });

    // Position button relative to the form
    this.positionButton(button, formInfo.element);
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
    console.log('Form Element:', formElement, 'button', button);
    formElement.appendChild(button);
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
