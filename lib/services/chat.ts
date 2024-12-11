import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Message } from 'ai';
import { pineconeService } from './pinecone';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// Enhanced interfaces for type safety
interface Comment {
  author: string;
  content: string;
}

interface ReviewMetadata {
  bookTitle?: string;
  authorName?: string;
  grade?: string;
  sensuality?: string;
  bookTypes?: string[];
  commentAuthors?: string[];
  commentContents?: string[];
  asin?: string;
  url?: string;
  postId?: string;
  featuredImage?: string;
  reviewerName?: string;
  publishDate?: string;
  text?: string;
}

interface BookData {
  title: string;
  author: string;
  grade: string | null;
  sensuality: string | null;
  bookTypes: string[];
  asin: string | null;
  reviewUrl: string | null;
  postId: string | null;
  featuredImage: string | null;
  reviewerName: string | null;
  publishDate: string | null;
  comments: Comment[] | null;
  reviewContent: string | null;
}

interface ProcessedMetadata {
  [key: string]: BookData;
}

// Query Types for optimizing retrieval and response
type QueryType = 
  | 'RECOMMENDATION'
  | 'LATEST_REVIEWS'
  | 'READER_FEEDBACK'
  | 'BOOK_ANALYSIS'
  | 'TREND_ANALYSIS'
  | 'GENERAL';

// Constants for response optimization
const MAX_BOOKS_PER_RESPONSE = {
  RECOMMENDATION: 10,
  LATEST_REVIEWS: 4,
  READER_FEEDBACK: 1,
  BOOK_ANALYSIS: 1,
  TREND_ANALYSIS: 4,
  GENERAL: 2
};

const RETRIEVAL_COUNT = {
  RECOMMENDATION: 10,
  LATEST_REVIEWS: 6,
  READER_FEEDBACK: 3,
  BOOK_ANALYSIS: 2,
  TREND_ANALYSIS: 8,
  GENERAL: 4
};

const BOOK_DATA_TEMPLATE = `{{
  "books": [
    {{
      "title": string,
      "author": string,
      "grade": string | null,
      "sensuality": string | null,
      "bookTypes": string[],
      "asin": string | null,
      "reviewUrl": string | null,
      "postId": string | null,
      "featuredImage": string | null,
      "reviewerName": string | null,
      "publishDate": string | null,
      "reviewContent": string | null,
      "comments": Array<{{
        author: string,
        content: string
       }}> | null
    }}
  ]
}}`;

const SYSTEM_TEMPLATE = `You are Minerva, an AI assistant for All About Romance (AAR). Help users discover great romance books through AAR's reviews.

CRITICAL RULES:
1. ONLY recommend books that exist in the provided metadata. Never invent or hallucinate books.
2. ALL book information must be directly from the metadata, no exceptions.
3. Limit book recommendations based on query type.
4. Never repeat book information that's already shown in book cards.
5. Keep responses concise and focused.
6. Always cite reader comments when discussing feedback.

VERY IMPORTANT FORMAT RULES:
- Start responses with ---RESPONSE-START---
- Do not add any response end markers
- No asterisks (*) for emphasis 
- No markdown at start of response
- Begin with book-data block, then natural response

Response Structure:

1. Book Data Format (REQUIRED):
<book-data>
${BOOK_DATA_TEMPLATE}
</book-data>

2. For BOOK REVIEWS:
# [Title] by [Author]

## Review Overview
• Key themes and elements
• Notable aspects
• Reader reception

[If comments exist:]
## Reader Opinions
• Direct quotes with context

3. For RECOMMENDATIONS:
# Suggested Books
[Focus on WHY these specific books match the request]

4. For TRENDS/ANALYSIS:
# Analysis
- Present clear statistics (e.g., "2 out of 5 books", "40% of recent reviews")
- Compare specific metrics (grades, sensuality, genres)
- Note data limitations (e.g., "Based on X available reviews")
- Include time-based patterns when relevant
- Support trends with specific examples
- Identify notable outliers or exceptions

Remember for trends:
- Use exact numbers from available data
- Compare across relevant categories
- Note sample size limitations
- Focus on measurable patterns
- Cite specific examples to support trends

Remember:
- Only include books that are DIRECTLY relevant
- Focus on quality over quantity
- Be specific about why books are recommended
- Use reader comments to support points
- Keep formatting clean and consistent

Available metadata: {metadata}
Context: {context}
Human: {question}
Assistant: Analyzing your request to provide relevant recommendations:`;

