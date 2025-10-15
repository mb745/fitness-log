import type { AstroCookies } from "astro";
import { type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

// Import the generated Database types
import type { Database } from "./database.types.ts";

function getSupabaseUrl(): string {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = import.meta.env.PUBLIC_SUPABASE_KEY;
  if (!key) {
    throw new Error("Missing PUBLIC_SUPABASE_KEY environment variable");
  }
  return key;
}

// Client-side Supabase client for React components (lazy initialization)
// Uses createBrowserClient to manage session via cookies instead of localStorage
let _supabaseClient: SupabaseClientBase<Database> | null = null;

export const supabaseClient: SupabaseClientBase<Database> = new Proxy({} as SupabaseClientBase<Database>, {
  get(target, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return Reflect.get(_supabaseClient, prop);
  },
});

// Export typed SupabaseClient for use throughout the application
export type SupabaseClient = SupabaseClientBase<Database>;

// Cookie options for SSR (secure, httpOnly)
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // Only secure in production
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parses the Cookie header string into an array of cookie objects.
 * Required by Supabase SSR for reading cookies in server context.
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server instance for SSR with proper cookie handling.
 * Use this in Astro pages, API endpoints, and middleware for server-side operations.
 *
 * @param context - Object containing headers and cookies from Astro context
 * @returns Supabase client configured for SSR
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export const DEFAULT_USER_ID = "e40b9a49-73ab-459e-9d7e-d9fe9e4e4f0a";
