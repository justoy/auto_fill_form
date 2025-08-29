import { LLMConfig, LLMRequest, LLMResponse, LLMProviderInterface } from '../../types';
import { PromptBuilder } from '../prompt-builder';
import { LLMResponseParser } from '../response-parser';

export class AnthropicProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
    const prompt = PromptBuilder.buildFormMappingPrompt(request);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 8192,
          system: 'You are a form field mapping assistant. Analyze HTML forms and map fields to profile keys. Return only valid JSON.',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      return LLMResponseParser.parseFormMappingResponse(content, 'Anthropic');
    } catch (error) {
      console.error('Anthropic API call failed:', error);
      throw error;
    }
  }
}
