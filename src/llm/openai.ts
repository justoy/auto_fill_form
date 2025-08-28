import { jsonrepair } from 'jsonrepair';
import { LLMConfig, LLMRequest, LLMResponse } from '../types';
import { PromptBuilder } from './prompt-builder';

export class OpenAIService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
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
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Use jsonrepair to handle malformed JSON (e.g., wrapped in ```json code blocks)
      try {
        const repairedJson = jsonrepair(content.trim());
        const mapping = JSON.parse(repairedJson);
        return { mapping };
      } catch (repairError) {
        console.error('Failed to repair and parse JSON:', content);
        throw new Error(`Invalid JSON response from OpenAI: ${repairError instanceof Error ? repairError.message : 'Unknown parsing error'}`);
      }
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}
