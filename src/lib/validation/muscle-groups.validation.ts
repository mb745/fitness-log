import { z } from "zod";

/**
 * Validation schema for muscle group ID parameter.
 * Used in GET /api/v1/muscle-groups/:id/subgroups endpoint.
 */
export const muscleGroupIdParamSchema = z.object({
  id: z.coerce
    .number({
      invalid_type_error: "Muscle group ID must be a number",
    })
    .int("Muscle group ID must be an integer")
    .positive("Muscle group ID must be a positive integer"),
});

// Infer TypeScript type from Zod schema
export type MuscleGroupIdParam = z.infer<typeof muscleGroupIdParamSchema>;
