import { z } from "zod";

/**
 * Zod enum for workout session status values.
 */
const workoutSessionStatusEnum = z.enum(["scheduled", "in_progress", "completed", "abandoned"], {
  errorMap: () => ({ message: "Invalid status. Expected 'scheduled', 'in_progress', 'completed', or 'abandoned'" }),
});

/**
 * ISO Date string validation (YYYY-MM-DD format).
 * Validates format only, not actual date validity.
 */
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Invalid date format. Expected ISO-8601 date string (YYYY-MM-DD)",
});

/**
 * Validation schema for creating a new workout session.
 * Requires workout_plan_id and scheduled_for date.
 */
export const sessionCreateSchema = z.object({
  workout_plan_id: z.number().int().positive({
    message: "workout_plan_id must be a positive integer",
  }),
  scheduled_for: isoDateString,
  notes: z.string().max(2000, "Notes must not exceed 2000 characters").optional(),
});

/**
 * Validation schema for updating an existing workout session.
 * All fields are optional (partial update).
 * At least one field must be provided.
 */
export const sessionUpdateSchema = z
  .object({
    status: workoutSessionStatusEnum.optional(),
    scheduled_for: isoDateString.optional(),
    notes: z.string().max(2000, "Notes must not exceed 2000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Validation schema for query parameters when listing workout sessions.
 * Supports filtering by status, date range, pagination, and sorting.
 */
export const sessionQuerySchema = z
  .object({
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.number().int().positive().optional(),
    page_size: z.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    workout_plan_id: z.preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().int().positive({ message: "workout_plan_id must be a positive integer" }).optional()
    ),
  })
  .transform((data) => {
    // Validate status enum if provided
    const status = data.status ? workoutSessionStatusEnum.optional().parse(data.status) : undefined;

    // Validate date strings if provided
    const from = data.from ? isoDateString.optional().parse(data.from) : undefined;
    const to = data.to ? isoDateString.optional().parse(data.to) : undefined;

    const sort = data.sort;
    const workout_plan_id = data.workout_plan_id;

    return {
      status,
      from,
      to,
      page: data.page,
      page_size: data.page_size,
      sort: data.sort,
      workout_plan_id,
    };
  });

// Type inference exports for TypeScript type safety
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>;
