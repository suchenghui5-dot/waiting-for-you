// ─── 核心类型定义 — 前后端契约 ───

export interface User {
  id: string;
  phone: string;
  birth_year: number;
  city: string;
  garden_stage: number;
  cooling_completed: boolean;
  badges: string[];
  photo_real_promise: boolean;
}

export interface GardenState {
  stage: number;
  stageName: string;
  stageNameCN: string;
  progressInStage: number;
  totalProgress: number;
  growthMinutes: number;
  activeDays: number;
  nextStageName: string;
  message: string;
  color: string;
}

export interface WeeklyMatch {
  id: string;
  match_week: string;
  status: string;
  curator_note: string | null;
  icebreaker_question: string | null;
  mutual_confirmed: boolean;
  chat_open: boolean;
  chat_expires_at: string | null;
  decided_at: string | null;
}

export interface MatchProfile {
  id: string;
  birth_year: number;
  city: string;
  garden_stage: number;
  badges: string[];
  answers: UserAnswer[];
  personality_narrative: string;
}

export interface UserAnswer {
  id: string;
  question_id: number;
  answer_text: string;
  feedback_template_key: string | null;
  created_at: string;
}

export interface OpenQuestion {
  id: number;
  question_text: string;
  question_type: 'required' | 'optional';
  sort_order: number;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  nvc_flagged: boolean;
  created_at: string;
}

export interface CanvasEntry {
  id: string;
  entry_type: 'tag' | 'sentence' | 'emoji' | 'milestone';
  content: string;
  added_by: string;
  version: number;
  created_at: string;
}

export interface DailyStory {
  id: string;
  story_date: string;
  highlight_sentence: string;
  version_for_a: string;
  version_for_b: string;
}

export interface AdminDashboard {
  total_users: number;
  cooling_completed: number;
  pending_matches: number;
  mutual_confirmed: number;
  active_chats: number;
  feedback_reports: number;
}

export interface PersonalityDimensions {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}
