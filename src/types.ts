export interface ProfileField {
  key: string;
  value: string;
  label?: string;
}

export interface ProfileCategory {
  id: string;
  name: string;
  fields: ProfileField[];
}

export interface UserProfile {
  id: string;
  name: string;
  categories: ProfileCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'chrome';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
}

export interface FormMapping {
  [selector: string]: string; // selector -> profile key
}

export interface LLMRequest {
  formHtml: string;
  profileKeys: string[];
}

export interface LLMResponse {
  mapping: FormMapping;
}

export interface LLMProviderInterface {
  getFormMapping(request: LLMRequest): Promise<LLMResponse>;
}

export interface FormInfo {
  element: HTMLElement;
  type: 'form' | 'container';
  inputs: HTMLInputElement[];
}

export interface StorageData {
  profiles: UserProfile[];
  activeProfileId: string | null;
  llmConfig: LLMConfig;
  enabled: boolean;
}

// For backward compatibility with existing code
export interface LegacyUserProfile {
  [key: string]: string;
}

// Chrome Prompt API types
declare global {
  interface Window {
    ai?: {
      createTextSession(): Promise<ChromeAITextSession>;
    };
  }
}

interface ChromeAITextSession {
  prompt(prompt: string): Promise<string>;
}
