export type Language = "zh-CN" | "en-US";
export type Tab = "home" | "ideas" | "create" | "pipeline" | "settings";
export type Energy = "low" | "medium" | "high";
export type Sleep = "poor" | "normal" | "good";
export type ChildState = "busy" | "normal" | "quiet" | "focus";
export type TimeBlock = "5" | "10" | "30" | "60";

export interface DailyState {
  energy: Energy;
  sleep: Sleep;
  child: ChildState;
  time: TimeBlock;
  pressure: Energy;
}

export interface Idea {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
  favorite: boolean;
}

export interface PipelineItem {
  id: string;
  title: string;
  originalIdea: string;
  platform: string;
  contentType: string;
  status: string;
  energyLevel: Energy;
  timeNeeded: TimeBlock;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  nextStep: string;
  interruptionCheckpoint?: string;
  generatedOutputs: string;
  language: Language;
  favorite: boolean;
  archived: boolean;
}

export interface AppSettings {
  language: Language;
  aiProvider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  remindersEnabled: boolean;
}
