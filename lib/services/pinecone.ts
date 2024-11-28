import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { ReviewMetadata, formatReviewMetadata } from '../validators/book-data';

export class PineconeService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private indexName: string;

  constructor() {
    this.pinecone = new Pinecone();
    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small"
    });
    this.indexName = process.env.PINECONE_INDEX_NAME!;
  }

  async getVectorStore() {
    const pineconeIndex = this.pinecone.Index(this.indexName);
    return await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex
    });
  }

  async getRelevantReviews(query: string, k: number = 4): Promise<Document[]> {
    const vectorStore = await this.getVectorStore();
    const retriever = vectorStore.asRetriever(k);
    
    try {
      return await retriever.getRelevantDocuments(query);
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  async addReview(review: ReviewMetadata) {
    const vectorStore = await this.getVectorStore();
    const metadata = formatReviewMetadata(review);
    
    // Create document with review content and metadata
    // Format the review content in a structured way
    const pageContent = `
Book Review: ${review.title} by ${review.authorName}
${review.grade ? `Grade: ${review.grade}` : ''}
${review.sensuality ? `Sensuality Rating: ${review.sensuality}` : ''}
${review.bookTypes?.length ? `Categories: ${review.bookTypes.join(', ')}` : ''}
${review.reviewAuthor ? `Reviewed by: ${review.reviewAuthor}` : ''}

Review:
${review.content}

${review.comments?.length ? `Reader Comments:\n${review.comments.map(c => 
  `${c.author} says: ${c.content}`
).join('\n')}` : ''}`.trim();

    const doc = new Document({
      pageContent,
      metadata
    });

    try {
      await vectorStore.addDocuments([doc]);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  }

  async deleteReview(postId: string) {
    const pineconeIndex = this.pinecone.Index(this.indexName);
    try {
      await pineconeIndex.deleteOne(postId);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
}

export const pineconeService = new PineconeService();