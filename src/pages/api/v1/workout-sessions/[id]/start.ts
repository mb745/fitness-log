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
  ConflictError,
} from "../../../../../lib/api-helpers";

export const prerender = false;

/**
 * POST /api/v1/workout-sessions/:id/start
 * Start a workout session (workflow action).
 * Changes status from 'scheduled' to 'in_progress'.
 * Database trigger automatically creates session_sets for all plan exercises.
 *
 * Path parameters:
 * - id: Workout session ID (integer)
 *
 * Request body: Empty or {}
 *
 * Returns: 200 with workout session details including created sets
 * Errors: 400 (invalid status), 401 (unauthorized), 404 (not found), 409 (conflict), 500 (server error)
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

    // Call service to start session
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.startSession(sessionId, userId);

    return jsonResponse(result, 200);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }
    if (error instanceof BadRequestError) {
      return errorResponse("Bad Request", error.message, 400);
    }
    if (error instanceof ConflictError) {
      return errorResponse("Conflict", error.message, 409);
    }

    logApiError(`POST /api/v1/workout-sessions/${context.params.id}/start`, userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}
