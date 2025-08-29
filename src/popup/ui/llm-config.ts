import { LLMConfig, LLMProvider } from '../../types';

export function renderLLMConfig(config: LLMConfig): void {
  const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement | null;
  if (providerSelect) {
    providerSelect.value = config.provider;
  }
  renderProviderConfig(config.provider, config.apiKey);
}

export function renderProviderConfig(provider: LLMProvider | string, apiKey: string): void {
  const container = document.getElementById('providerConfig');
  if (!container) return;

  container.innerHTML = '';

  const fields = createProviderConfigFields(provider as LLMProvider, apiKey);
  fields.forEach((field) => container.appendChild(field));
}

function createProviderConfigFields(provider: LLMProvider | string, apiKey: string): HTMLElement[] {
  const fields: HTMLElement[] = [];

  switch (provider) {
    case 'openai':
      fields.push(createApiKeyField('OpenAI API Key', 'sk-...', apiKey));
      break;
    case 'anthropic':
      fields.push(createApiKeyField('Anthropic API Key', 'sk-ant-...', apiKey));
      break;
    case 'google':
      fields.push(createApiKeyField('Google AI API Key', 'your-google-api-key', apiKey));
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return fields;
}

function createApiKeyField(label: string, placeholder: string, value: string): HTMLElement {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';

  const labelElement = document.createElement('label');
  labelElement.setAttribute('for', 'apiKey');
  labelElement.textContent = label;

  const input = document.createElement('input');
  input.type = 'password';
  input.id = 'apiKey';
  input.placeholder = placeholder;
  input.value = value || '';

  formGroup.appendChild(labelElement);
  formGroup.appendChild(input);

  return formGroup;
}


