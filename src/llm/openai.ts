import { jsonrepair } from 'jsonrepair';
import { LLMConfig, LLMRequest, LLMResponse } from '../types';

export class OpenAIService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async getFormMapping(request: LLMRequest): Promise<LLMResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
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

  private buildPrompt(request: LLMRequest): string {
    return `Analyze this HTML form and map input fields to profile keys.

Available profile keys: ${request.profileKeys.join(', ')}

HTML Form:
${request.formHtml}

Instructions:
1. Map form input fields to the most appropriate profile key
2. Use field identifiers in this priority: id > name > index
3. Return ONLY a raw JSON object - no markdown, no code blocks, no explanation
4. Format: {"id:fieldId": "profile_key"} or {"name:fieldName": "profile_key"} or {"index:0": "profile_key"}
5. Skip fields that don't match any profile key

Example output:
{
  "id:passport_number": "passport_num",
  "name:firstName": "first_name",
  "name:email": "email"
}

Return the JSON mapping now:`;
  }
}
