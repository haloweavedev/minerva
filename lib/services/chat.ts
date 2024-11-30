import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Message } from 'ai';
import { pineconeService } from './pinecone';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

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

const SYSTEM_TEMPLATE = `You are Minerva, an AI assistant for All About Romance (AAR). You help users discover and discuss romance books based on AAR's reviews.

When responding about books, ALWAYS structure your response in this format:

1. First output the book data in this exact format:
<book-data>
${BOOK_DATA_TEMPLATE}
</book-data>

2. Then format your response based on the query type:

FOR BOOK REVIEWS:
# Review of [Title] by [Author]

## Overview
[2-3 sentences summarizing the book and review]

## Review Details
• Grade: [grade] from [reviewer name]
• Published: [date]
• Sensuality: [rating]
• Genre: [book types]

## Key Points
• [3-4 key points about the book/review]

[If comments exist:]
## Reader Comments ([count] total):
• [Reader name]: "[exact quote]"

FOR RECOMMENDATIONS:
# Books Similar to [Title]

For each recommendation:
1. Include book data block
2. Add:

## Why You Might Like This:
• [2-3 specific similarities]
• [Notable themes/elements]
• [Grade and reviewer perspective]

IMPORTANT RULES:
1. ALWAYS start with the book data block
2. Only discuss books from the provided metadata
3. Use bullet points (•) consistently
4. Keep responses clear and concise
5. Format text professionally
6. If no relevant information is found, say "I apologize, but I don't have enough information to answer that question accurately."

Available metadata: {metadata}
Context: {context}
Human: {question}
AI: Let me help you with that. Based on the information I have:`;

export class ChatService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
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

  private extractBookMetadata(docs: any[]): Record<string, any> {
    return docs.reduce((acc: Record<string, any>, doc) => {
      const metadata = doc.metadata;
      if (!metadata?.bookTitle || !metadata?.authorName) return acc;

      const key = `${metadata.bookTitle}-${metadata.authorName}`;
      
      const validComments = (metadata.commentContents || [])
        .map((content: string, index: number) => ({
          author: metadata.commentAuthors?.[index]?.trim() || '',
          content: content?.trim() || ''
        }))
        .filter(c => c.author && c.content);

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

      return await chain.stream(latestMessage.content);

    } catch (error) {
      console.error('Error in chat chain:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();