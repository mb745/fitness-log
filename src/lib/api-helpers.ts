import type { APIContext } from "astro";
import { ZodError, type ZodSchema } from "zod";

/**
 * Standard error response format for API endpoints.
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: {
    field: string;
    message: string;
  }[];
}

/**
 * Sort parameter parsed from query string.
 */
export interface SortParam {
  column: string;
  ascending: boolean;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  last_page: number;
}

/**
 * Checks if the user is authenticated and returns their user ID.
 *
 * This function verifies the user's session via Supabase Auth and returns
 * the authenticated user's ID. It's used in API endpoints to protect resources.
 *
 * @param context - Partial Astro API context with request and locals
 * @returns User ID if authenticated, null otherwise
 */
export async function checkAuth(context: Pick<APIContext, "request" | "locals">): Promise<string | null> {
  // Check if user is set in context.locals (set by middleware)
  if (context.locals.user) {
    return context.locals.user.id;
  }

  // Fallback: verify session directly with Supabase
  const {
    data: { user },
  } = await context.locals.supabase.auth.getUser();

  return user?.id || null;
}

/**
 * Creates a standardized JSON response with proper headers.
 *
 * @param data - Data to return in response body
 * @param status - HTTP status code (default: 200)
 * @returns Response object with JSON content type
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a standardized error response.
 *
 * @param error - Error name/type
 * @param message - User-friendly error message
 * @param status - HTTP status code
 * @param details - Optional validation details
 * @returns JSON error response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: ErrorResponse["details"]
): Response {
  const errorBody: ErrorResponse = {
    error,
    message,
    ...(details && { details }),
  };

  return jsonResponse(errorBody, status);
}

/**
 * Handles Zod validation errors and formats them for API response.
 *
 * @param zodError - ZodError from validation
 * @returns Formatted error response with field-level details
 */
export function handleZodError(zodError: ZodError): Response {
  const details = zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return errorResponse("Validation Error", "Invalid input data", 400, details);
}

/**
 * Safely parses JSON from request body.
 *
 * @param request - Request object
 * @returns Parsed JSON data or null if parsing fails
 */
export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Custom error classes for API service layer.
 * These errors are thrown by service methods and caught by endpoint handlers
 * to return appropriate HTTP status codes and error messages.
 */

/**
 * Error thrown when a requested resource is not found.
 * Maps to 404 Not Found response.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when a request conflicts with current state.
 * Maps to 409 Conflict response.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Error thrown when a request is semantically invalid.
 * Maps to 422 Unprocessable Entity response.
 */
export class UnprocessableEntityError extends Error {
  public details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.name = "UnprocessableEntityError";
    this.details = details;
  }
}

/**
 * Error thrown when a request is invalid or malformed.
 * Maps to 400 Bad Request response.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/**
 * Logs API errors with context for debugging.
 *
 * @param endpoint - Endpoint identifier (e.g., "POST /api/v1/profile")
 * @param userId - User ID if available
 * @param error - Error object
 * @param level - Log level: "error", "warn", or "info"
 */
export function logApiError(
  endpoint: string,
  userId: string | undefined,
  error: unknown,
  level: "error" | "warn" | "info" = "error"
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    endpoint,
    userId: userId || "unknown",
    error: errorMessage,
    ...(errorStack && level === "error" && { stack: errorStack }),
  };

  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(`[API] Unexpected error:`, logData);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(`[API] Validation error:`, logData);
  } else {
    // eslint-disable-next-line no-console
    console.info(`[API] Info:`, logData);
  }
}

/**
 * Parses and validates query parameters from URL using a Zod schema.
 *
 * @param url - URL object containing query parameters
 * @param schema - Zod schema for validation
 * @returns Validated and parsed query parameters
 * @throws ZodError if validation fails
 */
export function parseQueryParams<T>(url: URL, schema: ZodSchema<T>): T {
  const params: Record<string, unknown> = {};

  // Convert URLSearchParams to plain object with type coercion
  for (const [key, value] of url.searchParams.entries()) {
    // Try to parse numbers
    if (!isNaN(Number(value)) && value.trim() !== "") {
      params[key] = Number(value);
      continue;
    }

    // Try to parse booleans
    if (value === "true") {
      params[key] = true;
      continue;
    }
    if (value === "false") {
      params[key] = false;
      continue;
    }

    // Keep as string
    params[key] = value;
  }

  // Validate with schema
  return schema.parse(params);
}

/**
 * Parses sort parameter into column name and sort direction.
 * Supports format: "column" or "-column" (with "-" prefix for descending).
 *
 * @param sort - Sort parameter string (e.g., "name", "-created_at")
 * @returns Object with column name and ascending flag
 */
export function parseSortParam(sort: string | undefined): SortParam | null {
  if (!sort) {
    return null;
  }

  const ascending = !sort.startsWith("-");
  const column = ascending ? sort : sort.substring(1);

  return { column, ascending };
}

/**
 * Parses and validates pagination parameters from URL search params.
 * Ensures valid page and page_size values with defaults and limits.
 *
 * @param params - URLSearchParams from the request
 * @returns Parsed pagination parameters with page, pageSize, and offset
 */
export function parsePaginationParams(params: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const DEFAULT_PAGE_SIZE = 20;
  const MAX_PAGE_SIZE = 100;
  const MIN_PAGE_SIZE = 1;

  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const requestedSize = parseInt(params.get("page_size") || String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.min(Math.max(requestedSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Builds pagination metadata for list responses.
 * Calculates the last page number based on total items and page size.
 *
 * @param total - Total number of items
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Pagination metadata object
 */
export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const lastPage = Math.ceil(total / pageSize) || 0;

  return {
    total,
    page,
    page_size: pageSize,
    last_page: lastPage,
  };
}

/**
 * Parses an integer parameter from URL params.
 * Validates that the value is a valid positive integer.
 *
 * @param value - Parameter value from URL
 * @param paramName - Name of the parameter (for error messages)
 * @returns Parsed integer value
 * @throws Error if value is not a valid positive integer
 */
export function parseIntParam(value: string | undefined, paramName: string): number {
  if (!value) {
    throw new Error(`Missing required parameter: ${paramName}`);
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid ${paramName}: must be a positive integer`);
  }

  return parsed;
}
