import { LLMRequest } from '../types';

export class PromptBuilder {
  static buildFormMappingPrompt(request: LLMRequest): string {
    return `Analyze these form input fields and map them to profile keys.

Available profile keys: ${request.profileKeys.join(', ')}

Form Fields (JSON):
${request.formHtml}

Instructions:
1. Each field has an 'index' number, use this if no id or name is available
2. Map form input fields to the most appropriate profile key based on field attributes (name, id, placeholder, label, aria-label, etc.)
3. Use field identifiers in this priority: id > name > index
4. Return ONLY a raw JSON object - no markdown, no code blocks, no explanation
5. Format: {"id:fieldId": "profile_key"} or {"name:fieldName": "profile_key"} or {"index:0": "profile_key"}
6. Skip fields that don't match any profile key

Example output:
{
  "id:passport_number": "passport_num",
  "name:firstName": "first_name",
  "name:email": "email",
  "index:2": "phone"
}

Return the JSON mapping now:`;
  }
}
