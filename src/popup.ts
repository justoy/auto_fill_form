import { UserProfile, ProfileCategory, LLMConfig } from './types';

class PopupManager {
  private profiles: UserProfile[] = [];
  private activeProfile: UserProfile | null = null;
  private llmConfig: LLMConfig = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-5-mini'
  };
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderUI();
  }

  private async loadData() {
    try {
      // Load LLM config
      const configResponse = await this.sendMessage({ action: 'GET_LLM_CONFIG' });
      if (configResponse.success) {
        this.llmConfig = configResponse.config;
      }

      // Load enabled setting
      const enabledResponse = await this.sendMessage({ action: 'GET_ENABLED' });
      if (enabledResponse.success) {
        this.enabled = enabledResponse.enabled;
      }

      // Load profiles
      await this.loadProfiles();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private async loadProfiles() {
    try {
      const response = await this.sendMessage({ action: 'GET_PROFILES' });
      if (response.success) {
        this.profiles = response.profiles;

        // Get active profile
        const activeResponse = await this.sendMessage({ action: 'GET_ACTIVE_PROFILE' });
        if (activeResponse.success && activeResponse.profile) {
          this.activeProfile = activeResponse.profile;
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }

  private setupEventListeners() {
    // General Settings
    document.getElementById('autoFillEnabled')?.addEventListener('change', (e) => {
      this.saveEnabled((e.target as HTMLInputElement).checked);
    });

    // LLM Configuration
    document.getElementById('saveLLMConfig')?.addEventListener('click', () => {
      this.saveLLMConfig();
    });

    // Profile management
    document.getElementById('profileSelect')?.addEventListener('change', (e) => {
      this.onProfileSelect((e.target as HTMLSelectElement).value);
    });

    document.getElementById('createProfile')?.addEventListener('click', () => {
      this.createProfile();
    });

    document.getElementById('renameProfile')?.addEventListener('click', () => {
      this.renameProfile();
    });

    document.getElementById('deleteProfile')?.addEventListener('click', () => {
      this.deleteProfile();
    });

    document.getElementById('saveProfile')?.addEventListener('click', () => {
      this.saveProfile();
    });

    document.getElementById('addCategory')?.addEventListener('click', () => {
      this.addCategory();
    });

    // Enter key on new category input
    document.getElementById('newCategoryName')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCategory();
      }
    });
  }

  private renderUI() {
    this.renderEnabledSetting();
    this.renderLLMConfig();
    this.renderProfileSelector();
    this.renderProfile();
  }

  private renderEnabledSetting() {
    const enabledCheckbox = document.getElementById('autoFillEnabled') as HTMLInputElement;
    if (enabledCheckbox) {
      enabledCheckbox.checked = this.enabled;
    }
  }

  private renderLLMConfig() {
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    const modelSelect = document.getElementById('model') as HTMLSelectElement;

    if (apiKeyInput) {
      apiKeyInput.value = this.llmConfig.apiKey || '';
    }

    if (modelSelect) {
      modelSelect.value = this.llmConfig.model || 'gpt-5-mini';
    }
  }

  private renderProfileSelector() {
    const select = document.getElementById('profileSelect') as HTMLSelectElement;
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select Profile...</option>';

    // Add profile options
    this.profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      if (this.activeProfile && profile.id === this.activeProfile.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  private renderProfile() {
    const container = document.getElementById('profileCategories');
    if (!container) return;

    container.innerHTML = '';

    if (!this.activeProfile) {
      container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No profile selected</p>';
      return;
    }

    // Render categories
    this.activeProfile.categories.forEach(category => {
      const categoryDiv = this.createCategoryElement(category);
      container.appendChild(categoryDiv);
    });
  }

  private createCategoryElement(category: ProfileCategory): HTMLElement {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    // Category header
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
    addFieldBtn.addEventListener('click', () => {
      this.addFieldToCategory(category.id);
    });

    const removeCategoryBtn = document.createElement('button');
    removeCategoryBtn.className = 'remove-btn';
    removeCategoryBtn.textContent = '×';
    removeCategoryBtn.addEventListener('click', () => {
      this.removeCategory(category.id);
    });

    actions.appendChild(addFieldBtn);
    actions.appendChild(removeCategoryBtn);
    header.appendChild(title);
    header.appendChild(actions);
    categoryDiv.appendChild(header);

    // Category fields
    category.fields.forEach(field => {
      const fieldDiv = this.createFieldElement(category.id, field);
      categoryDiv.appendChild(fieldDiv);
    });

    return categoryDiv;
  }

  private createFieldElement(categoryId: string, field: any): HTMLElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'profile-field';

    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = field.label || field.key;

    const input = document.createElement('input');
    input.className = 'field-input';
    input.type = 'text';
    input.value = field.value;
    input.placeholder = field.label || field.key;
    input.addEventListener('input', () => {
      this.updateFieldValue(categoryId, field.key, input.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      this.removeField(categoryId, field.key);
    });

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    fieldDiv.appendChild(removeBtn);

    return fieldDiv;
  }

  private async onProfileSelect(profileId: string) {
    if (!profileId) {
      this.activeProfile = null;
      this.renderProfile();
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'SET_ACTIVE_PROFILE', profileId });
      if (response.success) {
        await this.loadProfiles();
        this.renderUI();
      }
    } catch (error) {
      console.error('Failed to set active profile:', error);
    }
  }

  private async createProfile() {
    const name = prompt('Enter profile name:');
    if (!name || !name.trim()) {
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'CREATE_PROFILE', name: name.trim() });
      if (response.success) {
        await this.loadProfiles();
        this.activeProfile = response.profile;
        this.renderUI();
        this.showStatus('Profile created successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      this.showStatus('Failed to create profile', 'error');
    }
  }

  private async renameProfile() {
    if (!this.activeProfile) {
      this.showStatus('No profile selected', 'error');
      return;
    }

    const newName = prompt('Enter new profile name:', this.activeProfile.name);
    if (!newName || !newName.trim()) {
      return;
    }

    const updatedProfile = { ...this.activeProfile, name: newName.trim() };
    try {
      const response = await this.sendMessage({ action: 'UPDATE_PROFILE', profile: updatedProfile });
      if (response.success) {
        await this.loadProfiles();
        this.renderUI();
        this.showStatus('Profile renamed successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to rename profile:', error);
      this.showStatus('Failed to rename profile', 'error');
    }
  }

  private async deleteProfile() {
    if (!this.activeProfile) {
      this.showStatus('No profile selected', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete the profile "${this.activeProfile.name}"?`)) {
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'DELETE_PROFILE', profileId: this.activeProfile.id });
      if (response.success) {
        this.activeProfile = null;
        await this.loadProfiles();
        this.renderUI();
        this.showStatus('Profile deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      this.showStatus('Failed to delete profile', 'error');
    }
  }

  private async saveProfile() {
    if (!this.activeProfile) {
      this.showStatus('No profile selected', 'error');
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'UPDATE_PROFILE', profile: this.activeProfile });
      if (response.success) {
        this.showStatus('Profile saved successfully', 'success');
      } else {
        this.showStatus(response.error || 'Failed to save profile', 'error');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      this.showStatus('Failed to save profile', 'error');
    }
  }

  private addCategory() {
    if (!this.activeProfile) {
      this.showStatus('No profile selected', 'error');
      return;
    }

    const input = document.getElementById('newCategoryName') as HTMLInputElement;
    if (!input) return;

    const categoryName = input.value.trim();
    if (!categoryName) {
      this.showStatus('Please enter a category name', 'error');
      return;
    }

    // Check if category already exists
    if (this.activeProfile.categories.some(cat => cat.name === categoryName)) {
      this.showStatus('Category already exists', 'error');
      return;
    }

    const newCategory: ProfileCategory = {
      id: this.generateId(),
      name: categoryName,
      fields: []
    };

    this.activeProfile.categories.push(newCategory);
    input.value = '';
    this.renderProfile();
    this.showStatus('Category added successfully', 'success');
  }

  private addFieldToCategory(categoryId: string) {
    if (!this.activeProfile) return;

    const fieldName = prompt('Enter field name:');
    if (!fieldName || !fieldName.trim()) return;

    const category = this.activeProfile.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Generate a unique field key
    let fieldKey = this.generateFieldKey(fieldName);
    let counter = 1;
    
    // Ensure uniqueness across entire profile
    while (this.isFieldKeyTaken(fieldKey)) {
      fieldKey = `${this.generateFieldKey(fieldName)}_${counter}`;
      counter++;
    }

    category.fields.push({
      key: fieldKey,
      value: '',
      label: fieldName.trim()
    });

    this.renderProfile();
    this.showStatus('Field added successfully', 'success');
  }

  private generateFieldKey(fieldName: string): string {
    return fieldName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscores
      .replace(/^_+|_+$/g, '');     // Remove leading/trailing underscores
  }

  private isFieldKeyTaken(fieldKey: string): boolean {
    if (!this.activeProfile) return false;
    
    return this.activeProfile.categories.some(category => 
      category.fields.some(field => field.key === fieldKey)
    );
  }

  private removeCategory(categoryId: string) {
    if (!this.activeProfile) return;

    const category = this.activeProfile.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    this.activeProfile.categories = this.activeProfile.categories.filter(cat => cat.id !== categoryId);
    this.renderProfile();
    this.showStatus('Category removed successfully', 'success');
  }

  private removeField(categoryId: string, fieldKey: string) {
    if (!this.activeProfile) return;

    const category = this.activeProfile.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    category.fields = category.fields.filter(field => field.key !== fieldKey);
    this.renderProfile();
    this.showStatus('Field removed successfully', 'success');
  }

  private updateFieldValue(categoryId: string, fieldKey: string, value: string) {
    if (!this.activeProfile) return;

    const category = this.activeProfile.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const field = category.fields.find(field => field.key === fieldKey);
    if (field) {
      field.value = value;
    }
  }

  private async saveEnabled(enabled: boolean) {
    this.enabled = enabled;

    try {
      const response = await this.sendMessage({
        action: 'SAVE_ENABLED',
        enabled
      });

      if (response.success) {
        this.showStatus(`Auto-fill ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      } else {
        this.showStatus(response.error || 'Failed to save setting', 'error');
      }
    } catch (error) {
      console.error('Failed to save enabled setting:', error);
      this.showStatus('Failed to save setting', 'error');
    }
  }

  private async saveLLMConfig() {
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    const modelSelect = document.getElementById('model') as HTMLSelectElement;

    if (!apiKeyInput || !modelSelect) return;

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      this.showStatus('Please enter an API key', 'error');
      return;
    }

    this.llmConfig = {
      provider: 'openai',
      apiKey,
      model: modelSelect.value
    };

    try {
      const response = await this.sendMessage({
        action: 'SAVE_LLM_CONFIG',
        config: this.llmConfig
      });

      if (response.success) {
        this.showStatus('LLM configuration saved successfully', 'success');
      } else {
        this.showStatus(response.error || 'Failed to save configuration', 'error');
      }
    } catch (error) {
      console.error('Failed to save LLM config:', error);
      this.showStatus('Failed to save configuration', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
