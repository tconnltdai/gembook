
export interface PersonalityTraits {
  analytical: number;
  creative: number;
  social: number;
  chaotic: number;
}

export interface AgentPersona {
  id: string;
  name: string;
  avatarSeed: string;
  bio: string;
  personality: string;
  traits: PersonalityTraits;
  interests: string[];
  joinedAt: number;
  role: string;
  credits?: number;
  generation?: number; // 1 = Original, 2+ = Evolved
}

export type PostContentType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'POLL';

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  likes: number;
  views: number;
  comments: string[];
  imageUrl?: string;
  isSticky?: boolean;
  contentType?: PostContentType;
  pollOptions?: string[];
  documentUrl?: string;
  reactions?: Record<string, number>;
  userReaction?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: number;
  likes: number;
  replyToCommentId?: string; // Parent comment ID for nested threading
}

export interface Zeitgeist {
  eraName: string;
  summary: string;
  mood: string;
  trendingTopics: string[];
  cohesionLevel?: number;
  dominantNarrative?: string;
  lastUpdated?: number;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  requiredLevel: number;
  color: string;
  type: 'PRESET' | 'CUSTOM';
  systemInstruction: string;
  config?: {
    economy?: boolean;
  };
}

export interface Suggestion {
  id: string;
  authorId: string;
  content: string;
  type: 'FEATURE' | 'BUG' | 'COMPLAINT' | 'REPORT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  relatedPostId?: string;
}

export interface InteractionEvent {
  id: string;
  timestamp: number;
  fromAgentId: string;
  toAgentId: string;
  type: 'REPLY' | 'REACTION'; // Added REACTION
  context: string;
}

export type ActivityType = 'POST_CREATED' | 'COMMENT_CREATED' | 'AGENT_JOINED' | 'SUGGESTION_CREATED' | 'ERA_SHIFT' | 'AGENT_EVOLVED';

export interface ActivityItem {
  id: string;
  agentId: string;
  type: ActivityType;
  timestamp: number;
  details?: {
    postId?: string;
    postTitle?: string;
    commentId?: string;
    suggestionId?: string;
    eraName?: string;
    generation?: number;
  };
}

export enum SimulationState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED'
}

export interface SimulationLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success' | 'action' | 'evolution'; // Added evolution
}

export type ActionType = 'CREATE_AGENT' | 'CREATE_POST' | 'CREATE_COMMENT' | 'CREATE_SUGGESTION';

export interface Report {
  id: string;
  title: string;
  date: number;
  type: 'DAILY_BRIEF' | 'EXPERIMENT_CONCLUSION' | 'ANOMALY_DETECTED';
  content: string; // Markdown supported
  keyFindings: string[];
}

export interface AppSettings {
  imageGenChance: number; // 0 to 1
  zeitgeistInterval: number; // Number of posts between updates
  maxAgents: number;
  actionDelay: number; // ms
  apiKey: string;
  language: string;   // Simulation and Interface language
  contextDepth: number; // Number of history items to include in context
  globalTemperature: number; // 0.0 to 2.0 (LLM Temperature)
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'evolution';
  duration?: number;
}

export type ViewType = 'DISCUSSIONS' | 'EXPERIMENTS' | 'MANIFESTO' | 'ADMIN' | 'REPORTS' | 'DOCUMENTATION' | 'SETTINGS';
