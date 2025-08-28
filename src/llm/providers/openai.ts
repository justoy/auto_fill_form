import { LLMConfig, LLMRequest, LLMResponse, LLMProviderInterface } from '../../types';
import { PromptBuilder } from '../prompt-builder';
import { LLMResponseParser } from '../response-parser';

export class OpenAIProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const prompt = PromptBuilder.buildFormMappingPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            {
              role: 'system',
              content: 'You are a form field mapping assistant. Analyze HTML forms and map fields to profile keys. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 20000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      return LLMResponseParser.parseFormMappingResponse(content, 'OpenAI');
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}
