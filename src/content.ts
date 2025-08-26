import { FormDetector } from './form-detection';
import { FormFiller } from './form-filler';
import { UIManager } from './ui-manager';

class ContentScript {
  private formDetector = new FormDetector();
  private formFiller = new FormFiller();
  private uiManager = new UIManager();

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
              if (element.tagName === 'FORM' || this.formDetector.hasFormLikeContent(element)) {
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
    const forms = this.formDetector.detectForms();
    console.log('Forms detected:', forms);
    forms.forEach((formInfo) => {
      if (!this.uiManager.hasExistingButton(formInfo.element)) {
        this.uiManager.injectButton(formInfo, () => this.formFiller.handleAutofill(formInfo));
      }
    });
  }
}

// Initialize the content script
new ContentScript();
