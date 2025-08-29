import { UserProfile } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateFieldKey(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function isFieldKeyTaken(profile: UserProfile, fieldKey: string): boolean {
  return profile.categories.some((category) =>
    category.fields.some((field) => field.key === fieldKey)
  );
}


