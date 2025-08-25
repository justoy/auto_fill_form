import { OpenAIService } from './llm/openai';
import { LLMConfig, LLMRequest, StorageData, UserProfile } from './types';

class BackgroundService {
  private llmService: OpenAIService | null = null;

  constructor() {
    this.setupMessageListener();
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

  private async initializeLLMService() {
    try {
      const data = await this.getStorageData();
      if (data.llmConfig?.apiKey) {
        this.llmService = new OpenAIService(data.llmConfig);
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
      const profileKeys = Object.keys(data.profile || {});
      
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

  private async handleGetProfile(sendResponse: (response: any) => void) {
    try {
      const data = await this.getStorageData();
      sendResponse({ success: true, profile: data.profile || this.getDefaultProfile() });
    } catch (error) {
      console.error('Error getting profile:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSaveProfile(
    profile: UserProfile,
    sendResponse: (response: any) => void
  ) {
    try {
      const data = await this.getStorageData();
      data.profile = profile;
      await chrome.storage.local.set(data);
      sendResponse({ success: true });
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
      this.llmService = new OpenAIService(config);
      
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

  private async getStorageData(): Promise<StorageData> {
    const result = await chrome.storage.local.get(['profile', 'llmConfig']);
    return {
      profile: result.profile || this.getDefaultProfile(),
      llmConfig: result.llmConfig || this.getDefaultLLMConfig()
    };
  }

  private getDefaultProfile(): UserProfile {
    return {
      passport_num: '',
      passport_country: '',
      first_name: '',
      last_name: '',
      addr_line1: '',
      addr_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      phone: '',
      email: ''
    };
  }

  private getDefaultLLMConfig(): LLMConfig {
    return {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o'
    };
  }
}

// Initialize the background service
new BackgroundService();
