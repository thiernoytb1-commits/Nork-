
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  updatedAt: number;
}

export type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
