import { LLMConfig, UserProfile } from '../types';

type ApiResponse<T = unknown> = { success?: boolean; error?: string } & T;

function sendMessage<T = any>(message: any): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ApiResponse<T>) => {
      resolve(response || { success: false, error: 'No response' } as ApiResponse<T>);
    });
  });
}

export async function getLLMConfig() {
  return sendMessage<{ config: LLMConfig }>({ action: 'GET_LLM_CONFIG' });
}

export async function getProviderLLMConfig(provider: string) {
  return sendMessage<{ config: LLMConfig }>({ action: 'GET_PROVIDER_LLM_CONFIG', provider });
}

export async function saveLLMConfig(config: LLMConfig) {
  return sendMessage({ action: 'SAVE_LLM_CONFIG', config });
}

export async function getEnabled() {
  return sendMessage<{ enabled: boolean }>({ action: 'GET_ENABLED' });
}

export async function saveEnabled(enabled: boolean) {
  return sendMessage({ action: 'SAVE_ENABLED', enabled });
}

export async function getProfiles() {
  return sendMessage<{ profiles: UserProfile[] }>({ action: 'GET_PROFILES' });
}

export async function getActiveProfile() {
  return sendMessage<{ profile: UserProfile | null }>({ action: 'GET_ACTIVE_PROFILE' });
}

export async function setActiveProfile(profileId: string) {
  return sendMessage({ action: 'SET_ACTIVE_PROFILE', profileId });
}

export async function createProfile(name: string) {
  return sendMessage<{ profile: UserProfile }>({ action: 'CREATE_PROFILE', name });
}

export async function updateProfile(profile: UserProfile) {
  return sendMessage({ action: 'UPDATE_PROFILE', profile });
}

export async function deleteProfile(profileId: string) {
  return sendMessage({ action: 'DELETE_PROFILE', profileId });
}


