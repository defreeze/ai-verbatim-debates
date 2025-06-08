export type DebateStance = 'for' | 'against';

export type DebateRound = 'constructive' | 'rebuttal' | 'summary';

export enum DebatePhase {
  ANALYZER = 'ANALYZER',
  REVIEWER = 'REVIEWER',
  TASK = 'TASK',
  WRITER = 'WRITER'
}

export interface DebateArgument {
  speaker: string;
  text: string;
  summary?: string;
}

export interface DebateState {
  topic: string;
  stance: number;
  round: number;
  phase: DebatePhase;
  rhetoricStyle: string;
  systemPrompt?: string;
  debateStyle: string;
  currentOutput: string;
  currentSummary: string;
  reviewerFeedback: string;
  history: DebateArgument[];
}

export interface AnalyzerOutput {
  result: string;
}

export interface ReviewerOutput {
  feedback: string;
  status: 'revise' | 'finish';
}

export interface TaskOutput {
  result: string;
}

export interface WriterOutput {
  result: string;
}

export interface AgentOutput {
  content: string;
  metadata?: Record<string, any>;
}

export interface DebateAgent {
  process(state: DebateState): Promise<AgentOutput>;
} 