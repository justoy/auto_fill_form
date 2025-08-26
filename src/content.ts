import { FormInfo, FormMapping, UserProfile } from './types';

class ContentScript {
  private static readonly BUTTON_ID_PREFIX = 'llm-autofill-btn-';
  private static readonly BUTTON_CLASS = 'llm-autofill-button';

  // Configurable keywords for form detection
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

  private formCounter = 0;

  constructor() {
    this.init();
  }

  private init() {
    // Run immediately and on DOM changes
    this.detectAndInjectButtons();
    this.observePageChanges();
  }

  private observePageChanges() {
    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let shouldReprocess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'FORM' || this.hasFormLikeContent(element)) {
                shouldReprocess = true;
              }
            }
          });
        }
      });

      if (shouldReprocess) {
        // Debounce to avoid excessive processing
        setTimeout(() => this.detectAndInjectButtons(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private detectAndInjectButtons() {
    const forms = this.detectForms();
    
    forms.forEach((formInfo) => {
      if (!this.hasExistingButton(formInfo.element)) {
        this.injectButton(formInfo);
      }
    });
  }

  private detectForms(): FormInfo[] {
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

  private isNavigationContainer(container: Element): boolean {
    // Skip navigation-related containers
    return ContentScript.NAVIGATION_SELECTORS.some(selector =>
      container.matches(selector) || container.closest(selector)
    );
  }

  private hasFormLikeInputs(inputs: HTMLInputElement[]): boolean {
    // Check if inputs look like actual form fields (not just filters/search)
    const formLikePatterns = ContentScript.FORM_LIKE_PATTERNS;
    const filterPatterns = ContentScript.FILTER_PATTERNS;

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

  private hasExistingButton(element: HTMLElement): boolean {
    // Check if button exists within the element or nearby
    const existingButton = element.querySelector(`.${ContentScript.BUTTON_CLASS}`) ||
                          element.parentNode?.querySelector(`.${ContentScript.BUTTON_CLASS}`);
    return !!existingButton;
  }

  private injectButton(formInfo: FormInfo) {
    const button = this.createButton();
    const buttonId = `${ContentScript.BUTTON_ID_PREFIX}${this.formCounter++}`;
    button.id = buttonId;

    // Position button relative to the form
    this.positionButton(button, formInfo.element);

    // Add click handler
    button.addEventListener('click', () => {
      this.handleAutofillClick(formInfo);
    });

    // Insert the button
    if (formInfo.element.parentNode) {
      formInfo.element.parentNode.insertBefore(button, formInfo.element);
    }
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = ContentScript.BUTTON_CLASS;
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

  private positionButton(button: HTMLButtonElement, formElement: HTMLElement) {
    // Try to position the button above the form for better visibility
    const rect = formElement.getBoundingClientRect();
    
    // If form is near the top, put button below; otherwise above
    if (rect.top < 100) {
      formElement.parentNode?.insertBefore(button, formElement.nextSibling);
    } else {
      formElement.parentNode?.insertBefore(button, formElement);
    }
  }

  private async handleAutofillClick(formInfo: FormInfo) {
    const button = formInfo.element.parentNode?.querySelector(`.${ContentScript.BUTTON_CLASS}`) as HTMLButtonElement;
    
    if (!button) return;

    // Update button state
    const originalText = button.textContent;
    button.textContent = '🔄 Processing...';
    button.disabled = true;

    try {
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

  private async fillForm(formInfo: FormInfo, mapping: FormMapping, profile: UserProfile) {
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
        const inputs = this.getEligibleInputs(container);
        const index = parseInt(value, 10);
        return inputs[index] || null;
      
      default:
        console.warn('Unknown selector type:', type);
        return null;
    }
  }

  private async fillInput(input: HTMLInputElement, value: string) {
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

  private hasFormLikeContent(element: Element): boolean {
    const inputs = this.getEligibleInputs(element);
    return inputs.length >= 2;
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize the content script
new ContentScript();
