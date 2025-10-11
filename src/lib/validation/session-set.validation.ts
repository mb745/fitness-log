import { z } from "zod";
import type { SessionSetStatus } from "../../types";

/**
 * Zod enum for session set status values.
 * Represents the state of a training set execution.
 */
const sessionSetStatusEnum = z.enum(["pending", "completed", "skipped"], {
  errorMap: () => ({
    message: "Invalid status. Expected 'pending', 'completed', or 'skipped'",
  }),
});

/**
 * Validation schema for updating a session set.
 * All fields are optional (partial update), but at least one field must be provided.
 *
 * Business rules enforced:
 * - actual_reps: Must be >= 0 if provided
 * - weight_kg: Must be >= 0 and <= 9999.99 if provided (DECIMAL(6,2) limit)
 * - status: Must be one of the valid SessionSetStatus values
 * - At least one field must be present in the update
 */
export const sessionSetUpdateSchema = z
  .object({
    actual_reps: z
      .number()
      .int({ message: "Actual reps must be an integer" })
      .min(0, "Actual reps must be greater than or equal to 0")
      .optional(),
    weight_kg: z
      .number()
      .min(0, "Weight must be greater than or equal to 0")
      .max(9999.99, "Weight must not exceed 9999.99 kg")
      .optional(),
    status: sessionSetStatusEnum.optional(),
  })
  .strict() // Reject any additional fields not in the schema
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Validates the business rule: when status is 'completed', actual_reps must be provided.
 * This can be either in the current update data or already present in the database.
 *
 * @param data - The update data from the request
 * @param currentActualReps - The current actual_reps value from the database
 * @returns Validation result with error message if invalid
 */
export function validateCompletedStatus(
  data: z.infer<typeof sessionSetUpdateSchema>,
  currentActualReps: number | null
): { valid: boolean; error?: string } {
  if (data.status === "completed") {
    const hasActualReps = data.actual_reps !== undefined || currentActualReps !== null;
    if (!hasActualReps) {
      return {
        valid: false,
        error: "Actual reps are required when status is 'completed'",
      };
    }
  }
  return { valid: true };
}

/**
 * Validates status transitions according to business rules.
 * Only allows transitions from 'pending' to 'completed' or 'skipped'.
 * Transitions from 'completed' or 'skipped' back to 'pending' or between
 * final states are not allowed.
 *
 * Allowed transitions:
 * - pending → completed ✓
 * - pending → skipped ✓
 * - pending → pending ✓ (no-op)
 * - completed → completed ✓ (no-op, allows updating other fields)
 * - skipped → skipped ✓ (no-op, allows updating other fields)
 *
 * Forbidden transitions:
 * - completed → pending ✗
 * - completed → skipped ✗
 * - skipped → pending ✗
 * - skipped → completed ✗
 *
 * @param currentStatus - The current status from the database
 * @param newStatus - The new status from the request (undefined if not changing)
 * @returns Validation result with error message if invalid
 */
export function validateStatusTransition(
  currentStatus: SessionSetStatus,
  newStatus?: SessionSetStatus
): { valid: boolean; error?: string } {
  // No transition or no-op transition - always allowed
  if (!newStatus || newStatus === currentStatus) {
    return { valid: true };
  }

  // Only allow transitions from 'pending' to other states
  if (currentStatus === "pending") {
    if (newStatus === "completed" || newStatus === "skipped") {
      return { valid: true };
    }
  }

  // All other transitions are forbidden
  return {
    valid: false,
    error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Only 'pending → completed' or 'pending → skipped' transitions are allowed.`,
  };
}

// Type inference export for TypeScript type safety
export type SessionSetUpdateInput = z.infer<typeof sessionSetUpdateSchema>;
