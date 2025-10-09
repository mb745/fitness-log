# REST API Plan

## 1. Resources

| Resource | DB Table | Description |
|----------|----------|-------------|
| Auth | auth.users | Supabase-managed authentication accounts |
| Profile | users | Extended user profile (weight, height, etc.) |
| Muscle Groups | muscle_groups | Dictionary of major muscle groups |
| Muscle Sub-groups | muscle_subgroups | Dictionary of sub-groups belonging to a muscle group |
| Exercises | exercises | Global exercise library |
| Workout Plans | workout_plans | User-defined workout programmes |
| Plan Exercises | plan_exercises | Exercises attached to a workout plan |
| Workout Sessions | workout_sessions | Concrete scheduled / in-progress / finished workouts |
| Session Sets | session_sets | Per-set log created when a session starts |

## 2. End-points

Naming convention: plural kebab-case, versioned under `/api/v1`. All responses are JSON; timestamps are ISO-8601 strings in UTC.

### 2.1 Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/profile | Retrieve authenticated user profile |
| POST | /api/v1/profile | Create profile immediately after registration |
| PATCH | /api/v1/profile | Update weight, height, gender, injuries, etc. |

Validation:
* `weight_kg` 0 < value ≤ 500
* `height_cm` 100 ≤ value ≤ 250

### 2.2 Muscle Dictionaries (public read-only)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/muscle-groups | List all muscle groups |
| GET | /api/v1/muscle-groups/:id/subgroups | List sub-groups for group |
| GET | /api/v1/muscle-subgroups | List all muscle sub-groups |

Filtering: none required (small static dictionaries).

### 2.3 Exercises

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/exercises | Search & filter exercises |
| GET | /api/v1/exercises/:id | Get exercise detail |

Query-string parameters:
* `q` – full-text search by `name` (trigram index)
* `muscle_group_id`, `muscle_subgroup_id`
* `type` – `compound` \| `isolation`
* `is_active` – bool
* Pagination: `page` (default 1), `page_size` (default 20, max 100)
* Sorting: `sort` (e.g. `name`, `-created_at`)

### 2.4 Workout Plans

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/workout-plans | List user plans (filter `is_active`) |
| POST | /api/v1/workout-plans | Create plan |
| GET | /api/v1/workout-plans/:id | Plan detail + embedded exercises |
| PATCH | /api/v1/workout-plans/:id | Update name, schedule, active flag |
| DELETE | /api/v1/workout-plans/:id | Delete plan |
| POST | /api/v1/workout-plans/:id/activate | Mark plan as active (sets is_active=true, deactivates others) |

Request body (create):
```json
{
  "name": "Push/Pull/Legs",
  "schedule_type": "weekly",          // "weekly" | "interval"
  "schedule_days": [1,3,5],            // when schedule_type = weekly
  "schedule_interval_days": null,      // when schedule_type = interval
  "exercises": [
    {
      "exercise_id": 42,
      "order_index": 0,
      "target_sets": 4,
      "target_reps": 8,
      "target_weight": 20,
      "rest_seconds": 120,
      "notes": "Pause reps"
    }
  ]
}
```
Validation mirrors DB CHECK constraints.

#### 2.4.1 Plan Exercises sub-resource

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/workout-plans/:id/exercises | Bulk replace exercises list |
| PATCH | /api/v1/workout-plans/:id/exercises/:planExerciseId | Partial update (sets, reps, rest, notes, order) |
| DELETE | /api/v1/workout-plans/:id/exercises/:planExerciseId | Remove exercise from plan |

### 2.5 Workout Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/workout-sessions | List user sessions (filter by status, date range) |
| POST | /api/v1/workout-sessions | Manually schedule future session (optional) |
| GET | /api/v1/workout-sessions/:id | Session detail inc. sets |
| PATCH | /api/v1/workout-sessions/:id | Update `status`, `scheduled_for`, `notes` |
| DELETE | /api/v1/workout-sessions/:id | Cancel (hard delete) prior to start |

##### Workflow helpers

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/workout-sessions/:id/start | Transition to `in_progress`. Trigger creation of `session_sets`. Returns full session with sets. |
| POST | /api/v1/workout-sessions/:id/complete | Transition to `completed` (validates all sets done). |
| POST | /api/v1/workout-sessions/:id/abandon | Transition to `abandoned`. |

