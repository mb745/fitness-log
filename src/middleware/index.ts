import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Make Supabase available on the locals object for downstream handlers
  context.locals.supabase = supabaseClient;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const pathname = context.url.pathname;

  if (session && ["/login", "/register"].includes(pathname)) {
    return context.redirect("/dashboard");
  }
  return next();
});
