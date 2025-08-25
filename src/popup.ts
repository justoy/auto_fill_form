import { UserProfile, LLMConfig } from './types';

class PopupManager {
  private profile: UserProfile = {};
  private llmConfig: LLMConfig = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o'
  };

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

      // Load profile
      const profileResponse = await this.sendMessage({ action: 'GET_PROFILE' });
      if (profileResponse.success) {
        this.profile = profileResponse.profile;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private setupEventListeners() {
    // LLM Configuration
    document.getElementById('saveLLMConfig')?.addEventListener('click', () => {
      this.saveLLMConfig();
    });

    // Profile management
    document.getElementById('saveProfile')?.addEventListener('click', () => {
      this.saveProfile();
    });

    document.getElementById('addField')?.addEventListener('click', () => {
      this.addNewField();
    });

    // Enter key on new field input
    document.getElementById('newFieldKey')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addNewField();
      }
    });
  }

  private renderUI() {
    this.renderLLMConfig();
    this.renderProfile();
  }

  private renderLLMConfig() {
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    const modelSelect = document.getElementById('model') as HTMLSelectElement;

    if (apiKeyInput) {
      apiKeyInput.value = this.llmConfig.apiKey || '';
    }

    if (modelSelect) {
      modelSelect.value = this.llmConfig.model || 'gpt-4o';
    }
  }

  private renderProfile() {
    const container = document.getElementById('profileFields');
    if (!container) return;

    container.innerHTML = '';

    // Render existing fields
    Object.entries(this.profile).forEach(([key, value]) => {
      const fieldDiv = this.createProfileField(key, value);
      container.appendChild(fieldDiv);
    });
  }

  private createProfileField(key: string, value: string): HTMLElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'profile-field';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = key;
    keyInput.placeholder = 'Field name';
    keyInput.style.flex = '0 0 140px';
    keyInput.addEventListener('input', () => {
      this.updateProfileKey(key, keyInput.value, valueInput.value);
    });

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = value;
    valueInput.placeholder = 'Value';
    valueInput.addEventListener('input', () => {
      this.updateProfileValue(keyInput.value, valueInput.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => {
      this.removeProfileField(keyInput.value);
    });

    fieldDiv.appendChild(keyInput);
    fieldDiv.appendChild(valueInput);
    fieldDiv.appendChild(removeBtn);

    return fieldDiv;
  }

  private updateProfileKey(oldKey: string, newKey: string, value: string) {
    if (oldKey !== newKey) {
      delete this.profile[oldKey];
      this.profile[newKey] = value;
    }
  }

  private updateProfileValue(key: string, value: string) {
    this.profile[key] = value;
  }

  private removeProfileField(key: string) {
    delete this.profile[key];
    this.renderProfile();
  }

  private addNewField() {
    const keyInput = document.getElementById('newFieldKey') as HTMLInputElement;
    if (!keyInput) return;

    const key = keyInput.value.trim();
    if (!key) {
      this.showStatus('Please enter a field name', 'error');
      return;
    }

    if (this.profile.hasOwnProperty(key)) {
      this.showStatus('Field already exists', 'error');
      return;
    }

    this.profile[key] = '';
    keyInput.value = '';
    this.renderProfile();
    this.showStatus('Field added successfully', 'success');
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

  private async saveProfile() {
    try {
      const response = await this.sendMessage({
        action: 'SAVE_PROFILE',
        profile: this.profile
      });

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
