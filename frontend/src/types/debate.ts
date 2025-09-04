export interface PublicDebate {
  id: string;
  topic: string;
  userId: string;
  userDisplayName: string;
  timestamp: string;
  sharedAt: string;
  views: number;
  upvotes: number;
  downvotes: number;
  categories: string[];
  model1: {
    name: string;
    stance: number;
    rhetoricStyle: string;
  };
  model2: {
    name: string;
    stance: number;
    rhetoricStyle: string;
  };
  rounds: Array<{
    speaker: string;
    text: string;
    summary: string;
  }>;
  isPro: boolean;
}
