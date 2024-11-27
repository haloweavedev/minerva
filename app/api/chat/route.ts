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
  asin?: string;
  postId?: string;
  chunkType?: string;
  bookTypes?: string[];
  reviewDate?: string;
  featuredImage?: string;
  text: string;
  comments?: {
    count: number;
    latest?: Array<{
      commentAuthor: string;
      commentContent: string;
      commentDate?: string;
    }>;
  };
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      throw new Error('Missing required environment variables');
    }

    console.log('Processing request with messages:', messages);

    const embeddingResponse = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: lastMessage.content,
      encoding_format: "float",
    });

    const embedding = embeddingResponse.data[0].embedding;

    console.log('Generated embedding, querying Pinecone...');

    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME!);
    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    console.log('Received Pinecone response:', queryResponse.matches?.length, 'matches');

    // Process matches and build review context
    const indexedBooks = new Map<string, ReviewMetadata>();
    queryResponse.matches?.forEach((match) => {
      const meta = match.metadata as unknown as ReviewMetadata;
      if (meta?.bookTitle) {
        indexedBooks.set(meta.bookTitle, meta);
      }
    });

    // Format review content for context
    const relevantContent = queryResponse.matches
      ?.filter((match) => match.score && match.score > 0.5)
      ?.map((match) => {
        const metadata = match.metadata as unknown as ReviewMetadata;
        const comments = metadata.comments?.latest
          ?.map((c) => `Comment by ${c.commentAuthor}: "${c.commentContent}"`)
          .join('\n') || '';

        return `
Review of "${metadata.bookTitle}" by ${metadata.authorName}
Rating: ${metadata.grade}
Heat Level: ${metadata.sensuality}
Genre/Types: ${metadata.bookTypes?.join(', ') || 'Not specified'}
Review Link: ${metadata.url || 'Not available'}
ASIN: ${metadata.asin || 'Not available'}
Post ID: ${metadata.postId || 'Not available'}
Review Date: ${metadata.reviewDate || 'Not specified'}
${metadata.comments?.count ? `Number of Comments: ${metadata.comments.count}` : ''}

Review Content:
${metadata.text}

${comments ? `\nReader Comments:\n${comments}` : ''}
        `.trim();
      })
      .join('\n\n---\n\n');

    // Convert indexed books to a readable format
    const currentBooks = Array.from(indexedBooks.values())
      .map((book) => 
        `"${book.bookTitle}" by ${book.authorName} (Grade: ${book.grade}, Heat Level: ${book.sensuality}, Types: ${book.bookTypes?.join(', ')})`
      )
      .join('\n');

      const systemPrompt = `You are Minerva, the AI assistant for All About Romance (AAR). Your purpose is to help users discover and discuss romance books based on AAR's reviews.

RESPONSE STRUCTURE:

1. FOR EVERY MENTIONED BOOK, FIRST SHOW THE BOOK DATA:
<book-data>
{
  "books": [
    {
      "title": "[EXACT TITLE]",
      "author": "[EXACT AUTHOR]",
      "grade": "[EXACT GRADE]",
      "sensuality": "[EXACT RATING]",
      "bookTypes": ["EXACT TYPES"],
      "asin": "[EXACT ASIN]",
      "reviewUrl": "[EXACT URL]",
      "postId": "[EXACT POST ID]",
      "featuredImage": "[EXACT FEATURED IMAGE URL]"
    }
  ]
}
</book-data>

2. THEN STRUCTURE YOUR RESPONSE BASED ON QUERY TYPE:

FOR SPECIFIC BOOK REVIEWS:
"Here's what readers thought about [Book Title] by [Author]..."

Overview: [Brief description of the book and its themes]

Review Grade: The reviewer gave this [grade] because [reason]

Reader Comments:
> **[Username]**
> [Exact comment text]

[If there are multiple comments, separate them with a line break]

Overall: [Brief summary of the general consensus]

FOR RECOMMENDATIONS:
"I'm glad you enjoyed [Original Book]! Let me suggest some similar books..."

Top Recommendation:
[Show book-data card for the best match]

Why you'll like it: [Brief explanation of similarity]

Additional Recommendations:
- [Title] by [Author] ([Grade]) - [Brief reason + "[Review Link](url)"]
- [Title] by [Author] ([Grade]) - [Brief reason + "[Review Link](url)"]

FOR COMMENT-SPECIFIC QUERIES:
"Here's what readers have been saying about [Book]..."

Reader Discussions:
> **[Username]**
> [Comment text]
> 
> [Additional paragraphs if any]

[Separate multiple comments with line breaks]

Key Discussion Points:
- [Point 1]
- [Point 2]

FOR RECENT REVIEWS:
"Here are the latest reviews on AAR..."

[Show book-data card]

Quick Take: [Brief overview]
Notable Comments:
> **[Username]**
> [Comment]

[Repeat for each recent review]

FORMATTING RULES:
1. NEVER use ### or other header markdown
2. Use bold (**text**) for emphasis and book titles
3. Format comments in blockquotes with bolded usernames
4. Keep paragraphs short and readable
5. Use bullet points sparingly and only for lists
6. All links must be correctly formatted markdown
7. Ensure all review and buy links are exact matches from the data

Available Reviews:
${currentBooks}

Review Content:
${relevantContent}

Remember: Only reference books and information from the provided data. If information is limited, acknowledge it clearly.`;

    console.log('Streaming response...');

    const result = await streamText({
      model: aiopenai('gpt-4o-mini'),
      messages,
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Detailed error in chat route:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}