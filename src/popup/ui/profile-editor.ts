import { UserProfile, ProfileCategory } from '../../types';
import { generateId, generateFieldKey, isFieldKeyTaken } from '../utils';

type Handlers = {
  onAddField: (categoryId: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onRemoveField: (categoryId: string, fieldKey: string) => void;
  onUpdateField: (categoryId: string, fieldKey: string, value: string) => void;
};

export function renderProfileEditor(profile: UserProfile | null, handlers: Handlers): void {
  const container = document.getElementById('profileCategories');
  if (!container) return;

  container.innerHTML = '';

  if (!profile) {
    container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No profile selected</p>';
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

  const label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = fieldLabel;

  const input = document.createElement('input');
  input.className = 'field-input';
  input.type = 'text';
  input.value = fieldValue;
  input.placeholder = fieldLabel;
  input.addEventListener('input', () => handlers.onUpdateField(categoryId, fieldKey, input.value));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => handlers.onRemoveField(categoryId, fieldKey));

  fieldDiv.appendChild(label);
  fieldDiv.appendChild(input);
  fieldDiv.appendChild(removeBtn);

  return fieldDiv;
}

// Pure operations to mutate the UserProfile model
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

  let fieldKey = generateFieldKey(fieldName);
  let counter = 1;
  while (isFieldKeyTaken(profile, fieldKey)) {
    fieldKey = `${generateFieldKey(fieldName)}_${counter}`;
    counter++;
  }

  category.fields.push({ key: fieldKey, value: '', label: fieldName.trim() });
}

export function removeCategoryFromProfile(profile: UserProfile, categoryId: string): void {
  profile.categories = profile.categories.filter((c) => c.id !== categoryId);
}

export function removeFieldFromCategory(profile: UserProfile, categoryId: string, fieldKey: string): void {
  const category = profile.categories.find((c) => c.id === categoryId);
  if (!category) return;
  category.fields = category.fields.filter((f) => f.key !== fieldKey);
}

export function updateFieldValueInProfile(profile: UserProfile, categoryId: string, fieldKey: string, value: string): void {
  const category = profile.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const field = category.fields.find((f) => f.key === fieldKey);
  if (field) field.value = value;
}


