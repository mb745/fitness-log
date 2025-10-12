import { z } from "zod";
import type { ScheduleType } from "../../types";

// ================= Plan Exercise =================
export const planExerciseInputSchema = z.object({
  exercise_id: z.number().int().positive(),
  order_index: z.number().int().nonnegative(),
  target_sets: z.number().int().positive(),
  target_reps: z.number().int().positive(),
  rest_seconds: z.number().int().positive().max(600).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// ================= Workout Plan =================
const workoutPlanBaseSchema = z.object({
  name: z.string().min(1).max(150),
  schedule_type: z.enum(["weekly", "interval"]).describe("weekly | interval") as z.ZodType<ScheduleType>,
  // Coerce string checkbox values (e.g., "\"1\"") to numbers so client form passes validation
  schedule_days: z.array(z.coerce.number().int().min(0).max(6)).nullable().optional(),
  schedule_interval_days: z.number().int().positive().max(30).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const workoutPlanCreateSchema = workoutPlanBaseSchema
  .extend({
    exercises: z.array(planExerciseInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.schedule_type === "weekly" && (!value.schedule_days || value.schedule_days.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "schedule_days is required for weekly schedule",
        path: ["schedule_days"],
      });
    }
    if (value.schedule_type === "interval" && value.schedule_interval_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "schedule_interval_days is required for interval schedule",
        path: ["schedule_interval_days"],
      });
    }
    const indexSet = new Set(value.exercises.map((e) => e.order_index));
    if (indexSet.size !== value.exercises.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order_index must be unique",
        path: ["exercises"],
      });
    }
  });

export const workoutPlanUpdateSchema = workoutPlanBaseSchema.partial().superRefine((value, ctx) => {
  if (value.schedule_type === "weekly" && value.schedule_interval_days !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "schedule_interval_days not allowed for weekly schedule",
      path: ["schedule_interval_days"],
    });
  }
  if (value.schedule_type === "interval" && value.schedule_days !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "schedule_days not allowed for interval schedule",
      path: ["schedule_days"],
    });
  }
});

// ================= Bulk Replace =================
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

// ================= Patch =================
export const planExercisePatchSchema = z.object({
  order_index: z.number().int().nonnegative("Order index must be non-negative").optional(),
  target_sets: z.number().int().positive("Target sets must be greater than 0").optional(),
  target_reps: z.number().int().positive("Target reps must be greater than 0").optional(),
  rest_seconds: z.number().int().nonnegative("Rest seconds must be non-negative").optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").nullable().optional(),
});

// ================= Query =================
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

// Helper TS types inferred from schemas
export type PlanExerciseInput = z.infer<typeof planExerciseInputSchema>;
export type WorkoutPlanCreateInput = z.infer<typeof workoutPlanCreateSchema>;
export type WorkoutPlanUpdateInput = z.infer<typeof workoutPlanUpdateSchema>;
export type PlanExercisesBulkReplaceInput = z.infer<typeof planExercisesBulkReplaceSchema>;
export type PlanExercisePatchInput = z.infer<typeof planExercisePatchSchema>;
export type WorkoutPlansListQueryInput = z.infer<typeof workoutPlansListQuerySchema>;
