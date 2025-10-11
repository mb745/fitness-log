import type { APIContext } from "astro";
import { WorkoutSessionService } from "../../../../../lib/services/workout-session.service";
import {
  checkAuth,
  jsonResponse,
  errorResponse,
  logApiError,
  parseIntParam,
  NotFoundError,
  BadRequestError,
} from "../../../../../lib/api-helpers";

export const prerender = false;

/**
 * POST /api/v1/workout-sessions/:id/abandon
 * Abandon a workout session (workflow action).
 * Changes status from 'in_progress' to 'abandoned'.
 * Database trigger will set completed_at to NOW().
 *
 * Path parameters:
 * - id: Workout session ID (integer)
 *
 * Request body: Empty or {}
 *
 * Returns: 200 with updated workout session
 * Errors: 400 (invalid status), 401 (unauthorized), 404 (not found), 500 (server error)
 */
export async function POST(context: APIContext): Promise<Response> {
  let userId: string | null = null;

  try {
    // Check authentication
    userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate session ID from path params
    let sessionId: number;
    try {
      sessionId = parseIntParam(context.params.id, "session ID");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid session ID";
      return errorResponse("Bad Request", message, 400);
    }

    // Call service to abandon session
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.abandonSession(sessionId, userId);

    return jsonResponse(result, 200);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }
    if (error instanceof BadRequestError) {
      return errorResponse("Bad Request", error.message, 400);
    }

    logApiError(`POST /api/v1/workout-sessions/${context.params.id}/abandon`, userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}
