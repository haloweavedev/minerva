import { z } from 'zod';

// Review metadata for Pinecone
export const ReviewMetadataSchema = z.object({
  postId: z.string().optional(),
  title: z.string(),
  authorName: z.string(),
  permalink: z.string().url().optional(),
  featuredImage: z.string().url().optional(),
  excerpt: z.string().optional(),
  content: z.string(),
  grade: z.string().optional(),
  sensuality: z.string().optional(),
  bookTypes: z.array(z.string()).optional(),
  reviewTags: z.array(z.string()).optional(),
  amazonLinks: z.array(z.string().url()).optional(),
  asin: z.string().optional(),
  publishDate: z.string().optional(),
  reviewAuthor: z.string().optional(),
  comments: z.array(z.object({
    author: z.string(),
    content: z.string(),
    date: z.string()
  })).optional()
});

// Book schema for chat responses
export const BookSchema = z.object({
  title: z.string(),
  author: z.string(),
  grade: z.string().optional(),
  sensuality: z.string().optional(),
  bookTypes: z.array(z.string()).optional(),
  asin: z.string().optional(),
  reviewUrl: z.string().url().optional(),
  postId: z.string().optional(),
  featuredImage: z.string().url().optional(),
  excerpt: z.string().optional(),
  reviewAuthor: z.string().optional(),
  publishDate: z.string().optional()
});

// Validation schema for chat responses
export const BookDataSchema = z.object({
  books: z.array(BookSchema)
});

// Export types
export type ReviewMetadata = z.infer<typeof ReviewMetadataSchema>;
export type Book = z.infer<typeof BookSchema>;
export type BookData = z.infer<typeof BookDataSchema>;

// Helper to validate and extract book data from chat responses
export function extractBookData(content: string): BookData | null {
  const bookDataMatch = content.match(/<book-data>(.*?)<\/book-data>/s);
  if (!bookDataMatch) return null;
  
  try {
    const bookData = JSON.parse(bookDataMatch[1]);
    return BookDataSchema.parse(bookData);
  } catch (error) {
    console.error('Error parsing book data:', error);
    return null;
  }
}

// Helper to format review metadata for vector storage
export function formatReviewMetadata(review: ReviewMetadata): Record<string, any> {
  return {
    postId: review.postId,
    title: review.title,
    authorName: review.authorName,
    permalink: review.permalink,
    featuredImage: review.featuredImage,
    excerpt: review.excerpt,
    content: review.content,
    grade: review.grade,
    sensuality: review.sensuality,
    bookTypes: review.bookTypes?.join(', '),
    reviewTags: review.reviewTags?.join(', '),
    amazonLinks: review.amazonLinks?.join(', '),
    asin: review.asin,
    publishDate: review.publishDate,
    reviewAuthor: review.reviewAuthor
  };
}

// Helper to check if string is book data
export function isBookData(content: string): boolean {
  return content.includes('<book-data>') && content.includes('</book-data>');
}