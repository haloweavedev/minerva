import { Message as AIMessage } from 'ai';

export interface ReviewMetadata {
  bookTitle: string;
  authorName: string;
  grade: string;
  sensuality: string;
  bookTypes?: string[];
  reviewTags?: string[];
  text: string;
}

export interface PineconeMatch {
  id: string;
  score: number;
  metadata?: ReviewMetadata;
}

export type Message = AIMessage;

export interface ChatProps {
  initialMessages?: Message[];
  id?: string;
}