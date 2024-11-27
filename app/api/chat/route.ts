import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { streamText } from 'ai';
import { openai as aiopenai } from '@ai-sdk/openai';

interface ReviewMetadata {
  bookTitle: string;
  authorName: string;
  grade: string;
  sensuality: string;
  url?: string;
  amazonUrl?: string;
  asin?: string;
  chunkType?: string;
  bookTypes?: string[];
  text: string;
  comments?: {
    count: number;
    latest?: Array<{
      commentAuthor: string;
      commentContent: string;
    }>;
  };
}

interface BookDetails {
  title: string;
  author: string;
  grade: string;
  sensuality: string;
  url?: string;
  asin?: string;
  bookTypes?: string[];
  comments?: number;
  score?: number;
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const embeddingResponse = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: lastMessage.content,
      encoding_format: "float",
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME!);
    const queryResponse = await index.query({
      vector: embedding,
      topK: 4,
      includeMetadata: true,
    });

    const indexedBooks = new Map<string, BookDetails>();
    queryResponse.matches?.forEach(match => {
      const meta = match.metadata as unknown as ReviewMetadata;
      if (meta?.bookTitle) {
        indexedBooks.set(meta.bookTitle, {
          title: meta.bookTitle,
          author: meta.authorName,
          grade: meta.grade,
          sensuality: meta.sensuality,
          url: meta.url,
          asin: meta.asin,
          bookTypes: meta.bookTypes,
          comments: meta.comments?.count || 0,
          score: match.score,
        });
      }
    });

    const relevantContent = queryResponse.matches
      ?.filter(match => match.score && match.score > 0.5)
      ?.map(match => {
        const metadata = match.metadata as unknown as ReviewMetadata;
        const comments = metadata.comments?.latest
          ?.map(c => `${c.commentAuthor}: ${c.commentContent}`)
          .join('\n') || '';
          
        const buyLink = metadata.asin 
          ? `Amazon ASIN: ${metadata.asin}`
          : 'Buy link not available';
          
        return `
Type: ${(metadata.chunkType || '').toUpperCase()}
Book: "${metadata.bookTitle}" by ${metadata.authorName}
Grade: ${metadata.grade}
Sensuality: ${metadata.sensuality}
Book Types: ${metadata.bookTypes?.join(', ') || 'Not specified'}
Review Link: ${metadata.url || 'Not available'}
${buyLink}
${metadata.comments?.count ? `Number of Comments: ${metadata.comments.count}` : ''}
${comments ? `\nReader Comments:\n${comments}` : ''}
Content: ${metadata.text}
        `.trim();
      }).join('\n\n---\n\n');

    const currentBooks = Array.from(indexedBooks.values())
      .map(book => `${book.title} (${book.grade}, ${book.sensuality}) by ${book.author}`)
      .join(', ');

    const result = await streamText({
      model: aiopenai('gpt-4o-mini'),
      messages,
      system: `You are Minerva, an AI assistant for All About Romance, a romance book review website. 

Available books in our database: ${currentBooks}

Relevant review information:
${relevantContent || 'No specific reviews found for this query.'}

Guidelines:
- ONLY recommend or discuss books that are shown in the "Available books" list above
- When mentioning a book, always include its grade and sensuality rating
- When providing book purchase information, use the ASIN format: "You can find this book on Amazon using ASIN: [code]"
- Share reader comments when available
- Always mention book types when discussing books
- If you can't find specific information, clearly state what you do know
- If asked for recommendations, only suggest books from our database that match the criteria
- Keep responses focused on the information we have indexed`,
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Error in chat route:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}