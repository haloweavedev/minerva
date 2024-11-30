'use server';

import { createStreamableValue } from 'ai/rsc';
import { type Message } from 'ai';
import { chatService } from '@/lib/services/chat';

export type { Message };

// Increased timeout to 60 seconds
const STREAM_TIMEOUT = 60000;

// Rate limiting constants
const RATE_LIMIT = {
  MAX_REQUESTS: 50,
  WINDOW_MS: 60000, // 1 minute
};

// In-memory rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];

  // Clean old requests
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT.WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
    return true;
  }

  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return false;
}

export async function continueConversation(
  history: Message[],
  userId: string = 'anonymous'
) {
  const stream = createStreamableValue();

  // Check rate limit
  if (isRateLimited(userId)) {
    stream.update("I apologize, but you've reached the rate limit. Please try again in a minute.");
    stream.done();
    return {
      messages: history,
      newMessage: stream.value,
    };
  }

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Stream timeout'));
    }, STREAM_TIMEOUT);
  });

  (async () => {
    try {
      const latestMessage = history[history.length - 1].content;
      console.log('Processing message:', latestMessage);

      const textStream = await chatService.processMessage(history);
      let fullResponse = '';
      let lastUpdate = Date.now();

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

      stream.update(errorMessage);
      stream.done();
    }
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}