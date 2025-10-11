import type { APIRoute } from "astro";
import { checkAuth, errorResponse, jsonResponse, logApiError, parseIntParam } from "../../../../../lib/api-helpers";
import { WorkoutPlanService } from "../../../../../lib/services/workout-plan.service";

export const prerender = false;

/**
 * POST /api/v1/workout-plans/:id/activate
 * Activates a workout plan and deactivates all other plans for the user.
 * Ensures only one plan is active at a time.
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    const userId = await checkAuth({ request, locals });
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate plan ID
    let planId: number;
    try {
      planId = parseIntParam(params.id, "id");
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse("Bad Request", error.message, 400);
      }
      throw error;
    }

    // Activate the workout plan
    const service = new WorkoutPlanService(locals.supabase);
    const activatedPlan = await service.activatePlan(planId, userId);

    if (!activatedPlan) {
      return errorResponse("Not Found", "Workout plan not found", 404);
    }

    return jsonResponse(activatedPlan, 200);
  } catch (error) {
    const userId = await checkAuth({ request, locals });
    logApiError("POST /api/v1/workout-plans/:id/activate", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
