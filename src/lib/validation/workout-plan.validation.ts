import { z } from "zod";

/**
 * Validation schema for a single exercise in a workout plan.
 * Used when creating or replacing exercises in a plan.
 */
export const planExerciseInputSchema = z.object({
  exercise_id: z.number().int().positive("Exercise ID must be a positive integer"),
  order_index: z.number().int().nonnegative("Order index must be non-negative"),
  target_sets: z.number().int().positive("Target sets must be greater than 0"),
  target_reps: z.number().int().positive("Target reps must be greater than 0"),
  rest_seconds: z.number().int().nonnegative("Rest seconds must be non-negative"),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").nullable().optional(),
});

/**
 * Validation schema for creating a new workout plan.
 * Includes conditional validation for schedule types and unique order_index check.
 */
export const workoutPlanCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200, "Name must not exceed 200 characters"),
    schedule_type: z.enum(["weekly", "interval"], {
      errorMap: () => ({ message: "Schedule type must be 'weekly' or 'interval'" }),
    }),
    schedule_days: z
      .array(z.number().int().min(1, "Day must be between 1 and 7").max(7, "Day must be between 1 and 7"))
      .nullable(),
    schedule_interval_days: z.number().int().positive("Interval days must be greater than 0").nullable(),
    exercises: z
      .array(planExerciseInputSchema)
      .min(1, "At least one exercise is required")
      .max(50, "Maximum 50 exercises per plan"),
  })
  .superRefine((data, ctx) => {
    // Validate schedule-specific fields
    if (data.schedule_type === "weekly") {
      if (!data.schedule_days || data.schedule_days.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule days are required when schedule_type is 'weekly'",
          path: ["schedule_days"],
        });
      }
      if (data.schedule_interval_days !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule interval days must be null when schedule_type is 'weekly'",
          path: ["schedule_interval_days"],
        });
      }
    } else if (data.schedule_type === "interval") {
      if (data.schedule_interval_days === null || data.schedule_interval_days <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule interval days are required when schedule_type is 'interval'",
          path: ["schedule_interval_days"],
        });
      }
      if (data.schedule_days !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule days must be null when schedule_type is 'interval'",
          path: ["schedule_days"],
        });
      }
    }

    // Validate unique order_index within exercises array
    const orderIndexes = data.exercises.map((ex) => ex.order_index);
    const duplicates = orderIndexes.filter((item, index) => orderIndexes.indexOf(item) !== index);

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate order_index values found. Each exercise must have a unique order_index.",
        path: ["exercises"],
      });
    }
  });

/**
 * Validation schema for updating an existing workout plan.
 * All fields are optional (partial update).
 */
export const workoutPlanUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(200, "Name must not exceed 200 characters").optional(),
    schedule_type: z
      .enum(["weekly", "interval"], {
        errorMap: () => ({ message: "Schedule type must be 'weekly' or 'interval'" }),
      })
      .optional(),
    schedule_days: z
      .array(z.number().int().min(1, "Day must be between 1 and 7").max(7, "Day must be between 1 and 7"))
      .nullable()
      .optional(),
    schedule_interval_days: z.number().int().positive("Interval days must be greater than 0").nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // If schedule_type is being changed, validate consistency with schedule fields
    if (data.schedule_type) {
      if (data.schedule_type === "weekly") {
        // If updating to weekly, schedule_days should be provided or already set
        // and schedule_interval_days should be null
        if (data.schedule_interval_days !== undefined && data.schedule_interval_days !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Schedule interval days must be null when schedule_type is 'weekly'",
            path: ["schedule_interval_days"],
          });
        }
      } else if (data.schedule_type === "interval") {
        // If updating to interval, schedule_interval_days should be provided
        // and schedule_days should be null
        if (data.schedule_days !== undefined && data.schedule_days !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Schedule days must be null when schedule_type is 'interval'",
            path: ["schedule_days"],
          });
        }
      }
    }
  });

/**
 * Validation schema for bulk replacing exercises in a workout plan.
 */
export const planExercisesBulkReplaceSchema = z
  .object({
    exercises: z
      .array(planExerciseInputSchema)
      .min(1, "At least one exercise is required")
      .max(50, "Maximum 50 exercises per plan"),
  })
  .superRefine((data, ctx) => {
    // Validate unique order_index within exercises array
    const orderIndexes = data.exercises.map((ex) => ex.order_index);
    const duplicates = orderIndexes.filter((item, index) => orderIndexes.indexOf(item) !== index);

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate order_index values found. Each exercise must have a unique order_index.",
        path: ["exercises"],
      });
    }
  });

/**
 * Validation schema for updating a single exercise in a workout plan.
 * All fields are optional (partial update).
 */
export const planExercisePatchSchema = z.object({
  order_index: z.number().int().nonnegative("Order index must be non-negative").optional(),
  target_sets: z.number().int().positive("Target sets must be greater than 0").optional(),
  target_reps: z.number().int().positive("Target reps must be greater than 0").optional(),
  rest_seconds: z.number().int().nonnegative("Rest seconds must be non-negative").optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").nullable().optional(),
});

/**
 * Validation schema for pagination and filtering query parameters.
 */
export const workoutPlansListQuerySchema = z
  .object({
    is_active: z.string().optional(),
    page: z.string().optional(),
    page_size: z.string().optional(),
    sort: z.string().optional(),
  })
  .transform((data) => {
    return {
      is_active: data.is_active === "true" ? true : data.is_active === "false" ? false : undefined,
      page: data.page ? parseInt(data.page, 10) : 1,
      page_size: data.page_size ? Math.min(parseInt(data.page_size, 10), 100) : 20,
      sort: data.sort || "-created_at",
    };
  });

// Type inference exports
export type PlanExerciseInput = z.infer<typeof planExerciseInputSchema>;
export type WorkoutPlanCreateInput = z.infer<typeof workoutPlanCreateSchema>;
export type WorkoutPlanUpdateInput = z.infer<typeof workoutPlanUpdateSchema>;
export type PlanExercisesBulkReplaceInput = z.infer<typeof planExercisesBulkReplaceSchema>;
export type PlanExercisePatchInput = z.infer<typeof planExercisePatchSchema>;
export type WorkoutPlansListQueryInput = z.infer<typeof workoutPlansListQuerySchema>;
