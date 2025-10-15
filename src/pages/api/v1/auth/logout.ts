import type { APIRoute } from "astro";
import { errorResponse, jsonResponse, logApiError } from "@/lib/api-helpers";

/**
 * POST /api/v1/auth/logout
 *
 * Logs out the current user by invalidating their Supabase session.
 * This endpoint is idempotent - calling it multiple times has the same effect.
 *
 * @returns 200 OK with success message
 * @returns 500 Internal Server Error if sign out fails
 */
export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Attempt to sign out - this is idempotent and safe even without active session
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      logApiError("POST /api/v1/auth/logout", locals.user?.id, error);
      return errorResponse("Logout Failed", "Nie udało się wylogować", 500);
    }

    return jsonResponse({ message: "Wylogowano pomyślnie" }, 200);
  } catch (error) {
    logApiError("POST /api/v1/auth/logout", locals.user?.id, error);
    return errorResponse("Internal Server Error", "Błąd serwera podczas wylogowania", 500);
  }
};
