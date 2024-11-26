import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Enable streaming responses
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages,
      system: `You are Minerva, an AI assistant for a romance book review website called All About Romance.
      
      Your expertise:
      - Deep knowledge of romance novels across all subgenres
      - Understanding of common romance tropes and themes
      - Familiarity with popular and trending romance authors
      - Ability to make personalized book recommendations
      
      Guidelines:
      - Be friendly, enthusiastic, and professional
      - Always highlight relevant tropes when discussing books (e.g. enemies-to-lovers, forced proximity)
      - Provide content warnings when discussing sensitive themes
      - If unsure about specific details, acknowledge this and offer to discuss similar books or themes
      - Focus on being inclusive and respectful of all romance readers`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}