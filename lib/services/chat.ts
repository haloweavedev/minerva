import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Message } from 'ai';
import { pineconeService } from './pinecone';

const BOOK_DATA_TEMPLATE = `<book-data>
{{
  "books": [
    {{
      "title": "(bookTitle)",
      "author": "(authorName)",
      "grade": "(grade)",
      "sensuality": "(sensuality)",
      "bookTypes": "(bookTypes)",
      "asin": "(asin)",
      "reviewUrl": "(url)",
      "postId": "(postId)",
      "featuredImage": "(featuredImage)"
    }}
  ]
}}
</book-data>`;

const SYSTEM_TEMPLATE = `You are Minerva, an AI assistant for All About Romance (AAR). You help users discover and discuss romance books based on AAR's reviews. You must only provide information from the review metadata and context provided.

First, output any mentioned book's data using this exact format (include full metadata, no placeholders):

${BOOK_DATA_TEMPLATE}

Then, format your response based on the query type:

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
• [Point 1 about the book/review]
• [Point 2 about the book/review]
• [Point 3 about the book/review]

[ONLY if commentCount > 0:]
## Reader Comments ([X] total comments):
• [Reader 1 name]: "[exact quote]"
• [Reader 2 name]: "[exact quote]"

FOR RECOMMENDATIONS:
# Books Similar to [Title]

For each recommendation:
1. Insert book data block
2. Add:

## Why You Might Like [Title]:
• [2-3 specific similarities based on review]
• [Notable themes or elements]
• [Grade and reviewer perspective]

STRICT RULES:
1. Output MUST start with book data block - no text before it
2. Only discuss books present in provided metadata
3. Only include reader comments when commentCount > 0
4. Use bullet points (•) not asterisks (*) or dashes (-)
5. Always validate data exists before mentioning
6. Maintain consistent spacing and formatting

Available metadata: {metadata}
Context: {context}
History: {chat_history}
Question: {question}`;

export class ChatService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      streaming: true,
      maxTokens: 1500
    });
  }

  private formatChatHistory(messages: Message[]): string {
    return messages
      .slice(-3)
      .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
  }

  private formatContext(context: string): string {
    return context
      .trim()
      .split('\n')
      .filter(line => line.length > 0 && !line.startsWith('Tags:'))
      .join('\n');
  }

  private validateComment(comment: any): boolean {
    return comment?.author 
           && typeof comment.author === 'string' 
           && comment.author.trim().length > 0
           && comment?.content 
           && typeof comment.content === 'string' 
           && comment.content.trim().length > 0;
  }

  private extractBookMetadata(docs: any[]): Record<string, any> {
    return docs.reduce((acc: Record<string, any>, doc) => {
      const metadata = doc.metadata;
      if (!metadata?.bookTitle || !metadata?.authorName) return acc;

      const key = `${metadata.bookTitle}-${metadata.authorName}`;
      
      // Validate comments
      const validatedComments = (metadata.commentContents || [])
        .map((content: string, index: number) => ({
          author: metadata.commentAuthors?.[index]?.trim() || '',
          content: content?.trim() || ''
        }))
        .filter(this.validateComment);

      // Build clean metadata
      acc[key] = {
        bookTitle: metadata.bookTitle.trim(),
        authorName: metadata.authorName.trim(),
        grade: metadata.grade?.trim() || '',
        sensuality: metadata.sensuality?.trim() || '',
        bookTypes: Array.isArray(metadata.bookTypes) 
          ? metadata.bookTypes.map(t => t.trim())
          : [],
        asin: metadata.asin?.trim() || '',
        url: metadata.url?.trim() || '',
        postId: metadata.postId?.trim() || '',
        featuredImage: metadata.featuredImage?.trim() || '',
        reviewerName: metadata.reviewerName?.trim() || '',
        publishDate: metadata.publishDate?.trim() || '',
        commentCount: validatedComments.length,
        comments: validatedComments,
        reviewContent: metadata.text?.trim() || ''
      };

      // Ensure no undefined/null values
      Object.entries(acc[key]).forEach(([field, value]) => {
        if (value === undefined || value === null) {
          acc[key][field] = field.includes('Count') ? 0 : 
                           Array.isArray(value) ? [] : '';
        }
      });

      return acc;
    }, {});
  }

  async processMessage(messages: Message[]) {
    const latestMessage = messages[messages.length - 1];
    
    try {
      // Get relevant reviews
      const relevantDocs = await pineconeService.getRelevantReviews(
        latestMessage.content,
        4
      );
      
      // Extract metadata
      const bookMetadata = this.extractBookMetadata(relevantDocs);
      
      // Format context
      const context = relevantDocs
        .map(doc => doc.pageContent)
        .filter(Boolean)
        .join('\n\n');

      // Create prompt template
      const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

      // Create chain
      const chain = RunnableSequence.from([
        {
          question: (input: string) => input,
          context: () => this.formatContext(context),
          chat_history: () => this.formatChatHistory(messages),
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