import { z } from "zod";

/**
 * Validation schema for creating a user profile.
 * All fields are optional as a profile can be created empty.
 */
export const profileCreateSchema = z
  .object({
    weight_kg: z
      .number()
      .positive("Weight must be greater than 0")
      .max(500, "Weight must be less than or equal to 500")
      .optional(),
    height_cm: z
      .number()
      .int("Height must be an integer")
      .min(100, "Height must be at least 100 cm")
      .max(250, "Height must be at most 250 cm")
      .optional(),
    gender: z.string().max(20, "Gender must be at most 20 characters").trim().optional(),
    injuries_limitations: z.string().trim().optional(),
  })
  .strict(); // Reject unknown properties

/**
 * Validation schema for updating a user profile.
 * Partial schema allows updating any subset of fields.
 */
export const profileUpdateSchema = profileCreateSchema.partial();

// Infer TypeScript types from Zod schemas
export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
