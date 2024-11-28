import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Message } from 'ai';
import { pineconeService } from './pinecone';

const SYSTEM_TEMPLATE = `You are Minerva, an AI assistant for All About Romance (AAR). Your purpose is to help users discover and discuss romance books based on AAR's reviews.

The following metadata is available for relevant books: {metadata}

When discussing specific books, use this exact format for EACH book you mention:

<book-data>
{{{{
  "books": [
    {{{{
      "title": "(use bookTitle from metadata)",
      "author": "(use authorName from metadata)",
      "grade": "(use grade from metadata)",
      "sensuality": "(use sensuality from metadata)",
      "bookTypes": "(use bookTypes array from metadata)",
      "asin": "(use asin from metadata)",
      "reviewUrl": "(use url from metadata)",
      "postId": "(use postId from metadata)",
      "featuredImage": "(use featuredImage from metadata)"
    }}}}
  ]
}}}}
</book-data>

Then structure your response based on the query type:

FOR BOOK REVIEWS:
Start with "Here's what All About Romance thought about [Book Title] by [Author]..."
Then provide:
1. Overview of the book's premise (2-3 sentences)
2. The review grade and reasoning (1-2 sentences)
3. Key points from the review (use bullet points)
4. Reader Reception (if commentCount > 0, include 2-3 notable comments)

FOR RECOMMENDATIONS:
- List 3-4 recommended books
- For each book include the book-data block
- Explain why each book is recommended
- Include grades and key themes

FOR COMPARISONS:
- Use book-data blocks for all books being compared
- Highlight key similarities and differences
- Compare grades, themes, and reader reception
- Provide a balanced analysis

Use only information from the provided context:
{context}

Current conversation:
{chat_history}

Question: {question}

Remember:
1. Include ALL available metadata fields in the book-data block
2. Format book titles and author names exactly as they appear in reviews
3. When there are reader comments, include 2-3 most relevant ones
4. Keep paragraphs concise and well-formatted
5. Use markdown for formatting key points and quotes`;

export class ChatService {
  private llm: ChatOpenAI;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true
    });
  }

  private formatChatHistory(messages: Message[]): string {
    return messages
      .slice(0, -1)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  private formatContext(context: string): string {
    return context.trim();
  }

  private extractBookMetadata(docs: any[]): Record<string, any> {
    return docs.reduce((acc: Record<string, any>, doc) => {
      const metadata = doc.metadata;
      if (metadata?.bookTitle && metadata?.authorName) {
        // Create a unique key for each book
        const key = `${metadata.bookTitle}-${metadata.authorName}`;
        
        // Format metadata for the book
        acc[key] = {
          bookTitle: metadata.bookTitle,
          authorName: metadata.authorName,
          grade: metadata.grade,
          sensuality: metadata.sensuality,
          bookTypes: metadata.bookTypes || [],
          asin: metadata.asin,
          url: metadata.url,
          postId: metadata.postId,
          featuredImage: metadata.featuredImage,
          amazonUrl: metadata.amazonUrl,
          reviewerName: metadata.reviewerName,
          publishDate: metadata.publishDate,
          commentCount: metadata.commentCount || 0,
          commentAuthors: metadata.commentAuthors || [],
          commentContents: metadata.commentContents || [],
          reviewTags: metadata.reviewTags || []
        };
      }
      return acc;
    }, {});
  }

  async processMessage(messages: Message[]) {
    const latestMessage = messages[messages.length - 1];
    
    // Get relevant reviews from Pinecone
    const relevantDocs = await pineconeService.getRelevantReviews(
      latestMessage.content
    );
    
    // Extract and format metadata
    const bookMetadata = this.extractBookMetadata(relevantDocs);
    
    // Format context from documents
    const context = relevantDocs
      .map(doc => doc.pageContent)
      .join('\n\n');

    // Create prompt template
    const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

    // Create chain with formatted metadata
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

    return chain.stream(latestMessage.content);
  }
}

export const chatService = new ChatService();