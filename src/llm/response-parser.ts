import { jsonrepair } from 'jsonrepair';
import { LLMResponse, FormMapping } from '../types';

export class LLMResponseParser {
  /**
   * Parse and repair LLM response content that may contain malformed JSON
   * @param content - Raw response content from LLM
   * @param providerName - Name of the LLM provider for error messages
   * @returns Parsed FormMapping
   */
  static parseFormMappingResponse(content: string, providerName: string = 'LLM'): LLMResponse {
    if (!content) {
      throw new Error(`No response content from ${providerName}`);
    }

    try {
      // Use jsonrepair to handle malformed JSON (e.g., wrapped in ```json code blocks)
      const repairedJson = jsonrepair(content.trim());
      const mapping = JSON.parse(repairedJson) as FormMapping;
      return { mapping };
    } catch (repairError) {
      console.error(`Failed to repair and parse JSON from ${providerName}:`, content);
      throw new Error(`Invalid JSON response from ${providerName}: ${repairError instanceof Error ? repairError.message : 'Unknown parsing error'}`);
    }
  }
}
