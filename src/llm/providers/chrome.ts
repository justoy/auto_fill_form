import { LLMConfig, LLMRequest, LLMResponse, LLMProviderInterface } from '../../types';
import { PromptBuilder } from '../prompt-builder';
import { LLMResponseParser } from '../response-parser';

export class ChromeProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
    const prompt = PromptBuilder.buildFormMappingPrompt(request);

    try {
      // Check if the Prompt API is available
      if (!window.ai || !window.ai.createTextSession) {
        throw new Error('Chrome Prompt API is not available. Please ensure you\'re using Chrome with the Prompt API enabled.');
      }

      // Create a text session
      const session = await window.ai.createTextSession();

      // Send the prompt and get the response
      const response = await session.prompt(prompt);

      return LLMResponseParser.parseFormMappingResponse(response, 'Chrome');
    } catch (error) {
      console.error('Chrome Prompt API call failed:', error);
      throw error;
    }
  }
}
