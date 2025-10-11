import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { ExerciseService } from "../../../../lib/services/exercise.service";
import { exercisesQuerySchema } from "../../../../lib/validation/exercise.validation";
import {
  errorResponse,
  handleZodError,
  jsonResponse,
  logApiError,
  parseQueryParams,
} from "../../../../lib/api-helpers";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/v1/exercises
 *
 * Retrieves a paginated list of exercises from the global library.
 * Supports filtering, search, sorting, and pagination.
 *
 * Query Parameters:
 * - q (string, optional): Full-text search by exercise name
 * - muscle_group_id (integer, optional): Filter by muscle group
 * - muscle_subgroup_id (integer, optional): Filter by muscle subgroup
 * - type (string, optional): Filter by exercise type ("compound" or "isolation")
 * - is_active (boolean, optional): Filter by active status (default: true)
 * - page (integer, optional): Page number (default: 1)
 * - page_size (integer, optional): Items per page (default: 20, max: 100)
 * - sort (string, optional): Sort field (e.g., "name", "-created_at")
 *
 * @returns 200 OK with ExercisesListResponse (paginated)
 * @returns 400 Bad Request on validation errors
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Parse and validate query parameters
    const queryParams = parseQueryParams(context.url, exercisesQuerySchema);

    // Initialize service
    const exerciseService = new ExerciseService(context.locals.supabase);

    // Fetch exercises with filters and pagination
    const result = await exerciseService.listExercises(queryParams);

    return jsonResponse(result, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logApiError("GET /api/v1/exercises", undefined, error, "warn");
      return handleZodError(error);
    }

    // Log and return generic error for unexpected issues
    logApiError("GET /api/v1/exercises", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
