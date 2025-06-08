import OpenAI from 'openai';
import { WriterOutput } from '../types';
import { getPrompt } from '../prompts';

export interface WriterInput {
  topic: string;
  stance: number;
  rhetoricStyle: string;
  systemPrompt?: string;
  taskOutput: string;
  previousArguments: Array<{ speaker: string; text: string }>;
  round: number;
}

export class DebateWriter {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async write(input: WriterInput): Promise<WriterOutput> {
    const customizedPrompt = `${getPrompt(input.round, 'writer')}

DEBATE CONFIGURATION:
- Topic: ${input.topic}
- Stance: ${input.stance}
- Rhetoric Style: ${input.rhetoricStyle}
${input.systemPrompt ? `- Additional Guidance: ${input.systemPrompt}` : ''}

Task Output:
${input.taskOutput}

Previous Arguments:
${input.previousArguments.map(arg => `${arg.speaker}: ${arg.text}`).join('\n')}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: customizedPrompt },
        { role: "user", content: "Please write the final debate argument based on the task output." }
      ],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || "";
    const outputMatch = content.match(/<o>([\s\S]*?)<\/o>/);

    return {
      result: outputMatch?.[1]?.trim() || 'Failed to generate final argument. Please try again.'
    };
  }
} 