import { UserProfile, LLMConfig } from './types';
import { showStatus as showStatusToast } from './settings/ui/status';
import { setButtonState } from './settings/ui/button-animations';
import * as api from './settings/api';
import { renderLLMConfig as uiRenderLLMConfig, renderProviderConfig as uiRenderProviderConfig } from './settings/ui/llm-config';
import { renderEnabled as uiRenderEnabled, bindEnabledToggle } from './settings/ui/enabled';
import { renderProfileSelector as uiRenderProfileSelector, bindProfileActions } from './settings/ui/profile-select';
import { renderProfileEditor as uiRenderProfileEditor, bindProfileEditor, addCategoryToProfile, addFieldToCategory as modelAddFieldToCategory, removeCategoryFromProfile, removeFieldFromCategory, updateFieldValueInProfile } from './settings/ui/profile-editor';
import { generateId } from './settings/utils';

class SettingsManager {
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

    // Export/Import
    document.getElementById('exportProfile')?.addEventListener('click', () => this.exportActiveProfile());
    document.getElementById('importProfile')?.addEventListener('click', () => {
      (document.getElementById('importProfileInput') as HTMLInputElement)?.click();
    });
    const importInput = document.getElementById('importProfileInput') as HTMLInputElement | null;
    importInput?.addEventListener('change', (e) => this.handleImportInputChange(e));
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
      onUpdateFieldValue: (categoryId, fieldKey, value) => this.updateFieldValue(categoryId, fieldKey, value),
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
    const activeProfile = this.activeProfile!;
    if (!confirm(`Are you sure you want to delete the profile "${activeProfile.name}"?`)) return;

    await this.handleApiCall(
      () => api.deleteProfile(activeProfile.id),
      'Profile deleted successfully',
      'Failed to delete profile',
      () => { this.activeProfile = null; }
    );
  }

  private async saveProfile() {
    if (!this.activeProfile) return this.showStatus('No profile selected', 'error');
    const activeProfile = this.activeProfile!;

    setButtonState('saveProfile', 'loading');

    try {
      const response = await api.updateProfile(activeProfile);
      if (response.success) {
        setButtonState('saveProfile', 'success');
        this.showStatus('Profile saved successfully', 'success');
      } else {
        setButtonState('saveProfile', 'error');
        this.showStatus(response.error || 'Failed to save profile', 'error');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setButtonState('saveProfile', 'error');
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

    if (!provider) {
      this.showStatus('Please select a provider', 'error');
      return;
    }

    this.llmConfig = {
      provider: provider as any,
      apiKey
    };

    setButtonState('saveLLMConfig', 'loading');

    try {
      const response = await api.saveLLMConfig(this.llmConfig);

      if (response.success) {
        setButtonState('saveLLMConfig', 'success');
        this.showStatus('LLM configuration saved successfully', 'success');
      } else {
        setButtonState('saveLLMConfig', 'error');
        this.showStatus(response.error || 'Failed to save configuration', 'error');
      }
    } catch (error) {
      console.error('Failed to save LLM config:', error);
      setButtonState('saveLLMConfig', 'error');
      this.showStatus('Failed to save configuration', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error') {
    showStatusToast(message, type);
  }

  private exportActiveProfile() {
    if (!this.activeProfile) {
      this.showStatus('No profile selected', 'error');
      return;
    }

    // Prepare export payload
    const payload = {
      format: 'form-autofill-profile',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        ...this.activeProfile,
        // Ensure dates are strings for portability
        createdAt: this.activeProfile.createdAt instanceof Date ? this.activeProfile.createdAt.toISOString() : this.activeProfile.createdAt,
        updatedAt: this.activeProfile.updatedAt instanceof Date ? this.activeProfile.updatedAt.toISOString() : this.activeProfile.updatedAt,
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = this.sanitizeFilename(this.activeProfile.name || 'profile');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `profile-${safeName}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showStatus('Profile exported', 'success');
  }

  private sanitizeFilename(name: string) {
    return name.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  }

  private async handleImportInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    input.value = '';

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Unwrap if needed
      const importedProfile = this.extractProfileFromImport(data);
      if (!importedProfile) {
        this.showStatus('Invalid profile file', 'error');
        return;
      }

      // Prompt for name; default to file name or embedded name
      const defaultName = (importedProfile as any).name || file.name.replace(/\.json$/i, '') || 'Imported Profile';
      const name = prompt('Name for imported profile:', defaultName) || defaultName;

      // Build a new profile object using imported categories if present
      const newProfile: UserProfile = {
        id: generateId(),
        name: name.trim() || 'Imported Profile',
        categories: this.buildCategoriesFromImported(importedProfile),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create then update to persist full data and set active
      const createResp = await api.createProfile(newProfile.name);
      if (!createResp.success || !createResp.profile) {
        throw new Error(createResp.error || 'Failed to create profile');
      }

      const saved = createResp.profile as UserProfile;
      const toSave: UserProfile = { ...saved, categories: newProfile.categories, name: newProfile.name, updatedAt: new Date() };
      const updateResp = await api.updateProfile(toSave);
      if (!updateResp.success) {
        throw new Error(updateResp.error || 'Failed to save imported profile');
      }

      // Set as active
      await api.setActiveProfile(saved.id);
      await this.loadProfiles();
      this.renderUI();
      this.showStatus('Profile imported successfully', 'success');
    } catch (err) {
      console.error('Import failed:', err);
      this.showStatus('Failed to import profile', 'error');
    }
  }

  private extractProfileFromImport(data: any): any {
    // Supports wrapped { format, version, profile } or raw object
    const candidate = data && data.profile ? data.profile : data;
    if (!candidate || typeof candidate !== 'object') return null;
    return candidate;
  }

  private buildCategoriesFromImported(obj: any) {
    // If looks like new format (has categories array with fields), use it
    if (obj && Array.isArray(obj.categories)) {
      // Ensure each category has an id and fields structure
      return (obj.categories as any[]).map((cat, idx) => ({
        id: typeof cat.id === 'string' ? cat.id : `cat_${idx}_${generateId()}`,
        name: typeof cat.name === 'string' ? cat.name : `Category ${idx + 1}`,
        fields: Array.isArray(cat.fields)
          ? cat.fields.map((f: any) => ({ key: String(f.key), value: String(f.value ?? ''), label: f.label ? String(f.label) : undefined }))
          : [],
      }));
    }

    // Otherwise treat as legacy flat key-value map
    const fields = Object.entries(obj || {}).map(([key, value]) => ({ key: String(key), value: String(value ?? ''), label: key }));
    return [
      {
        id: `imported_${generateId()}`,
        name: 'Imported',
        fields,
      },
    ];
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
  new SettingsManager();
});
