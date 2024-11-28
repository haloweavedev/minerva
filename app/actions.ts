'use server';

import { createStreamableValue } from 'ai/rsc';
import { type Message } from 'ai';
import { chatService } from '@/lib/services/chat';

// Re-export Message type for use in other components
export type { Message };

// Timeout constant (30 seconds)
const STREAM_TIMEOUT = 30000;

/**
 * Server action to continue conversation with AI assistant
 * @param history Array of conversation messages
 * @returns Object containing message history and streamed response
 */
export async function continueConversation(history: Message[]) {
  const stream = createStreamableValue();
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Stream timeout'));
    }, STREAM_TIMEOUT);
  });

  (async () => {
    try {
      // Log incoming message
      const latestMessage = history[history.length - 1].content;
      console.log('Processing message:', latestMessage);

      // Get streaming response from chat service
      const textStream = await chatService.processMessage(history);
      let fullResponse = '';
      let lastUpdate = Date.now();

      // Stream response with race against timeout
      await Promise.race([
        (async () => {
          for await (const chunk of textStream) {
            fullResponse += chunk;
            
            // Rate limit updates to every 100ms
            const now = Date.now();
            if (now - lastUpdate >= 100) {
              stream.update(chunk);
              lastUpdate = now;
            }
          }
        })(),
        timeoutPromise
      ]);

      // Final update
      if (fullResponse) {
        stream.update(fullResponse);
        console.log('Completed response:', fullResponse.slice(0, 200) + '...');
      }
      
      stream.done();

    } catch (error) {
      console.error('Error in chat stream:', error);
      
      let errorMessage: string;
      
      if (error instanceof Error) {
        if (error.message === 'Stream timeout') {
          errorMessage = "I apologize, but the response took too long. Please try a shorter query or try again.";
        } else if (error.message.includes('database')) {
          errorMessage = "I apologize, but I encountered an error accessing the review database. This has been logged and will be investigated.";
        } else {
          errorMessage = "I apologize, but I encountered an error processing your request. Please try again in a moment.";
        }
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
      }

      // Send error message and complete stream
      stream.update(errorMessage);
      stream.done();
    }
  })();

  // Return message history and stream
  return {
    messages: history,
    newMessage: stream.value,
  };
}