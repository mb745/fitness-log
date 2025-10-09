-- migration: enable_extensions
-- purpose: enable required postgresql extensions for the fitness log application
-- affected: database extensions
-- considerations: pg_trgm is required for full-text search on exercise names

-- enable uuid extension (already available in supabase by default)
create extension if not exists "uuid-ossp";

-- enable trigram extension for full-text search functionality
-- this is required for efficient name-based searching of exercises
create extension if not exists pg_trgm;

-- note: pg_cron extension is available in supabase but requires project settings configuration
-- it can be enabled later for automated cleanup tasks