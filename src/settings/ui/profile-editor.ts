import { UserProfile, ProfileCategory } from '../../types';
import { generateId, generateFieldKey, isFieldKeyTaken } from '../utils';

export function renderProfileEditor(profile: UserProfile | null, handlers: Handlers): void {
  const container = document.getElementById('profileCategories');
  if (!container) return;

  container.innerHTML = '';

  if (!profile) {
    const msg = document.createElement('div');
    msg.className = 'profile-empty';
    msg.textContent = 'No profile selected.';
    container.appendChild(msg);
    return;
  }

  profile.categories.forEach((category) => {
    const categoryDiv = createCategoryElement(category, handlers);
    container.appendChild(categoryDiv);
  });
}

export function bindProfileEditor(onAddCategory: () => void): void {
  const addCategoryBtn = document.getElementById('addCategory');
  addCategoryBtn?.addEventListener('click', () => onAddCategory());

  const newCategoryInput = document.getElementById('newCategoryName');
  newCategoryInput?.addEventListener('keypress', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      onAddCategory();
    }
  });
}

function createCategoryElement(category: ProfileCategory, handlers: Handlers): HTMLElement {
  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'category';

  const header = document.createElement('div');
  header.className = 'category-header';

  const title = document.createElement('h3');
  title.className = 'category-title';
  title.textContent = category.name;

  const actions = document.createElement('div');
  actions.className = 'category-actions';

  const addFieldBtn = document.createElement('button');
  addFieldBtn.className = 'add-field-btn';
  addFieldBtn.textContent = '+ Field';
  addFieldBtn.addEventListener('click', () => handlers.onAddField(category.id));

  const removeCategoryBtn = document.createElement('button');
  removeCategoryBtn.className = 'remove-btn';
  removeCategoryBtn.textContent = '×';
  removeCategoryBtn.addEventListener('click', () => handlers.onRemoveCategory(category.id));

  actions.appendChild(addFieldBtn);
  actions.appendChild(removeCategoryBtn);
  header.appendChild(title);
  header.appendChild(actions);
  categoryDiv.appendChild(header);

  category.fields.forEach((field) => {
    const fieldDiv = createFieldElement(category.id, field.key, field.label || field.key, field.value, handlers);
    categoryDiv.appendChild(fieldDiv);
  });

  return categoryDiv;
}

function createFieldElement(
  categoryId: string,
  fieldKey: string,
  fieldLabel: string,
  fieldValue: string,
  handlers: Handlers
): HTMLElement {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'profile-field';

  const label = document.createElement('div');
  label.className = 'field-label';
  label.textContent = fieldLabel;

  const inputContainer = document.createElement('div');
  inputContainer.className = 'field-input';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = fieldValue || '';
  input.placeholder = 'Enter value';
  input.addEventListener('change', (e) => {
    const newValue = (e.target as HTMLInputElement).value;
    handlers.onUpdateFieldValue(categoryId, fieldKey, newValue);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => handlers.onRemoveField(categoryId, fieldKey));

  inputContainer.appendChild(input);
  fieldDiv.appendChild(label);
  fieldDiv.appendChild(inputContainer);
  fieldDiv.appendChild(removeBtn);

  return fieldDiv;
}

export function addCategoryToProfile(profile: UserProfile, categoryName: string): void {
  const newCategory: ProfileCategory = {
    id: generateId(),
    name: categoryName,
    fields: [],
  };
  profile.categories.push(newCategory);
}

export function addFieldToCategory(profile: UserProfile, categoryId: string, fieldName: string): void {
  const category = profile.categories.find((c) => c.id === categoryId);
  if (!category) return;

  const fieldKey = generateFieldKey(fieldName);
  if (!fieldKey || isFieldKeyTaken(profile, fieldKey)) return;

  category.fields.push({ key: fieldKey, label: fieldName, value: '' });
}

export function removeCategoryFromProfile(profile: UserProfile, categoryId: string): void {
  profile.categories = profile.categories.filter((c) => c.id !== categoryId);
}

export function removeFieldFromCategory(profile: UserProfile, categoryId: string, fieldKey: string): void {
  const category = profile.categories.find((c) => c.id === categoryId);
  if (!category) return;
  category.fields = category.fields.filter((f) => f.key !== fieldKey);
}

export function updateFieldValueInProfile(
  profile: UserProfile,
  categoryId: string,
  fieldKey: string,
  value: string
): void {
  const category = profile.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const field = category.fields.find((f) => f.key === fieldKey);
  if (!field) return;
  field.value = value;
}

type Handlers = {
  onAddField: (categoryId: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onRemoveField: (categoryId: string, fieldKey: string) => void;
  onUpdateFieldValue: (categoryId: string, fieldKey: string, value: string) => void;
};

