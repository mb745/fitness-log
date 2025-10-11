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
} from "../../../../../../lib/api-helpers";
import { WorkoutPlanService } from "../../../../../../lib/services/workout-plan.service";
import { planExercisesBulkReplaceSchema } from "../../../../../../lib/validation/workout-plan.validation";
import type { PlanExercisesBulkReplaceCommand } from "../../../../../../types";

export const prerender = false;

/**
 * POST /api/v1/workout-plans/:id/exercises
 * Replaces all exercises in a workout plan with a new list.
 * Deletes existing exercises and inserts new ones in a single operation.
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

    // Parse request body
    const body = await parseRequestBody<PlanExercisesBulkReplaceCommand>(request);
    if (!body) {
      return errorResponse("Bad Request", "Invalid or missing request body", 400);
    }

    // Validate request body
    let validatedData: PlanExercisesBulkReplaceCommand;
    try {
      validatedData = planExercisesBulkReplaceSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        logApiError("POST /api/v1/workout-plans/:id/exercises", userId, error, "warn");
        return handleZodError(error);
      }
      throw error;
    }

    // Verify plan exists and belongs to user, then replace exercises
    const service = new WorkoutPlanService(locals.supabase);
    const updatedPlan = await service.replaceExercises(planId, userId, validatedData.exercises);

    if (!updatedPlan) {
      // Check if plan exists but belongs to another user
      const anyPlan = await service.verifyPlanOwnership(planId, "00000000-0000-0000-0000-000000000000");
      if (anyPlan) {
        logApiError(
          "POST /api/v1/workout-plans/:id/exercises",
          userId,
          new Error(`Unauthorized access attempt to plan ${planId}`),
          "warn"
        );
        return errorResponse("Forbidden", "You do not have permission to modify this workout plan", 403);
      }

      return errorResponse("Not Found", "Workout plan not found", 404);
    }

    return jsonResponse(updatedPlan, 200);
  } catch (error) {
    const userId = await checkAuth({ request, locals });

    // Handle specific business errors
    if (error instanceof Error) {
      if (error.message === "One or more exercise IDs do not exist") {
        logApiError("POST /api/v1/workout-plans/:id/exercises", userId || undefined, error, "warn");
        return errorResponse("Conflict", error.message, 409);
      }
    }

    logApiError("POST /api/v1/workout-plans/:id/exercises", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
