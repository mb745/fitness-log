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
import { planExercisePatchSchema } from "../../../../../../lib/validation/workout-plan.validation";
import type { PlanExercisePatchCommand } from "../../../../../../types";

export const prerender = false;

/**
 * PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId
 * Updates a single exercise in a workout plan.
 * Allows partial updates to exercise parameters (sets, reps, rest, notes, order).
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate plan ID and exercise ID
    let planExerciseId: number;
    try {
      parseIntParam(context.params.id, "id");
      planExerciseId = parseIntParam(context.params.planExerciseId, "planExerciseId");
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse("Bad Request", error.message, 400);
      }
      throw error;
    }

    // Parse request body
    const body = await parseRequestBody<PlanExercisePatchCommand>(context.request);
    if (!body) {
      return errorResponse("Bad Request", "Invalid or missing request body", 400);
    }

    // Guard: empty body
    if (Object.keys(body).length === 0) {
      return errorResponse("Bad Request", "Request body must contain at least one field to update", 400);
    }

    // Validate request body
    let validatedData: PlanExercisePatchCommand;
    try {
      validatedData = planExercisePatchSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        logApiError("PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId", userId, error, "warn");
        return handleZodError(error);
      }
      throw error;
    }

    // Update the exercise
    const service = new WorkoutPlanService(context.locals.supabase);
    const updatedExercise = await service.updateExercise(planExerciseId, userId, validatedData);

    if (!updatedExercise) {
      return errorResponse("Not Found", "Exercise not found in this workout plan", 404);
    }

    return jsonResponse(updatedExercise, 200);
  } catch (error) {
    const userId = await checkAuth(context);
    logApiError("PATCH /api/v1/workout-plans/:id/exercises/:planExerciseId", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId
 * Deletes a single exercise from a workout plan.
 * Prevents deletion if it's the last exercise in the plan.
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate plan ID and exercise ID
    let planId: number;
    let planExerciseId: number;
    try {
      planId = parseIntParam(context.params.id, "id");
      planExerciseId = parseIntParam(context.params.planExerciseId, "planExerciseId");
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse("Bad Request", error.message, 400);
      }
      throw error;
    }

    // Delete the exercise
    const service = new WorkoutPlanService(context.locals.supabase);
    const deleted = await service.deleteExercise(planExerciseId, planId, userId);

    if (!deleted) {
      return errorResponse("Not Found", "Exercise not found in this workout plan", 404);
    }

    // Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    const userId = await checkAuth(context);

    // Handle specific business errors
    if (error instanceof Error) {
      if (
        error.message === "Cannot delete the last exercise from a workout plan. A plan must have at least one exercise."
      ) {
        logApiError("DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId", userId || undefined, error, "warn");
        return errorResponse("Bad Request", error.message, 400);
      }

      if (error.message === "Cannot delete exercise that has been used in workout sessions") {
        logApiError("DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId", userId || undefined, error, "warn");
        return errorResponse("Conflict", error.message, 409);
      }
    }

    logApiError("DELETE /api/v1/workout-plans/:id/exercises/:planExerciseId", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
