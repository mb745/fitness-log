import type { APIContext } from "astro";
import { WorkoutSessionService } from "../../../../lib/services/workout-session.service";
import { sessionCreateSchema, sessionQuerySchema } from "../../../../lib/validation/workout-session.validation";
import {
  checkAuth,
  jsonResponse,
  errorResponse,
  handleZodError,
  parsePaginationParams,
  logApiError,
  NotFoundError,
} from "../../../../lib/api-helpers";
import { parseRequestBody } from "../../../../lib/api-helpers";

export const prerender = false;

/**
 * GET /api/v1/workout-sessions
 * List workout sessions for the authenticated user with filtering and pagination.
 *
 * Query parameters:
 * - status: Filter by session status (scheduled, in_progress, completed, abandoned)
 * - from: Filter by date range start (ISO date string YYYY-MM-DD)
 * - to: Filter by date range end (ISO date string YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 20, max: 100)
 * - sort: Sort field (e.g., "scheduled_for", "-scheduled_for" for descending)
 *
 * Returns: 200 with paginated list of workout sessions
 * Errors: 400 (validation), 401 (unauthorized), 500 (server error)
 */
export async function GET(context: APIContext): Promise<Response> {
  let userId: string | null = null;

  try {
    // Check authentication
    userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse pagination parameters
    const params = context.url.searchParams;
    const { page, pageSize } = parsePaginationParams(params);

    // Build query params object for validation
    const queryParams = {
      status: params.get("status") || undefined,
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      workout_plan_id: params.get("workout_plan_id") ? Number(params.get("workout_plan_id")) : undefined,
      page,
      page_size: pageSize,
      sort: params.get("sort") || undefined,
    };

    // Validate query parameters with Zod
    const validationResult = sessionQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Call service to list sessions
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.listSessions(userId, validationResult.data);

    return jsonResponse(result, 200);
  } catch (error) {
    logApiError("GET /api/v1/workout-sessions", userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}

/**
 * POST /api/v1/workout-sessions
 * Create a new workout session for the authenticated user.
 *
 * Request body:
 * - workout_plan_id: ID of the workout plan to create session from (required)
 * - scheduled_for: Date for the session (ISO date string YYYY-MM-DD, required)
 * - notes: Optional notes for the session
 *
 * Returns: 201 with created workout session
 * Errors: 400 (validation), 401 (unauthorized), 404 (plan not found), 500 (server error)
 */
export async function POST(context: APIContext): Promise<Response> {
  let userId: string | null = null;

  try {
    // Check authentication
    userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse request body
    const body = await parseRequestBody(context.request);
    if (!body) {
      return errorResponse("Bad Request", "Request body is required", 400);
    }

    // Validate request body with Zod
    const validationResult = sessionCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Call service to create session
    const service = new WorkoutSessionService(context.locals.supabase);
    const result = await service.createSession(userId, validationResult.data);

    return jsonResponse(result, 201);
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("Not Found", error.message, 404);
    }

    logApiError("POST /api/v1/workout-sessions", userId || undefined, error, "error");
    return errorResponse("Internal Server Error", "An unexpected error occurred. Please try again later.", 500);
  }
}
