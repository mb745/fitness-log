import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { ExerciseService } from "../../../../lib/services/exercise.service";
import { exerciseIdSchema } from "../../../../lib/validation/exercise.validation";
import { errorResponse, handleZodError, jsonResponse, logApiError } from "../../../../lib/api-helpers";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/v1/exercises/:id
 *
 * Retrieves detailed information about a specific exercise by its ID.
 *
 * URL Parameters:
 * - id (integer, required): Exercise ID
 *
 * @returns 200 OK with ExerciseDTO
 * @returns 400 Bad Request if ID is invalid
 * @returns 404 Not Found if exercise doesn't exist
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Extract and parse ID from URL params
    const idParam = context.params.id;

    // Guard: missing ID parameter
    if (!idParam) {
      return errorResponse("Bad Request", "Exercise ID is required", 400);
    }

    // Parse ID to number
    const parsedId = Number(idParam);

    // Validate ID with Zod schema
    const { id } = exerciseIdSchema.parse({ id: parsedId });

    // Initialize service
    const exerciseService = new ExerciseService(context.locals.supabase);

    // Fetch exercise by ID
    const exercise = await exerciseService.getExerciseById(id);

    // Guard: exercise not found
    if (!exercise) {
      // Log for debugging
      // eslint-disable-next-line no-console
      console.info("[ExercisesAPI] Exercise not found:", {
        endpoint: "GET /api/v1/exercises/:id",
        exerciseId: id,
      });

      return errorResponse("Not Found", "Exercise not found", 404);
    }

    return jsonResponse(exercise, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logApiError("GET /api/v1/exercises/:id", undefined, error, "warn");
      return handleZodError(error);
    }

    // Log and return generic error for unexpected issues
    logApiError("GET /api/v1/exercises/:id", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
