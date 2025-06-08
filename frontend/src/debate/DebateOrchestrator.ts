import { DebateAnalyzer } from './agents/analyzer';
import { DebateReviewer } from './agents/reviewer';
import { DebateTask } from './agents/task';
import { DebateWriter } from './agents/writer';
import { 
  DebateState, 
  DebatePhase, 
  DebateArgument,
  AnalyzerOutput,
  ReviewerOutput,
  TaskOutput,
  WriterOutput 
} from './types';

export class DebateOrchestrator {
  private state: DebateState;
  private analyzer: DebateAnalyzer;
  private reviewer: DebateReviewer;
  private task: DebateTask;
  private writer: DebateWriter;

  constructor(
    topic: string,
    stance: number,
    rhetoricStyle: string = 'standard',
    systemPrompt?: string,
    debateStyle: string = 'structured'
  ) {
    this.state = {
      topic,
      stance,
      round: 1,
      phase: DebatePhase.ANALYZER,
      rhetoricStyle,
      systemPrompt,
      debateStyle,
      currentOutput: '',
      currentSummary: '',
      reviewerFeedback: '',
      history: []
    };

    // Initialize agents
    this.analyzer = new DebateAnalyzer(process.env.OPENAI_API_KEY || '');
    this.reviewer = new DebateReviewer(process.env.OPENAI_API_KEY || '');
    this.task = new DebateTask(process.env.OPENAI_API_KEY || '');
    this.writer = new DebateWriter(process.env.OPENAI_API_KEY || '');
  }

  private async runAnalyzerPhase(): Promise<void> {
    const analysis = await this.analyzer.analyze({
      topic: this.state.topic,
      stance: this.state.stance,
      rhetoricStyle: this.state.rhetoricStyle,
      systemPrompt: this.state.systemPrompt,
      previousArguments: this.state.history,
      round: this.state.round
    });

    this.state.currentOutput = analysis.result;
    this.state.phase = DebatePhase.REVIEWER;
  }

  private async runReviewerPhase(): Promise<void> {
    const review = await this.reviewer.review({
      topic: this.state.topic,
      stance: this.state.stance,
      currentAnalysis: this.state.currentOutput,
      previousArguments: this.state.history,
      round: this.state.round
    });

    this.state.reviewerFeedback = review.feedback;
    this.state.phase = DebatePhase.TASK;
  }

  private async runTaskPhase(): Promise<void> {
    const taskResult = await this.task.execute({
      topic: this.state.topic,
      stance: this.state.stance,
      rhetoricStyle: this.state.rhetoricStyle,
      systemPrompt: this.state.systemPrompt,
      currentAnalysis: this.state.currentOutput,
      reviewerFeedback: this.state.reviewerFeedback,
      previousArguments: this.state.history,
      round: this.state.round
    });

    this.state.currentOutput = taskResult.result;
    this.state.phase = DebatePhase.WRITER;
  }

  private async runWriterPhase(): Promise<void> {
    const writerResult = await this.writer.write({
      topic: this.state.topic,
      stance: this.state.stance,
      rhetoricStyle: this.state.rhetoricStyle,
      systemPrompt: this.state.systemPrompt,
      taskOutput: this.state.currentOutput,
      previousArguments: this.state.history,
      round: this.state.round
    });

    // Add the new argument to history
    this.state.history.push({
      speaker: this.state.stance > 0 ? 'Proposition' : 'Opposition',
      text: writerResult.result
    });

    // Reset for next round
    this.state.currentOutput = '';
    this.state.reviewerFeedback = '';
    this.state.phase = DebatePhase.ANALYZER;
    this.state.round++;
  }

  async runPhase(): Promise<void> {
    switch (this.state.phase) {
      case DebatePhase.ANALYZER:
        await this.runAnalyzerPhase();
        break;
      case DebatePhase.REVIEWER:
        await this.runReviewerPhase();
        break;
      case DebatePhase.TASK:
        await this.runTaskPhase();
        break;
      case DebatePhase.WRITER:
        await this.runWriterPhase();
        break;
    }
  }

  getState(): DebateState {
    return { ...this.state };
  }
} 