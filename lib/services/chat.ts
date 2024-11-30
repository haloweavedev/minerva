import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Message } from 'ai';
import { pineconeService } from './pinecone';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// TypeScript interfaces for better type safety
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

VERY IMPORTANT:
- Always start the responses with ---RESPONSE-START---
- DO NOT use asterisks (*) for emphasis 
- DO NOT add any markdown or formatting at the start of your response
- Start DIRECTLY with the book-data block, then your natural response

Structure your responses exactly as follows:

1. First output this exact format (no other text before this):
<book-data>
${BOOK_DATA_TEMPLATE}
</book-data>

2. Then for BOOK REVIEWS:
# [Title] by [Author] - Overview

## Review Details
• Grade: [grade] from [reviewer name]
• Published: [date]
• Genre: [book types]
• Sensuality: [rating]

## Summary
[2-3 sentences about the book]

## Highlights
• [2-3 notable points from review]

[If comments exist:]
## Reader Feedback
• [Reader name]: "[direct quote]"

3. For RECOMMENDATIONS:
# Books You Might Enjoy

For each recommendation:
## [Title] by [Author]
• Brief overview 
• Notable themes or elements
• Why readers enjoyed it

Keep language natural and clear. Focus on what readers care about most.

Available metadata: {metadata}
Context: {context}
Human: {question}
Assistant: Let me find relevant books based on your request:`;

export class ChatService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true,
      maxTokens: 1500,
      timeout: 60000 // 60 seconds timeout
    });
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

  private extractBookMetadata(docs: any[]): ProcessedMetadata {
    return docs.reduce((acc: ProcessedMetadata, doc) => {
      const metadata = doc.metadata as ReviewMetadata;
      if (!metadata?.bookTitle || !metadata?.authorName) return acc;

      const key = `${metadata.bookTitle}-${metadata.authorName}`;
      
      // Fixed TypeScript error by properly typing the comment
      const validComments: Comment[] = (metadata.commentContents || [])
        .map((content: string, index: number) => ({
          author: metadata.commentAuthors?.[index]?.trim() || '',
          content: content?.trim() || ''
        }))
        .filter((c: Comment) => c.author && c.content);

      acc[key] = {
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

      return acc;
    }, {});
  }

  async processMessage(messages: Message[]) {
    const latestMessage = messages[messages.length - 1];
    
    try {
      // Get relevant reviews
      const relevantDocs = await pineconeService.getRelevantReviews(
        latestMessage.content,
        6
      );
      
      const bookMetadata = this.extractBookMetadata(relevantDocs);
      
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
          metadata: () => JSON.stringify(bookMetadata, null, 2)
        },
        prompt,
        this.llm,
        new StringOutputParser()
      ]);

      // Stream the response
      const stream = await chain.stream(latestMessage.content);
      return stream;

    } catch (error) {
      console.error('Error in chat chain:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();