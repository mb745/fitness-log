import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { MuscleGroupsService } from "../../../../../lib/services/muscle-groups.service";
import { muscleGroupIdParamSchema } from "../../../../../lib/validation/muscle-groups.validation";
import { errorResponse, handleZodError, jsonResponse, logApiError } from "../../../../../lib/api-helpers";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/v1/muscle-groups/:id/subgroups
 *
 * Retrieves all subgroups for a specific muscle group.
 * This is a public endpoint providing reference data for exercise categorization.
 *
 * Path Parameters:
 * - id (integer, required): The ID of the muscle group
 *
 * @returns 200 OK with array of MuscleSubgroupDTO
 * @returns 400 Bad Request on validation errors
 * @returns 404 Not Found if muscle group doesn't exist
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Parse and validate path parameter
    const params = muscleGroupIdParamSchema.parse({
      id: context.params.id,
    });

    // Initialize service
    const muscleGroupsService = new MuscleGroupsService(context.locals.supabase);

    // Check if muscle group exists
    const muscleGroup = await muscleGroupsService.getMuscleGroupById(params.id);
    if (!muscleGroup) {
      return errorResponse("Not Found", "Muscle group not found", 404);
    }

    // Fetch subgroups for the muscle group
    const subgroups = await muscleGroupsService.getSubgroupsByMuscleGroupId(params.id);

    return jsonResponse(subgroups, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logApiError("GET /api/v1/muscle-groups/:id/subgroups", undefined, error, "warn");
      return handleZodError(error);
    }

    // Log and return generic error for unexpected issues
    logApiError("GET /api/v1/muscle-groups/:id/subgroups", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
