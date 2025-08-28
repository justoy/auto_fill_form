import { FormDetector } from './form-detection';
import { FormFiller } from './form-filler';

class ContentScript {
  private formDetector = new FormDetector();
  private formFiller = new FormFiller();
  private processedForms = new WeakSet<HTMLElement>();

  constructor() {
    this.init();
  }

  private init() {
    // Run immediately and on DOM changes
    this.detectAndAutoFillForms();
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
        setTimeout(() => this.detectAndAutoFillForms(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private detectAndAutoFillForms() {
    const forms = this.formDetector.detectForms();
    console.log('Forms detected:', forms);
    forms.forEach((formInfo) => {
      if (!this.hasFormBeenProcessed(formInfo.element)) {
        // Mark form as processed to prevent duplicate fills
        this.markFormAsProcessed(formInfo.element);
        // Automatically fill the form
        this.formFiller.handleAutofill(formInfo).catch(error => {
          console.error('Auto-fill failed for form:', error);
          // Remove the processed mark on failure so it can be retried
          this.removeProcessedMark(formInfo.element);
        });
      }
    });
  }

  private hasFormBeenProcessed(element: HTMLElement): boolean {
    return this.processedForms.has(element);
  }

  private markFormAsProcessed(element: HTMLElement): void {
    this.processedForms.add(element);
  }

  private removeProcessedMark(element: HTMLElement): void {
    this.processedForms.delete(element);
  }
}

// Initialize the content script
new ContentScript();
