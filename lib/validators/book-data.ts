import { z } from 'zod';

// Book data validation schema
const BookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  grade: z.string().regex(/^[A-F][+-]?$/, "Invalid grade format"),
  sensuality: z.enum(["Burning", "Hot", "Warm", "Subtle", "Kisses"]),
  bookTypes: z.array(z.string()).min(1, "At least one book type is required"),
  asin: z.string().regex(/^[0-9A-Z]{10}$/, "Invalid ASIN format"),
  reviewUrl: z.string().url("Invalid review URL"),
  featuredImage: z.string(),
  synopsis: z.string().optional(),
  comments: z.object({
    count: z.number().int().nonnegative(),
    highlights: z.array(z.string()).optional()
  }).optional()
});

export const BookDataSchema = z.object({
  books: z.array(BookSchema).min(1, "At least one book is required")
});

export function validateBookData(content: string): { 
  isValid: boolean; 
  data?: z.infer<typeof BookDataSchema>;
  error?: string 
} {
  try {
    // Extract book data
    const match = content.match(/<book-data>([\s\S]*?)<\/book-data>/);
    if (!match) {
      return { 
        isValid: false, 
        error: "Missing book-data structure" 
      };
    }

    // Parse JSON
    const json = JSON.parse(match[1]);
    
    // Validate against schema
    const result = BookDataSchema.safeParse(json);
    
    if (!result.success) {
      return {
        isValid: false,
        error: result.error.errors.map(e => e.message).join(", ")
      };
    }

    return {
      isValid: true,
      data: result.data
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid book data"
    };
  }
}

// Optional: Helper function to format error messages for display
export function formatValidationError(error: string): string {
  return `⚠️ Response validation failed: ${error}. This has been logged for improvement.`;
}