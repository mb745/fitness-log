import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Make Supabase available on the locals object for downstream handlers
  context.locals.supabase = supabaseClient;
  return next();
});
