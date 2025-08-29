import { UserProfile } from '../../types';

export function renderProfileSelector(profiles: UserProfile[], activeProfileId: string | null): void {
  const select = document.getElementById('profileSelect') as HTMLSelectElement | null;
  if (!select) return;

  select.innerHTML = '<option value="">Select Profile...</option>';

  profiles.forEach((profile) => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    if (activeProfileId && profile.id === activeProfileId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

export function bindProfileActions(callbacks: {
  onSelect: (profileId: string) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onSave: () => void;
}): void {
  const select = document.getElementById('profileSelect') as HTMLSelectElement | null;
  if (select) {
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      callbacks.onSelect(target.value);
    });
  }

  const createBtn = document.getElementById('createProfile');
  createBtn?.addEventListener('click', () => callbacks.onCreate());

  const renameBtn = document.getElementById('renameProfile');
  renameBtn?.addEventListener('click', () => callbacks.onRename());

  const deleteBtn = document.getElementById('deleteProfile');
  deleteBtn?.addEventListener('click', () => callbacks.onDelete());

  const saveBtn = document.getElementById('saveProfile');
  saveBtn?.addEventListener('click', () => callbacks.onSave());
}