### 2.6 Session Sets

| Method | Path | Description |
|--------|------|-------------|
| PATCH | /api/v1/session-sets/:id | Update `actual_reps`, `weight_kg`, `status` (only when parent session `in_progress`) |

Validation:
* `actual_reps` ≥ 0 when provided.
* `status` transitions: `pending→completed | skipped` only.
* Weight ≥ 0.

### 2.7 Analytics & Views (read-only)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/analytics/upcoming-workouts | Data from `upcoming_workouts` view |
| GET | /api/v1/analytics/workout-history | Data from `workout_history` view (pagination) |
| GET | /api/v1/analytics/exercise-progression | Data from `exercise_progression` view (filter by `exercise_id`) |

### 2.8 Misc

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/health | Liveness probe |

## 3. Authentication & Authorisation

* **Mechanism**: Supabase JWT validated by middleware. Astro middleware (`/src/middleware/index.ts`) attaches `ctx.locals.user`.
* **Policies**: Mirrors RLS; server rejects any request whose JWT uid does not match row `user_id` (enforced by Supabase). Additional API-level guard rails:
  * Route lover: only `/muscle-groups`, `/muscle-subgroups`, `/exercises` GET are public.
  * All other routes require Bearer token.
* **Rate limiting**: 60 req/min IP for public routes, 120 req/min authenticated via middleware such as `@fastify/rate-limit` or Cloudflare Turnstile.

## 4. Validation & Business Logic

| Resource | Validation Rules |
|----------|------------------|
| Profile | See §2.2 above; DB constraints `weight_kg>0 AND <=500`, `height_cm 100-250` |
| Workout Plan | Schedule constraint: `(weekly & days not null) XOR (interval & interval_days not null)`; unique `order_index`; required ≥1 exercise |
| Plan Exercise | `target_sets>0`, `target_reps>0`, `rest_seconds≥0` |
| Workout Session | Unique `in_progress` per user enforced by DB; `completed` requires `started_at`+`completed_at`; `scheduled_for` in future on insert |
| Session Set | `set_number>0`; `status` + `actual_reps` checks; weight≥0 |

### Business Processes Implementation

1. **Create Session Sets on session start** – handled by DB trigger; API `POST /workout-sessions/:id/start` only flips status, DB inserts sets atomically.
2. **Auto-timestamps** – handled by `update_updated_at_column` trigger.
3. **Progression Suggestions / Stagnation Alerts** – implemented on client side using analytics endpoints; server only surfaces necessary views.
4. **Activation of single plan** – endpoint `/workout-plans/:id/activate` sets `is_active=true` and `is_active=false` for other plans in single transaction.

## 5. Pagination, Filtering & Sorting

* Pagination: `page`, `page_size` (default 20, max 100). Responses include `total`, `page`, `page_size`, `last_page`.
* Filtering & sorting parameters documented per endpoint; unrecognised parameters ignored.

## 6. Error Handling

| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Validation error | Missing required field |
| 401 | Unauthenticated | Missing / invalid JWT |
| 403 | Forbidden | Accessing other user’s resource |
| 404 | Not found | Resource id does not exist |
| 409 | Conflict | e.g. creating second `in_progress` session |
| 422 | Business rule violated | Status transition invalid |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unhandled server error |

## 7. Security Considerations

* HTTPS only; HSTS.
* JWT bearer auth; refresh rotation.
* Content-Security-Policy restricting origins.
* Input sanitation (SQL injection handled by Supabase parameterisation, still validate user IDs).
* Rate limiting as above.
* CORS: allow same origin + pre-flight.

## 8. Versioning Strategy

* Prefix all routes with `/api/v1`. Breaking changes introduce `/v2`.

## 9. Assumptions & Notes

* Registration / login delegate entirely to Supabase Auth REST endpoints; local wrappers provided for uniform route surface.
* Timer functionality lives in frontend; no dedicated backend timer endpoints.
* Data retention job (`delete_old_workout_sessions`) runs database-side; no API wrapper required.
* All timestamps are stored and returned in UTC; client responsible for local TZ display.
