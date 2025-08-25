export interface UserProfile {
  [key: string]: string;
}

export interface LLMConfig {
  provider: 'openai';
  apiKey: string;
  model: string;
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

export interface FormInfo {
  element: HTMLElement;
  type: 'form' | 'container';
  inputs: HTMLInputElement[];
}

export interface StorageData {
  profile: UserProfile;
  llmConfig: LLMConfig;
}
