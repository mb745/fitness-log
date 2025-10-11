import type { APIContext } from "astro";
import { WorkoutSessionService } from "../../../../lib/services/workout-session.service";
import { sessionUpdateSchema } from "../../../../lib/validation/workout-session.validation";
import {
  checkAuth,
  jsonResponse,
  errorResponse,
  logApiError,
  parseIntParam,
  parseRequestBody,
  handleZodError,
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
} from "../../../../lib/api-helpers";

export const prerender = false;

/**
 * GET /api/v1/workout-sessions/:id
 * Get detailed information about a specific workout session including all sets.
 *
 * Path parameters:
 * - id: Workout session ID (integer)
 *
 * Returns: 200 with workout session details and embedded sets
 * Errors: 400 (invalid ID), 401 (unauthorized), 404 (not found), 500 (server error)
 */
export async function GET(context: APIContext): Promise<Response> {
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

    // Call service to get session details
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.getSessionById(sessionId, userId);

    return jsonResponse(result, 200);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }

    logApiError(`GET /api/v1/workout-sessions/${context.params.id}`, userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}

/**
 * PATCH /api/v1/workout-sessions/:id
 * Update an existing workout session (partial update).
 *
 * Path parameters:
 * - id: Workout session ID (integer)
 *
 * Request body (all fields optional, at least one required):
 * - status: Session status (scheduled, in_progress, completed, abandoned)
 * - scheduled_for: Date for the session (ISO date string YYYY-MM-DD)
 * - notes: Notes for the session
 *
 * Returns: 200 with updated workout session
 * Errors: 400 (validation, empty body), 401 (unauthorized), 404 (not found), 500 (server error)
 */
export async function PATCH(context: APIContext): Promise<Response> {
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

    // Parse request body
    const body = await parseRequestBody(context.request);
    if (!body) {
      return errorResponse("Bad Request", "Request body is required", 400);
    }

    // Check if body is empty (no fields provided)
    if (Object.keys(body).length === 0) {
      return errorResponse("Bad Request", "Request body must contain at least one field to update", 400);
    }

    // Validate request body with Zod
    const validationResult = sessionUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Call service to update session
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.updateSession(sessionId, userId, validationResult.data);

    return jsonResponse(result, 200);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }
    if (error instanceof BadRequestError) {
      return errorResponse("Bad Request", error.message, 400);
    }

    logApiError(`PATCH /api/v1/workout-sessions/${context.params.id}`, userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}

/**
 * DELETE /api/v1/workout-sessions/:id
 * Delete a workout session. Only sessions with 'scheduled' status can be deleted.
 *
 * Path parameters:
 * - id: Workout session ID (integer)
 *
 * Returns: 204 No Content
 * Errors: 400 (invalid ID), 401 (unauthorized), 404 (not found), 422 (already started), 500 (server error)
 */
export async function DELETE(context: APIContext): Promise<Response> {
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

    // Call service to delete session
    const service = new WorkoutSessionService(context.locals.supabase);
    await service.deleteSession(sessionId, userId);

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }
    if (error instanceof UnprocessableEntityError) {
      return errorResponse("Unprocessable Entity", error.message, 422);
    }

    logApiError(`DELETE /api/v1/workout-sessions/${context.params.id}`, userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}
