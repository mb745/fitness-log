import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

// Import the generated Database types
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate environment variables early to avoid runtime surprises
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use throughout the application
export type SupabaseClient = SupabaseClientBase<Database>;

export const DEFAULT_USER_ID = "e40b9a49-73ab-459e-9d7e-d9fe9e4e4f0a";
