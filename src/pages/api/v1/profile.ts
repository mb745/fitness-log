import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { ProfileService } from "../../../lib/services/profile.service";
import { profileCreateSchema, profileUpdateSchema } from "../../../lib/validation/profile.validation";
import {
  checkAuth,
  errorResponse,
  handleZodError,
  jsonResponse,
  logApiError,
  parseRequestBody,
} from "../../../lib/api-helpers";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/v1/profile
 *
 * Retrieves the profile of the currently authenticated user.
 *
 * @returns 200 OK with ProfileDTO
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if profile doesn't exist
 * @returns 500 Internal Server Error on unexpected errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Initialize service
    const profileService = new ProfileService(context.locals.supabase);

    // Fetch profile
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return errorResponse("Not Found", "Profile not found", 404);
    }

    return jsonResponse(profile, 200);
  } catch (error) {
    logApiError("GET /api/v1/profile", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * POST /api/v1/profile
 *
 * Creates a new profile for the authenticated user.
 * All fields are optional - a profile can be created empty.
 *
 * @returns 201 Created with ProfileDTO
 * @returns 400 Bad Request on validation errors
 * @returns 401 Unauthorized if not authenticated
 * @returns 409 Conflict if profile already exists
 * @returns 500 Internal Server Error on unexpected errors
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse and validate request body
    const body = await parseRequestBody(context.request);

    // Handle empty body (valid case - profile can be empty)
    const dataToValidate = body || {};

    const validatedData = profileCreateSchema.parse(dataToValidate);

    // Initialize service
    const profileService = new ProfileService(context.locals.supabase);

    // Create profile
    const profile = await profileService.createProfile(userId, validatedData);

    return jsonResponse(profile, 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logApiError("POST /api/v1/profile", undefined, error, "warn");
      return handleZodError(error);
    }

    // Handle profile already exists
    if (error instanceof Error && error.message === "Profile already exists") {
      return errorResponse("Conflict", "Profile already exists", 409);
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return errorResponse("Bad Request", "Invalid JSON in request body", 400);
    }

    // Log and return generic error for unexpected issues
    logApiError("POST /api/v1/profile", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};

/**
 * PATCH /api/v1/profile
 *
 * Updates the profile of the authenticated user with partial data.
 * Only provided fields will be updated.
 *
 * @returns 200 OK with updated ProfileDTO
 * @returns 400 Bad Request on validation errors or empty body
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if profile doesn't exist
 * @returns 500 Internal Server Error on unexpected errors
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Check authentication
    const userId = await checkAuth(context);
    if (!userId) {
      return errorResponse("Unauthorized", "Authentication required", 401);
    }

    // Parse request body
    const body = await parseRequestBody(context.request);

    // Guard: empty body
    if (!body || Object.keys(body).length === 0) {
      return errorResponse("Bad Request", "Request body must contain at least one field to update", 400);
    }

    // Validate request body (partial validation)
    const validatedData = profileUpdateSchema.parse(body);

    // Initialize service
    const profileService = new ProfileService(context.locals.supabase);

    // Update profile
    const profile = await profileService.updateProfile(userId, validatedData);

    if (!profile) {
      return errorResponse("Not Found", "Profile not found", 404);
    }

    return jsonResponse(profile, 200);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logApiError("PATCH /api/v1/profile", undefined, error, "warn");
      return handleZodError(error);
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return errorResponse("Bad Request", "Invalid JSON in request body", 400);
    }

    // Log and return generic error for unexpected issues
    logApiError("PATCH /api/v1/profile", undefined, error);
    return errorResponse("Internal Server Error", "An unexpected error occurred", 500);
  }
};
