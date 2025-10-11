import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  checkAuth,
  errorResponse,
  handleZodError,
  jsonResponse,
  logApiError,
  parseIntParam,
  parseRequestBody,
} from "../../../../lib/api-helpers";
import { WorkoutPlanService } from "../../../../lib/services/workout-plan.service";
import { workoutPlanUpdateSchema } from "../../../../lib/validation/workout-plan.validation";
import type { WorkoutPlanUpdateCommand } from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/workout-plans/:id
 * Retrieves a specific workout plan with all its exercises.
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
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

    // Get workout plan
    const service = new WorkoutPlanService(locals.supabase);
    const plan = await service.getPlanById(planId, userId);

    if (!plan) {
      // Check if plan exists but belongs to another user (403) vs doesn't exist (404)
      const anyPlan = await service.verifyPlanOwnership(planId, "00000000-0000-0000-0000-000000000000");
      if (anyPlan) {
        logApiError(
          "GET /api/v1/workout-plans/:id",
          userId,
          new Error(`Unauthorized access attempt to plan ${planId}`),
          "warn"
        );
        return errorResponse("Forbidden", "You do not have permission to access this workout plan", 403);
      }

      return errorResponse("Not Found", "Workout plan not found", 404);
    }

    return jsonResponse(plan, 200);
  } catch (error) {
    const userId = await checkAuth({ request, locals });
    logApiError("GET /api/v1/workout-plans/:id", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * PATCH /api/v1/workout-plans/:id
 * Updates a workout plan's properties (name, schedule, active status).
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Parse request body
    const body = await parseRequestBody<WorkoutPlanUpdateCommand>(request);
    if (!body) {
      return errorResponse("Bad Request", "Invalid or missing request body", 400);
    }

    // Guard: empty body
    if (Object.keys(body).length === 0) {
      return errorResponse("Bad Request", "Request body must contain at least one field to update", 400);
    }

    // Validate request body
    let validatedData: WorkoutPlanUpdateCommand;
    try {
      validatedData = workoutPlanUpdateSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        logApiError("PATCH /api/v1/workout-plans/:id", userId, error, "warn");
        return handleZodError(error);
      }
      throw error;
    }

    // Update workout plan
    const service = new WorkoutPlanService(locals.supabase);
    const updatedPlan = await service.updatePlan(planId, userId, validatedData);

    if (!updatedPlan) {
      // Check if plan exists but belongs to another user
      const anyPlan = await service.verifyPlanOwnership(planId, "00000000-0000-0000-0000-000000000000");
      if (anyPlan) {
        logApiError(
          "PATCH /api/v1/workout-plans/:id",
          userId,
          new Error(`Unauthorized update attempt to plan ${planId}`),
          "warn"
        );
        return errorResponse("Forbidden", "You do not have permission to modify this workout plan", 403);
      }

      return errorResponse("Not Found", "Workout plan not found", 404);
    }

    return jsonResponse(updatedPlan, 200);
  } catch (error) {
    const userId = await checkAuth({ request, locals });
    logApiError("PATCH /api/v1/workout-plans/:id", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * DELETE /api/v1/workout-plans/:id
 * Deletes a workout plan and all its exercises.
 */
export const DELETE: APIRoute = async ({ params, request, locals }) => {
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

    // Delete workout plan
    const service = new WorkoutPlanService(locals.supabase);
    const deleted = await service.deletePlan(planId, userId);

    if (!deleted) {
      return errorResponse("Not Found", "Workout plan not found", 404);
    }

    // Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    const userId = await checkAuth({ request, locals });

    // Handle specific business errors
    if (error instanceof Error) {
      if (error.message === "Cannot delete workout plan that has been used in workout sessions") {
        logApiError("DELETE /api/v1/workout-plans/:id", userId || undefined, error, "warn");
        return errorResponse("Conflict", error.message, 409);
      }
    }

    logApiError("DELETE /api/v1/workout-plans/:id", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
