import { LLMConfig, LLMProviderInterface } from '../types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { ChromeProvider } from './providers/chrome';

export class LLMProviderFactory {
  static createProvider(config: LLMConfig): LLMProviderInterface {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      case 'chrome':
        return new ChromeProvider(config);
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }

  static getSupportedProviders(): string[] {
    return ['openai', 'anthropic', 'google', 'chrome'];
  }
}
