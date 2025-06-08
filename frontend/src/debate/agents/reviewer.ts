import OpenAI from 'openai';
import { ReviewerOutput } from '../types';
import { getPrompt } from '../prompts';

export interface ReviewerInput {
  topic: string;
  stance: number;
  currentAnalysis: string;
  previousArguments: Array<{ speaker: string; text: string }>;
  round: number;
}

export class DebateReviewer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async review(input: ReviewerInput): Promise<ReviewerOutput> {
    const customizedPrompt = `${getPrompt(input.round, 'reviewer')}

DEBATE CONFIGURATION:
- Topic: ${input.topic}
- Stance: ${input.stance}

Current Analysis:
${input.currentAnalysis}

Previous Arguments:
${input.previousArguments.map(arg => `${arg.speaker}: ${arg.text}`).join('\n')}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: customizedPrompt },
        { role: "user", content: "Please review this debate analysis and provide your feedback in the specified format." }
      ],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || "";
    const outputMatch = content.match(/<o>([\s\S]*?)<\/o>/);
    
    if (!outputMatch) {
      return {
        feedback: 'Failed to parse reviewer output. Please try again.',
        status: 'revise'
      };
    }

    const output = outputMatch[1].trim();
    const feedbackMatch = output.match(/FEEDBACK:\n([\s\S]*?)\n\nSTATUS:/);
    const statusMatch = output.match(/STATUS:\s*(revise|finish)/i);

    return {
      feedback: feedbackMatch?.[1]?.trim() || 'Failed to parse feedback.',
      status: (statusMatch?.[1]?.toLowerCase() as 'revise' | 'finish') || 'revise'
    };
  }
} 