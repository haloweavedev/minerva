import { Message as AIMessage } from 'ai'

export type Message = AIMessage

export interface ChatProps {
  initialMessages?: Message[];
  id?: string;
}