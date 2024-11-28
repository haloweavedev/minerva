import { Message } from 'ai'

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

export type ChatMessage = Message;

export interface ChatProps {
  initialMessages?: Message[];
  id?: string;
}

export interface BookData {
  title: string;
  author: string;
  grade?: string;
  sensuality?: string;
  bookTypes?: string[];
  asin?: string;
  reviewUrl?: string;
  postId?: string;
  featuredImage?: string;
}