export function renderEnabled(enabled: boolean): void {
  const enabledCheckbox = document.getElementById('autoFillEnabled') as HTMLInputElement | null;
  if (enabledCheckbox) {
    enabledCheckbox.checked = enabled;
  }
}

export function bindEnabledToggle(onToggle: (enabled: boolean) => void): void {
  const enabledCheckbox = document.getElementById('autoFillEnabled') as HTMLInputElement | null;
  if (!enabledCheckbox) return;
  enabledCheckbox.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    onToggle(target.checked);
  });
}


