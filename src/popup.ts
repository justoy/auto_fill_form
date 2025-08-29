import { UserProfile, LLMConfig } from './types';
import { showStatus as showStatusToast } from './popup/ui/status';
import * as api from './popup/api';
import { renderLLMConfig as uiRenderLLMConfig, renderProviderConfig as uiRenderProviderConfig } from './popup/ui/llm-config';
import { renderEnabled as uiRenderEnabled, bindEnabledToggle } from './popup/ui/enabled';
import { renderProfileSelector as uiRenderProfileSelector, bindProfileActions } from './popup/ui/profile-select';
import { renderProfileEditor as uiRenderProfileEditor, bindProfileEditor, addCategoryToProfile, addFieldToCategory as modelAddFieldToCategory, removeCategoryFromProfile, removeFieldFromCategory, updateFieldValueInProfile } from './popup/ui/profile-editor';

class PopupManager {
  private profiles: UserProfile[] = [];
  private activeProfile: UserProfile | null = null;
  private llmConfig: LLMConfig = {
    provider: 'openai',
    apiKey: ''
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
      const configResponse = await api.getLLMConfig();
      if (configResponse.success) {
        this.llmConfig = configResponse.config;
      }

      const enabledResponse = await api.getEnabled();
      if (enabledResponse.success) {
        this.enabled = enabledResponse.enabled;
      }

      await this.loadProfiles();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private async loadProfiles() {
    try {
      const response = await api.getProfiles();
      if (response.success) {
        this.profiles = response.profiles;

        const activeResponse = await api.getActiveProfile();
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
    bindEnabledToggle((enabled) => this.saveEnabled(enabled));

    // LLM Configuration
    document.getElementById('providerSelect')?.addEventListener('change', (e) => {
      this.onProviderSelect((e.target as HTMLSelectElement).value);
    });
    document.getElementById('saveLLMConfig')?.addEventListener('click', () => {
      this.saveLLMConfig();
    });

    // Profile management
    bindProfileActions({
      onSelect: (profileId) => this.onProfileSelect(profileId),
      onCreate: () => this.createProfile(),
      onRename: () => this.renameProfile(),
      onDelete: () => this.deleteProfile(),
      onSave: () => this.saveProfile(),
    });

    bindProfileEditor(() => this.addCategory());
  }

  private renderUI() {
    this.renderEnabledSetting();
    this.renderLLMConfig();
    this.renderProfileSelector();
    this.renderProfile();
  }

  private renderEnabledSetting() {
    uiRenderEnabled(this.enabled);
  }

  private renderLLMConfig() {
    uiRenderLLMConfig(this.llmConfig);
  }

  private onProviderSelect(provider: string) {
    // Update the configuration provider
    this.llmConfig.provider = provider as any;

    // Clear the API key when switching providers
    this.llmConfig.apiKey = '';

    // Re-render the configuration fields
    uiRenderProviderConfig(this.llmConfig.provider, this.llmConfig.apiKey);
  }

  private renderProfileSelector() {
    uiRenderProfileSelector(this.profiles, this.activeProfile ? this.activeProfile.id : null);
  }

  private renderProfile() {
    uiRenderProfileEditor(this.activeProfile, {
      onAddField: (categoryId) => this.addFieldToCategory(categoryId),
      onRemoveCategory: (categoryId) => this.removeCategory(categoryId),
      onRemoveField: (categoryId, fieldKey) => this.removeField(categoryId, fieldKey),
      onUpdateField: (categoryId, fieldKey, value) => this.updateFieldValue(categoryId, fieldKey, value),
    });
  }

  private async onProfileSelect(profileId: string) {
    if (!profileId) {
      this.activeProfile = null;
      this.renderProfile();
      return;
    }

    try {
      const response = await api.setActiveProfile(profileId);
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
      const response = await api.createProfile(name.trim());
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
      const response = await api.updateProfile(updatedProfile);
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
      const response = await api.deleteProfile(this.activeProfile.id);
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
      const response = await api.updateProfile(this.activeProfile);
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

    addCategoryToProfile(this.activeProfile, categoryName);
    input.value = '';
    this.renderProfile();
    this.showStatus('Category added successfully', 'success');
  }

  private addFieldToCategory(categoryId: string) {
    if (!this.activeProfile) return;

    const fieldName = prompt('Enter field name:');
    if (!fieldName || !fieldName.trim()) return;

    modelAddFieldToCategory(this.activeProfile, categoryId, fieldName);

    this.renderProfile();
    this.showStatus('Field added successfully', 'success');
  }

  // key helpers moved to utils.ts

  private removeCategory(categoryId: string) {
    if (!this.activeProfile) return;

    const category = this.activeProfile.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    removeCategoryFromProfile(this.activeProfile, categoryId);
    this.renderProfile();
    this.showStatus('Category removed successfully', 'success');
  }

  private removeField(categoryId: string, fieldKey: string) {
    if (!this.activeProfile) return;

    removeFieldFromCategory(this.activeProfile, categoryId, fieldKey);
    this.renderProfile();
    this.showStatus('Field removed successfully', 'success');
  }

  private updateFieldValue(categoryId: string, fieldKey: string, value: string) {
    if (!this.activeProfile) return;

    updateFieldValueInProfile(this.activeProfile, categoryId, fieldKey, value);
  }

  private async saveEnabled(enabled: boolean) {
    this.enabled = enabled;

    try {
      const response = await api.saveEnabled(enabled);

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
    const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;

    if (!apiKeyInput || !providerSelect) return;

    const apiKey = apiKeyInput.value.trim();
    const provider = providerSelect.value;

    if (!apiKey) {
      this.showStatus('Please enter an API key', 'error');
      return;
    }

    if (!provider) {
      this.showStatus('Please select a provider', 'error');
      return;
    }

    this.llmConfig = {
      provider: provider as any,
      apiKey
    };

    try {
      const response = await api.saveLLMConfig(this.llmConfig);

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
    showStatusToast(message, type);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
