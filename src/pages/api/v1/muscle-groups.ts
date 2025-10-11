import type { APIRoute } from "astro";

import { MuscleGroupsService } from "../../../lib/services/muscle-groups.service";
import { errorResponse, jsonResponse, logApiError } from "../../../lib/api-helpers";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/v1/muscle-groups
 *
 * Retrieves a complete list of all muscle groups.
 * This is a public endpoint providing reference data for exercise categorization.
 *
 * @returns 200 OK with array of MuscleGroupDTO
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Initialize service
    const muscleGroupsService = new MuscleGroupsService(context.locals.supabase);

    // Fetch all muscle groups
    const muscleGroups = await muscleGroupsService.getAllMuscleGroups();

    return jsonResponse(muscleGroups, 200);
  } catch (error) {
    // Log and return generic error for unexpected issues
    logApiError("GET /api/v1/muscle-groups", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
