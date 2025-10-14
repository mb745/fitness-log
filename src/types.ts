import type { Tables as DbTables, TablesInsert as DbInsert, TablesUpdate as DbUpdate } from "./db/database.types";

// Base primitives and helpers
export type ISODateString = string; // ISO-8601 in UTC
export type UUID = string;

// Domain enums (narrowing DB string columns)
export type ExerciseType = "compound" | "isolation";
export type ScheduleType = "weekly" | "interval";
export type WorkoutSessionStatus = "scheduled" | "in_progress" | "completed" | "abandoned";
export type SessionSetStatus = "pending" | "completed" | "skipped";

// Generic list + pagination types
export interface PaginationParams {
  page?: number;
  page_size?: number; // default 20, max 100
  sort?: string; // e.g. "name", "-created_at"
}

export interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  page_size: number;
  last_page: number;
}

// ===== Entity DTOs (derived from DB rows, with narrowed enums where applicable) =====

export type ProfileDTO = DbTables<"users">;

export type MuscleGroupDTO = DbTables<"muscle_groups">;

export type MuscleSubgroupDTO = DbTables<"muscle_subgroups">;

type ExerciseRow = DbTables<"exercises">;
export type ExerciseDTO = Omit<ExerciseRow, "exercise_type"> & {
  // Narrow DB string to domain union used by API
  exercise_type: ExerciseType;
};

type WorkoutPlanRow = DbTables<"workout_plans">;
export type WorkoutPlanDTO = Omit<WorkoutPlanRow, "schedule_type"> & {
  // Narrow to API-defined schedule types
  schedule_type: ScheduleType;
};

export type PlanExerciseDTO = DbTables<"plan_exercises">;

type WorkoutSessionRow = DbTables<"workout_sessions">;
export type WorkoutSessionDTO = Omit<WorkoutSessionRow, "status"> & {
  status: WorkoutSessionStatus;
};

type SessionSetRow = DbTables<"session_sets">;
export type SessionSetDTO = Omit<SessionSetRow, "status"> & {
  status: SessionSetStatus;
};

// ===== Compound DTOs (embedded shapes) =====

export type PlanExerciseWithExerciseDTO = PlanExerciseDTO & {
  exercise: ExerciseDTO;
};

export type WorkoutPlanDetailDTO = WorkoutPlanDTO & {
  exercises: PlanExerciseWithExerciseDTO[];
};

export type SessionSetWithExerciseDTO = SessionSetDTO & {
  exercise_name: string;
};

export type WorkoutSessionDetailDTO = WorkoutSessionDTO & {
  plan_name: string;
  sets: SessionSetWithExerciseDTO[];
};

// ===== View DTOs (analytics) =====

type UpcomingWorkoutViewRow = DbTables<"upcoming_workouts">;
export type UpcomingWorkoutDTO = Omit<UpcomingWorkoutViewRow, "status"> & {
  status: WorkoutSessionStatus | null;
};

type WorkoutHistoryViewRow = DbTables<"workout_history">;
export type WorkoutHistoryDTO = Omit<WorkoutHistoryViewRow, "status"> & {
  status: WorkoutSessionStatus | null;
};

type ExerciseProgressionViewRow = DbTables<"exercise_progression">;
export type ExerciseProgressionDTO = Omit<ExerciseProgressionViewRow, "status"> & {
  status: SessionSetStatus | null;
};

// ===== Query model types =====

export type ExercisesQueryParams = PaginationParams & {
  q?: string;
  muscle_group_id?: number;
  muscle_subgroup_id?: number;
  type?: ExerciseType;
  is_active?: boolean;
};

export type WorkoutPlansListQuery = PaginationParams & {
  is_active?: boolean;
};

export type WorkoutSessionsQueryParams = PaginationParams & {
  status?: WorkoutSessionStatus;
  from?: ISODateString;
  to?: ISODateString;
  /** Filter sessions by workout plan */
  workout_plan_id?: number;
};

export type WorkoutHistoryQueryParams = PaginationParams; // history endpoint is paginated

export interface ExerciseProgressionQueryParams {
  exercise_id: number;
}

// ===== Command models (request payloads) =====

// 2.1 Profile
export type ProfileCreateCommand = Omit<DbInsert<"users">, "id" | "created_at" | "updated_at">;

export type ProfileUpdateCommand = Partial<Omit<DbUpdate<"users">, "id" | "created_at" | "updated_at">>;

// 2.3 Exercises are read-only (no commands)

// 2.4 Workout Plans

// Item used when creating/replacing a plan's exercises list.
// Note: API plan example mentions `target_weight`, which is not present in DB `plan_exercises`.
// We intentionally omit it to keep types aligned to persisted schema.
export type PlanExerciseCreateInput = Omit<
  DbInsert<"plan_exercises">,
  "id" | "workout_plan_id" | "created_at" | "updated_at"
>;

export interface WorkoutPlanCreateCommand {
  name: WorkoutPlanRow["name"];
  schedule_type: ScheduleType;
  schedule_days: WorkoutPlanRow["schedule_days"];
  schedule_interval_days: WorkoutPlanRow["schedule_interval_days"];
  exercises: PlanExerciseCreateInput[]; // ≥ 1 item; server enforces invariants
}

export type WorkoutPlanUpdateCommand = Partial<
  Pick<DbUpdate<"workout_plans">, "name" | "schedule_type" | "schedule_days" | "schedule_interval_days" | "is_active">
> & {
  // Narrow schedule_type to API union when provided
  schedule_type?: ScheduleType;
};

export interface PlanExercisesBulkReplaceCommand {
  exercises: PlanExerciseCreateInput[];
}

export type PlanExercisePatchCommand = Partial<
  Pick<DbUpdate<"plan_exercises">, "order_index" | "target_sets" | "target_reps" | "rest_seconds" | "notes">
>;

export type EmptyPayload = Record<never, never>;
export type WorkoutPlanActivateCommand = EmptyPayload;

// 2.5 Workout Sessions
export type WorkoutSessionCreateCommand = Pick<
  DbInsert<"workout_sessions">,
  "workout_plan_id" | "scheduled_for" | "notes"
>;

export type WorkoutSessionUpdateCommand = Partial<
  Pick<DbUpdate<"workout_sessions">, "scheduled_for" | "notes" | "status">
> & {
  status?: WorkoutSessionStatus;
};

// 2.6 Session Sets
export type SessionSetUpdateCommand = Partial<
  Pick<DbUpdate<"session_sets">, "actual_reps" | "weight_kg" | "status">
> & {
  status?: SessionSetStatus;
};

// ===== Response wrappers per endpoint (selected) =====

export type ExercisesListResponse = PaginatedResponse<ExerciseDTO>;
export type WorkoutPlansListResponse = PaginatedResponse<WorkoutPlanDTO>;
export type WorkoutSessionsListResponse = PaginatedResponse<WorkoutSessionDTO>;
export type WorkoutHistoryListResponse = PaginatedResponse<WorkoutHistoryDTO>;

// ===== Calendar View Types =====

export interface CalendarEventVM {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: WorkoutSessionStatus;
}

export interface CalendarEventsListResponse extends Omit<PaginatedResponse<CalendarEventVM>, "data"> {
  data: CalendarEventVM[];
}

export type CalendarView = "month";
