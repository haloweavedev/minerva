'use server';

import { createStreamableValue } from 'ai/rsc';
import { type Message } from 'ai';
import { chatService } from '@/lib/services/chat';

export type { Message };

export async function continueConversation(history: Message[]) {
  const stream = createStreamableValue();

  (async () => {
    try {
      console.log('Processing message:', history[history.length - 1].content);

      // Get streaming response from chat service
      const textStream = await chatService.processMessage(history);
      let fullResponse = '';

      // Stream the response chunks
      for await (const chunk of textStream) {
        fullResponse += chunk;
        stream.update(chunk);
      }

      console.log('Full response:', fullResponse);
      stream.done();

    } catch (error) {
      console.error('Error in chat stream:', error);
      stream.update(
        "I apologize, but I encountered an error accessing the review database. " +
        "This has been logged and will be investigated. Please try again in a moment."
      );
      stream.done();
    }
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}