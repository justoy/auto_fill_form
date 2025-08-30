export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export function setButtonState(buttonId: string, state: ButtonState): void {
  const btn = document.getElementById(buttonId) as HTMLButtonElement;
  if (!btn) return;

  const label = btn.querySelector('.btn__label') as HTMLElement;
  if (!label) return;

  // Remove all existing state classes
  btn.classList.remove('is-loading', 'is-success', 'is-error');
  btn.disabled = false;

  switch (state) {
    case 'loading':
      btn.classList.add('is-loading');
      btn.disabled = true;
      label.textContent = 'Saving...';
      btn.setAttribute('aria-label', 'Saving configuration');
      break;

    case 'success':
      btn.classList.add('is-success');
      label.textContent = 'Saved!';
      btn.setAttribute('aria-label', 'Configuration saved successfully');
      // Auto-revert after animation
      setTimeout(() => {
        btn.classList.remove('is-success');
        label.textContent = 'Save';
        btn.setAttribute('aria-label', 'Save configuration');
      }, 900);
      break;

    case 'error':
      btn.classList.add('is-error');
      label.textContent = 'Retry';
      btn.setAttribute('aria-label', 'Save failed. Retry');
      break;

    default: // idle
      label.textContent = 'Save';
      btn.setAttribute('aria-label', 'Save configuration');
      break;
  }
}
