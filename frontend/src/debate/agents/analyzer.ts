import OpenAI from 'openai';
import { AnalyzerOutput } from '../types';
import { getPrompt } from '../prompts';

export interface AnalyzerInput {
  topic: string;
  stance: number;
  rhetoricStyle: string;
  systemPrompt?: string;
  previousArguments: Array<{ speaker: string; text: string }>;
  round: number;
}

export class DebateAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async analyze(input: AnalyzerInput): Promise<AnalyzerOutput> {
    const customizedPrompt = `${getPrompt(input.round, 'analyzer')}

DEBATE CONFIGURATION:
- Topic: ${input.topic}
- Stance: ${input.stance}
- Rhetoric Style: ${input.rhetoricStyle}
${input.systemPrompt ? `- Additional Guidance: ${input.systemPrompt}` : ''}

Previous Arguments:
${input.previousArguments.map(arg => `${arg.speaker}: ${arg.text}`).join('\n')}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: customizedPrompt },
        { role: "user", content: "Please analyze this debate topic and provide your output in the specified format." }
      ],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || "";
    const outputMatch = content.match(/<o>([\s\S]*?)<\/o>/);

    return {
      result: outputMatch?.[1]?.trim() || 'Failed to analyze topic. Please try again.'
    };
  }
} 