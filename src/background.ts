import { LLMProviderFactory } from './llm/provider-factory';
import { LLMConfig, LLMRequest, LLMProviderInterface, StorageData, UserProfile, ProfileCategory, LegacyUserProfile } from './types';

class BackgroundService {
  private llmService: LLMProviderInterface | null = null;

  constructor() {
    this.setupMessageListener();
    this.setupActionListener();
    this.initializeLLMService();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep the message channel open for async response
      }
    );
  }

  private setupActionListener() {
    chrome.action.onClicked.addListener(() => {
      chrome.runtime.openOptionsPage();
    });
  }

  private async initializeLLMService() {
    try {
      const data = await this.getStorageData();
      if (data.llmConfig?.apiKey) {
        this.llmService = LLMProviderFactory.createProvider(data.llmConfig);
      }
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
    }
  }

  private async handleMessage(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    try {
      switch (request.action) {
        case 'GET_FORM_MAPPING':
          await this.handleGetFormMapping(request, sendResponse);
          break;

        case 'GET_PROFILES':
          await this.handleGetProfiles(sendResponse);
          break;

        case 'CREATE_PROFILE':
          await this.handleCreateProfile(request.name, sendResponse);
          break;

        case 'UPDATE_PROFILE':
          await this.handleUpdateProfile(request.profile, sendResponse);
          break;

        case 'DELETE_PROFILE':
          await this.handleDeleteProfile(request.profileId, sendResponse);
          break;

        case 'SET_ACTIVE_PROFILE':
          await this.handleSetActiveProfile(request.profileId, sendResponse);
          break;

        case 'GET_ACTIVE_PROFILE':
          await this.handleGetActiveProfile(sendResponse);
          break;

        case 'GET_PROFILE':
          await this.handleGetProfile(sendResponse);
          break;

        case 'SAVE_PROFILE':
          await this.handleSaveProfile(request.profile, sendResponse);
          break;

        case 'SAVE_LLM_CONFIG':
          await this.handleSaveLLMConfig(request.config, sendResponse);
          break;

        case 'GET_LLM_CONFIG':
          await this.handleGetLLMConfig(sendResponse);
          break;

        case 'SAVE_ENABLED':
          await this.handleSaveEnabled(request.enabled, sendResponse);
          break;

        case 'GET_ENABLED':
          await this.handleGetEnabled(sendResponse);
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetFormMapping(
    request: { formHtml: string },
    sendResponse: (response: any) => void
  ) {
    if (!this.llmService) {
      await this.initializeLLMService();
      if (!this.llmService) {
        sendResponse({ error: 'LLM service not configured' });
        return;
      }
    }

    try {
      const data = await this.getStorageData();
      const activeProfile = data.profiles.find(p => p.id === data.activeProfileId);
      const profileKeys = activeProfile ? this.getProfileKeys(activeProfile) : [];

      const llmRequest: LLMRequest = {
        formHtml: request.formHtml,
        profileKeys
      };

      const response = await this.llmService.getFormMapping(llmRequest);
      sendResponse({ success: true, mapping: response.mapping });
    } catch (error) {
      console.error('Error getting form mapping:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetProfiles(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      sendResponse({ success: true, profiles: data.profiles });
    } catch (error) {
      console.error('Error getting profiles:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleCreateProfile(name: string, sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      const newProfile: UserProfile = {
        id: this.generateId(),
        name,
        categories: this.getDefaultCategories(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      data.profiles.push(newProfile);

      // Set as active if it's the first profile
      if (data.profiles.length === 1) {
        data.activeProfileId = newProfile.id;
      }

      await chrome.storage.local.set(data);
      sendResponse({ success: true, profile: newProfile });
    } catch (error) {
      console.error('Error creating profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleUpdateProfile(profile: UserProfile, sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      const index = data.profiles.findIndex(p => p.id === profile.id);

      if (index === -1) {
        sendResponse({ error: 'Profile not found' });
        return;
      }

      profile.updatedAt = new Date();
      data.profiles[index] = profile;
      await chrome.storage.local.set(data);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleDeleteProfile(profileId: string, sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      data.profiles = data.profiles.filter(p => p.id !== profileId);

      // Clear active profile if it was deleted
      if (data.activeProfileId === profileId) {
        data.activeProfileId = data.profiles.length > 0 ? data.profiles[0].id : null;
      }

      await chrome.storage.local.set(data);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error deleting profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSetActiveProfile(profileId: string, sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      const profile = data.profiles.find(p => p.id === profileId);

      if (!profile) {
        sendResponse({ error: 'Profile not found' });
        return;
      }

      data.activeProfileId = profileId;
      await chrome.storage.local.set(data);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error setting active profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetActiveProfile(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      const activeProfile = data.profiles.find(p => p.id === data.activeProfileId);
      sendResponse({ success: true, profile: activeProfile || null });
    } catch (error) {
      console.error('Error getting active profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetProfile(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      const activeProfile = data.profiles.find(p => p.id === data.activeProfileId);

      if (activeProfile) {
        // Convert new profile format to legacy format for backward compatibility
        const legacyProfile = this.convertToLegacyProfile(activeProfile);
        sendResponse({ success: true, profile: legacyProfile });
      } else {
        // Fall back to legacy profile for backward compatibility
        const legacyData = await this.getLegacyStorageData();
        sendResponse({ success: true, profile: legacyData.profile || this.getDefaultProfile() });
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSaveProfile(
    profile: UserProfile | LegacyUserProfile,
    sendResponse: (response: any) => void
  ) {
    try {
      // Check if it's a legacy profile format
      if (this.isLegacyProfile(profile)) {
        // Convert legacy profile to new format
        const data = await this.getStorageData();
        const activeProfile = data.profiles.find(p => p.id === data.activeProfileId);

        if (activeProfile) {
          // Update existing active profile with legacy data
          this.updateProfileFromLegacy(activeProfile, profile);
          await this.handleUpdateProfile(activeProfile, sendResponse);
        } else {
          // Create new profile from legacy data
          const newProfile: UserProfile = {
            id: this.generateId(),
            name: 'Default Profile',
            categories: this.convertLegacyToCategories(profile),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          data.profiles.push(newProfile);
          data.activeProfileId = newProfile.id;
          await chrome.storage.local.set(data);
          sendResponse({ success: true });
        }
      } else {
        // It's already in new format
        await this.handleUpdateProfile(profile as UserProfile, sendResponse);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSaveLLMConfig(
    config: LLMConfig,
    sendResponse: (response: any) => void
  ) {
    try {
      const data = await this.getStorageData();
      data.llmConfig = config;
      await chrome.storage.local.set(data);

      // Reinitialize LLM service with new config
      this.llmService = LLMProviderFactory.createProvider(config);

      sendResponse({ success: true });
    } catch (error) {
      console.error('Error saving LLM config:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetLLMConfig(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      sendResponse({
        success: true,
        config: data.llmConfig || this.getDefaultLLMConfig()
      });
    } catch (error) {
      console.error('Error getting LLM config:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSaveEnabled(enabled: boolean, sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      data.enabled = enabled;
      await chrome.storage.local.set(data);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error saving enabled setting:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetEnabled(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      sendResponse({
        success: true,
        enabled: data.enabled
      });
    } catch (error) {
      console.error('Error getting enabled setting:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async getStorageData(): Promise<StorageData> {
    const result = await chrome.storage.local.get(['profiles', 'activeProfileId', 'llmConfig', 'enabled']);
    return {
      profiles: result.profiles || [],
      activeProfileId: result.activeProfileId || null,
      llmConfig: result.llmConfig || this.getDefaultLLMConfig(),
      enabled: result.enabled !== undefined ? result.enabled : true
    };
  }

  private async getLegacyStorageData(): Promise<{ profile: LegacyUserProfile; llmConfig: LLMConfig }> {
    const result = await chrome.storage.local.get(['profile', 'llmConfig']);
    return {
      profile: result.profile || this.getDefaultProfile(),
      llmConfig: result.llmConfig || this.getDefaultLLMConfig()
    };
  }

  private getDefaultProfile(): UserProfile {
    return {
      id: this.generateId(),
      name: 'Default Profile',
      categories: this.getDefaultCategories(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getDefaultLLMConfig(): LLMConfig {
    return {
      provider: 'chrome' as const,
      apiKey: undefined
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultCategories(): ProfileCategory[] {
    return [
      {
        id: 'personal',
        name: 'Personal Information',
        fields: [
          { key: 'first_name', value: '', label: 'First Name' },
          { key: 'last_name', value: '', label: 'Last Name' },
          { key: 'email', value: '', label: 'Email' },
          { key: 'phone', value: '', label: 'Phone' }
        ]
      },
      {
        id: 'address',
        name: 'Address',
        fields: [
          { key: 'addr_line1', value: '', label: 'Address Line 1' },
          { key: 'addr_line2', value: '', label: 'Address Line 2' },
          { key: 'city', value: '', label: 'City' },
          { key: 'state', value: '', label: 'State' },
          { key: 'postal_code', value: '', label: 'Postal Code' },
          { key: 'country', value: '', label: 'Country' }
        ]
      },
      {
        id: 'passport',
        name: 'Passport',
        fields: [
          { key: 'passport_num', value: '', label: 'Passport Number' },
          { key: 'passport_country', value: '', label: 'Passport Country' },
          { key: 'nationality', value: '', label: 'Nationality' },
          { key: 'passport_issue_place', value: '', label: 'Place of Issue' },
          { key: 'passport_issue_date', value: '', label: 'Issue Date' },
          { key: 'passport_expiry_date', value: '', label: 'Expiry Date' }
        ]
      }
    ];
  }

  private getProfileKeys(profile: UserProfile): string[] {
    const keys: string[] = [];
    profile.categories.forEach(category => {
      category.fields.forEach(field => {
        keys.push(field.key);
      });
    });
    return keys;
  }

  private convertToLegacyProfile(profile: UserProfile): LegacyUserProfile {
    const legacyProfile: LegacyUserProfile = {};
    profile.categories.forEach(category => {
      category.fields.forEach(field => {
        legacyProfile[field.key] = field.value;
      });
    });
    return legacyProfile;
  }

  private isLegacyProfile(profile: any): profile is LegacyUserProfile {
    return typeof profile === 'object' && profile !== null && !profile.categories && !profile.id;
  }

  private convertLegacyToCategories(legacyProfile: LegacyUserProfile): ProfileCategory[] {
    const categories = this.getDefaultCategories();

    // Map legacy fields to categories
    Object.entries(legacyProfile).forEach(([key, value]) => {
      categories.forEach(category => {
        const field = category.fields.find(f => f.key === key);
        if (field) {
          field.value = value;
        }
      });
    });

    return categories;
  }

  private updateProfileFromLegacy(profile: UserProfile, legacyProfile: LegacyUserProfile): void {
    profile.categories.forEach(category => {
      category.fields.forEach(field => {
        if (legacyProfile[field.key] !== undefined) {
          field.value = legacyProfile[field.key];
        }
      });
    });
  }
}

// Initialize the background service
new BackgroundService();