export class ChatService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.5, // Reduced for more consistent outputs
      streaming: true,
      maxTokens: 1500,
      timeout: 60000
    });
  }

  private classifyQuery(query: string): QueryType {
    const normalizedQuery = query.toLowerCase();
    
    if (normalizedQuery.includes('similar') || 
        normalizedQuery.includes('like') || 
        normalizedQuery.includes('recommend')) {
      return 'RECOMMENDATION';
    }
    
    if (normalizedQuery.includes('latest') || 
        normalizedQuery.includes('recent') || 
        normalizedQuery.includes('new')) {
      return 'LATEST_REVIEWS';
    }
    
    if (normalizedQuery.includes('think') || 
        normalizedQuery.includes('opinion') || 
        normalizedQuery.includes('feedback') ||
        normalizedQuery.includes('comments')) {
      return 'READER_FEEDBACK';
    }
    
    if (normalizedQuery.includes('compare') || 
        normalizedQuery.includes('analysis') || 
        normalizedQuery.includes('explain')) {
      return 'BOOK_ANALYSIS';
    }
    
    if (normalizedQuery.includes('trend') || 
        normalizedQuery.includes('pattern') || 
        normalizedQuery.includes('across') ||
        normalizedQuery.includes('ratings') ||
        normalizedQuery.includes('grades') ||
        normalizedQuery.includes('sensuality') ||
        normalizedQuery.includes('compare')) {
      return 'TREND_ANALYSIS';
    }
    
    return 'GENERAL';
  }

  private formatChatHistory(messages: Message[]): BaseMessage[] {
    return messages.slice(-5).map(m => 
      m.role === 'user' 
        ? new HumanMessage(m.content) 
        : new AIMessage(m.content)
    );
  }

  private formatContext(context: string): string {
    return context
      .trim()
      .split('\n')
      .filter(line => line.length > 0 && !line.startsWith('Tags:'))
      .join('\n');
  }

  private validateBookMetadata(bookData: BookData): boolean {
    return !!(
      bookData.title &&
      bookData.author &&
      (bookData.grade || bookData.sensuality || bookData.bookTypes.length > 0)
    );
  }

  private extractBookMetadata(docs: any[]): ProcessedMetadata {
    return docs.reduce((acc: ProcessedMetadata, doc) => {
      const metadata = doc.metadata as ReviewMetadata;
      if (!metadata?.bookTitle || !metadata?.authorName) return acc;

      const key = `${metadata.bookTitle}-${metadata.authorName}`;
      
      const validComments: Comment[] = (metadata.commentContents || [])
        .map((content: string, index: number) => ({
          author: metadata.commentAuthors?.[index]?.trim() || '',
          content: content?.trim() || ''
        }))
        .filter((c: Comment) => c.author && c.content);

      const bookData = {
        title: metadata.bookTitle.trim(),
        author: metadata.authorName.trim(),
        grade: metadata.grade?.trim() || null,
        sensuality: metadata.sensuality?.trim() || null,
        bookTypes: Array.isArray(metadata.bookTypes) 
          ? metadata.bookTypes.map((t: string) => t.trim())
          : [],
        asin: metadata.asin?.trim() || null,
        reviewUrl: metadata.url?.trim() || null,
        postId: metadata.postId?.trim() || null,
        featuredImage: metadata.featuredImage?.trim() || null,
        reviewerName: metadata.reviewerName?.trim() || null,
        publishDate: metadata.publishDate?.trim() || null,
        comments: validComments.length > 0 ? validComments : null,
        reviewContent: metadata.text?.trim() || null
      };

      // Only add valid book entries
      if (this.validateBookMetadata(bookData)) {
        acc[key] = bookData;
      }

      return acc;
    }, {});
  }

  async processMessage(messages: Message[]) {
    const latestMessage = messages[messages.length - 1];
    
    try {
      const queryType = this.classifyQuery(latestMessage.content);
      const retrievalCount = RETRIEVAL_COUNT[queryType];
      
      const relevantDocs = await pineconeService.getRelevantReviews(
        latestMessage.content,
        retrievalCount
      );
      
      const bookMetadata = this.extractBookMetadata(relevantDocs);
      
      // Enhance context based on query type
      const context = relevantDocs
        .map(doc => doc.pageContent)
        .filter(Boolean)
        .join('\n\n');

      const prompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_TEMPLATE],
        new MessagesPlaceholder("chat_history"),
        ["human", "{question}"],
      ]);

      const chain = RunnableSequence.from([
        {
          question: (input: string) => input,
          context: () => this.formatContext(context),
          chat_history: () => this.formatChatHistory(messages.slice(0, -1)),
          metadata: () => JSON.stringify({
            books: bookMetadata,
            maxBooks: MAX_BOOKS_PER_RESPONSE[queryType],
            queryType
          }, null, 2)
        },
        prompt,
        this.llm,
        new StringOutputParser()
      ]);

      const stream = await chain.stream(latestMessage.content);
      return stream;

    } catch (error) {
      console.error('Error in chat chain:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();