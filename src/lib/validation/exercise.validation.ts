import { z } from "zod";

/**
 * Validation schema for exercise list query parameters.
 * Supports filtering, search, pagination, and sorting.
 */
export const exercisesQuerySchema = z.object({
  // Full-text search by exercise name
  q: z.string().trim().max(200, "Search query must be at most 200 characters").optional(),

  // Filter by muscle group
  muscle_group_id: z
    .number()
    .int("Muscle group ID must be an integer")
    .positive("Muscle group ID must be positive")
    .optional(),

  // Filter by muscle subgroup
  muscle_subgroup_id: z
    .number()
    .int("Muscle subgroup ID must be an integer")
    .positive("Muscle subgroup ID must be positive")
    .optional(),

  // Filter by exercise type
  type: z
    .enum(["compound", "isolation"], {
      errorMap: () => ({ message: "Type must be 'compound' or 'isolation'" }),
    })
    .optional(),

  // Filter by active status (default: true for public access)
  is_active: z
    .boolean({
      invalid_type_error: "is_active must be a boolean",
    })
    .optional(),

  // Pagination: page number (1-indexed)
  page: z.number().int("Page must be an integer").positive("Page must be greater than 0").default(1),

  // Pagination: items per page
  page_size: z
    .number()
    .int("Page size must be an integer")
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be at most 100")
    .default(20),

  // Sorting: field name with optional "-" prefix for descending order
  // Whitelist allowed fields: name, created_at, updated_at, exercise_type
  sort: z
    .string()
    .regex(
      /^-?(name|created_at|updated_at|exercise_type)$/,
      "Sort field must be one of: name, created_at, updated_at, exercise_type (prefix with '-' for descending)"
    )
    .optional(),
});

/**
 * Validation schema for exercise ID parameter.
 * Used in GET /api/v1/exercises/:id endpoint.
 */
export const exerciseIdSchema = z.object({
  id: z.number().int("Exercise ID must be an integer").positive("Exercise ID must be greater than 0"),
});

// Infer TypeScript types from Zod schemas
export type ExercisesQueryInput = z.infer<typeof exercisesQuerySchema>;
export type ExerciseIdInput = z.infer<typeof exerciseIdSchema>;
