import type { APIContext } from "astro";
import { SessionSetService } from "../../../../lib/services/session-set.service";
import {
  sessionSetUpdateSchema,
  validateCompletedStatus,
  validateStatusTransition,
} from "../../../../lib/validation/session-set.validation";
import {
  checkAuth,
  jsonResponse,
  errorResponse,
  logApiError,
  parseIntParam,
  parseRequestBody,
  handleZodError,
  NotFoundError,
} from "../../../../lib/api-helpers";

export const prerender = false;

/**
 * PATCH /api/v1/session-sets/:id
 * Update a session set (record actual reps, weight, and status).
 *
 * Path parameters:
 * - id: Session set ID (integer)
 *
 * Request body (all fields optional, at least one required):
 * - actual_reps: Number of reps actually performed (integer >= 0)
 * - weight_kg: Weight used in kg (number 0-9999.99)
 * - status: Execution status (pending, completed, skipped)
 *
 * Business rules:
 * - Session sets can only be updated when parent session is 'in_progress'
 * - Status transitions: only 'pending → completed' or 'pending → skipped' allowed
 * - When status = 'completed', actual_reps is required (in request or already in DB)
 *
 * Returns: 200 with updated session set
 * Errors:
 * - 400 (validation error, invalid ID, invalid status transition)
 * - 401 (unauthorized)
 * - 403 (session not in progress, no access to session set)
 * - 404 (session set not found)
 * - 500 (server error)
 */
export async function PATCH(context: APIContext): Promise<Response> {
  let userId: string | null = null;

  try {
    // 1. Check authentication
    userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // 2. Parse and validate path parameter (session set ID)
    let sessionSetId: number;
    try {
      sessionSetId = parseIntParam(context.params.id, "session set ID");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid session set ID";
      return errorResponse("Bad Request", message, 400);
    }

    // 3. Parse request body
    const body = await parseRequestBody(context.request);
    if (!body) {
      return errorResponse("Bad Request", "Invalid JSON in request body", 400);
    }

    // 4. Validate request body with Zod schema
    const validation = sessionSetUpdateSchema.safeParse(body);
    if (!validation.success) {
      return handleZodError(validation.error);
    }

    const updates = validation.data;

    // 5. Get session set with parent session details
    const service = new SessionSetService(context.locals.supabase);
    let sessionSet;
    try {
      sessionSet = await service.getSessionSetWithSession(sessionSetId, userId);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return errorResponse("Not Found", "Session set not found", 404);
      }
      throw error; // Re-throw for 500 handler
    }

    // 6. Validate parent session status (must be 'in_progress')
    if (sessionSet.workout_sessions.status !== "in_progress") {
      logApiError(
        `PATCH /api/v1/session-sets/${sessionSetId}`,
        userId,
        new Error(`Session not in progress: ${sessionSet.workout_sessions.status}`),
        "warn"
      );

      return errorResponse(
        "Forbidden",
        "Session sets can only be updated when the workout session is in progress",
        403
      );
    }

    // 7. Validate status transition
    if (updates.status) {
      const transitionValidation = validateStatusTransition(sessionSet.status, updates.status);

      if (!transitionValidation.valid) {
        return errorResponse("Validation Error", "Invalid status transition", 400, [
          {
            field: "status",
            message: transitionValidation.error || "Invalid status transition",
          },
        ]);
      }
    }

    // 8. Validate completed status business rule
    const completedValidation = validateCompletedStatus(updates, sessionSet.actual_reps);

    if (!completedValidation.valid) {
      return errorResponse("Validation Error", "Invalid input data", 400, [
        {
          field: "actual_reps",
          message: completedValidation.error || "Invalid actual_reps value",
        },
      ]);
    }

    // 9. Update session set
    const updatedSessionSet = await service.updateSessionSet(sessionSetId, updates);

    // 10. Return success response
    return jsonResponse(updatedSessionSet, 200);
  } catch (error: unknown) {
    // Handle unexpected errors (500)
    logApiError(`PATCH /api/v1/session-sets/${context.params.id}`, userId || undefined, error, "error");

    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}
