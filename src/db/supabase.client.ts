import { createClient } from "@supabase/supabase-js";

// Import the generated Database types
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate environment variables early to avoid runtime surprises
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
