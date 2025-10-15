import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Skip middleware entirely for static assets
  if (pathname.startsWith("/_astro/") || pathname === "/favicon.svg") {
    return next();
  }

  // Create SSR Supabase instance with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Make Supabase client available in context.locals
  context.locals.supabase = supabase;

  // Get current session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in context.locals for downstream handlers
  if (user) {
    context.locals.user = {
      id: user.id,
      email: user.email,
    };
  } else {
    context.locals.user = null;
  }

  // Skip auth redirects for API endpoints (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Redirect logged-in users away from auth pages
  if (user && ["/login", "/register"].includes(pathname)) {
    return context.redirect("/dashboard");
  }

  // Redirect non-authenticated users from protected pages
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return context.redirect("/login");
  }

  return next();
});
