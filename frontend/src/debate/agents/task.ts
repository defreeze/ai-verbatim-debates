import OpenAI from 'openai';
import { TaskOutput } from '../types';
import { getPrompt } from '../prompts';

export interface TaskInput {
  topic: string;
  stance: number;
  rhetoricStyle: string;
  systemPrompt?: string;
  currentAnalysis: string;
  reviewerFeedback: string;
  previousArguments: Array<{ speaker: string; text: string }>;
  round: number;
}

const getStanceDescription = (stance: number): string => {
  if (stance <= -0.8) return 'strongly against';
  if (stance <= -0.3) return 'against';
  if (stance <= 0.3) return 'neutral on';
  if (stance <= 0.8) return 'for';
  return 'strongly for';
};

const getRhetoricStyleGuidance = (style: string): string => {
  switch (style) {
    case 'formal':
      return 'Use scholarly language, cite research, and maintain a professional tone.';
    case 'casual':
      return 'Adopt a friendly, approachable tone with everyday language.';
    case 'emotional':
      return 'Emphasize personal impact and appeal to emotions.';
    case 'factual':
      return 'Focus purely on data and objective information.';
    case 'adversarial':
      return 'Focus on discrediting opposing arguments while strongly defending your position.';
    default:
      return 'Use a balanced, standard debate style.';
  }
};

export class DebateTask {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async execute(input: TaskInput): Promise<TaskOutput> {
    const stanceDescription = getStanceDescription(input.stance);
    const rhetoricGuidance = getRhetoricStyleGuidance(input.rhetoricStyle);
    
    const customizedPrompt = `${getPrompt(input.round, 'task')}

DEBATE CONFIGURATION:
- Topic: ${input.topic}
- Stance: ${stanceDescription}
- Rhetoric Style: ${rhetoricGuidance}
${input.systemPrompt ? `- Additional Guidance: ${input.systemPrompt}` : ''}

Current Analysis:
${input.currentAnalysis}

Reviewer Feedback:
${input.reviewerFeedback}

Previous Arguments:
${input.previousArguments.map(arg => `${arg.speaker}: ${arg.text}`).join('\n')}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: customizedPrompt },
        { role: "user", content: "Please process the debate task based on the provided configuration." }
      ],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || "";
    const outputMatch = content.match(/<o>([\s\S]*?)<\/o>/);

    return {
      result: outputMatch?.[1]?.trim() || 'Failed to process task output. Please try again.'
    };
  }
} 