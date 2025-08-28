import { LLMConfig, LLMRequest, LLMResponse, LLMProviderInterface } from '../../types';
import { PromptBuilder } from '../prompt-builder';
import { LLMResponseParser } from '../response-parser';

export class GoogleProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('Google AI API key is required');
    }

    const prompt = PromptBuilder.buildFormMappingPrompt(request);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return LLMResponseParser.parseFormMappingResponse(content, 'Google');
    } catch (error) {
      console.error('Google AI API call failed:', error);
      throw error;
    }
  }
}
