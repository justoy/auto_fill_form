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
    document.getElementById('providerSelect')?.addEventListener('change', async (e) => {
      await this.onProviderSelect((e.target as HTMLSelectElement).value);
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

  private async onProviderSelect(provider: string) {
    // Fetch saved config for this provider first
    const resp = await api.getProviderLLMConfig(provider);
    const cfg = resp.success && resp.config ? resp.config : { provider: provider as any, apiKey: '' };
    this.llmConfig = cfg;

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
    if (!name || !name.trim()) return;

    await this.handleApiCall(
      () => api.createProfile(name.trim()),
      'Profile created successfully',
      'Failed to create profile',
      (res) => {
        this.activeProfile = res.profile;
        this.renderUI();
      }
    );
  }

  private async renameProfile() {
    if (!this.activeProfile) return this.showStatus('No profile selected', 'error');

    const newName = prompt('Enter new profile name:', this.activeProfile.name);
    if (!newName || !newName.trim()) return;

    const updatedProfile = { ...this.activeProfile, name: newName.trim() };
    await this.handleApiCall(
      () => api.updateProfile(updatedProfile),
      'Profile renamed successfully',
      'Failed to rename profile'
    );
  }

  private async deleteProfile() {
    if (!this.activeProfile) return this.showStatus('No profile selected', 'error');
    if (!confirm(`Are you sure you want to delete the profile "${this.activeProfile.name}"?`)) return;

    await this.handleApiCall(
      () => api.deleteProfile(this.activeProfile.id),
      'Profile deleted successfully',
      'Failed to delete profile',
      () => { this.activeProfile = null; }
    );
  }

  private async saveProfile() {
    if (!this.activeProfile) return this.showStatus('No profile selected', 'error');

    await this.handleApiCall(
      () => api.updateProfile(this.activeProfile),
      'Profile saved successfully',
      'Failed to save profile'
    );
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

  private async handleApiCall<T extends { success?: boolean; error?: string }>(
    apiCall: () => Promise<T>,
    successMsg: string,
    errorMsg: string,
    onSuccess?: (result: T) => void
  ) {
    try {
      const response = await apiCall();
      if (response.success === true) {
        if (onSuccess) onSuccess(response);
        await this.loadProfiles();
        this.renderUI();
        this.showStatus(successMsg, 'success');
      } else {
        this.showStatus(response.error || errorMsg, 'error');
      }
    } catch (error) {
      console.error(errorMsg, error);
      this.showStatus(errorMsg, 'error');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
