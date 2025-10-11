import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  checkAuth,
  errorResponse,
  handleZodError,
  jsonResponse,
  logApiError,
  parseRequestBody,
} from "../../../../lib/api-helpers";
import { WorkoutPlanService } from "../../../../lib/services/workout-plan.service";
import {
  workoutPlanCreateSchema,
  workoutPlansListQuerySchema,
} from "../../../../lib/validation/workout-plan.validation";
import type { WorkoutPlanCreateCommand } from "../../../../types";

export const prerender = false;

/**
 * GET /api/v1/workout-plans
 * Lists all workout plans for the authenticated user with pagination and filtering.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const userId = await checkAuth({ request, locals });
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams: Record<string, string> = {};

    // Extract query params manually to handle optional params
    for (const [key, value] of url.searchParams.entries()) {
      rawParams[key] = value;
    }

    let queryParams;
    try {
      queryParams = workoutPlansListQuerySchema.parse(rawParams);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }
      throw error;
    }

    // Initialize service and fetch plans
    const service = new WorkoutPlanService(locals.supabase);
    const result = await service.listPlans(userId, queryParams);

    return jsonResponse(result, 200);
  } catch (error) {
    logApiError("GET /api/v1/workout-plans", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * POST /api/v1/workout-plans
 * Creates a new workout plan with exercises for the authenticated user.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const userId = await checkAuth({ request, locals });
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse request body
    const body = await parseRequestBody<WorkoutPlanCreateCommand>(request);
    if (!body) {
      return errorResponse("Bad Request", "Invalid or missing request body", 400);
    }

    // Validate request body
    let validatedData: WorkoutPlanCreateCommand;
    try {
      validatedData = workoutPlanCreateSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        logApiError("POST /api/v1/workout-plans", userId, error, "warn");
        return handleZodError(error);
      }
      throw error;
    }

    // Create workout plan
    const service = new WorkoutPlanService(locals.supabase);
    const plan = await service.createPlan(userId, validatedData);

    return jsonResponse(plan, 201);
  } catch (error) {
    const userId = await checkAuth({ request, locals });

    // Handle specific business errors
    if (error instanceof Error) {
      if (error.message === "One or more exercise IDs do not exist") {
        logApiError("POST /api/v1/workout-plans", userId || undefined, error, "warn");
        return errorResponse("Conflict", error.message, 409);
      }
    }

    logApiError("POST /api/v1/workout-plans", userId || undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
