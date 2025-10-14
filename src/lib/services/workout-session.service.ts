import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UUID,
  WorkoutSessionDTO,
  WorkoutSessionDetailDTO,
  WorkoutSessionsQueryParams,
  WorkoutSessionsListResponse,
  WorkoutSessionCreateCommand,
  WorkoutSessionUpdateCommand,
  SessionSetDTO,
  WorkoutSessionStatus,
} from "../../types";
import type { Database } from "../../db/database.types";
import { NotFoundError, ConflictError, UnprocessableEntityError, BadRequestError } from "../api-helpers";

/**
 * Service for managing workout sessions.
 * Handles all business logic for workout session operations including
 * CRUD operations and workflow state transitions (start, complete, abandon).
 */
export class WorkoutSessionService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List workout sessions for a user with pagination and filtering.
   * Supports filtering by status, date range, and sorting.
   *
   * @param userId - User ID to list sessions for
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of workout sessions
   */
  async listSessions(userId: UUID, params: WorkoutSessionsQueryParams): Promise<WorkoutSessionsListResponse> {
    const page = params.page || 1;
    const pageSize = Math.min(params.page_size || 20, 100);
    const offset = (page - 1) * pageSize;

    // Build query with filters
    let query = this.supabase.from("workout_sessions").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply status filter if provided
    if (params.status) {
      query = query.eq("status", params.status);
    }

    // Filter by workout_plan_id if provided
    if (params.workout_plan_id) {
      query = query.eq("workout_plan_id", params.workout_plan_id);
    }

    // Apply date range filters if provided
    if (params.from) {
      query = query.gte("scheduled_for", params.from);
    }
    if (params.to) {
      query = query.lte("scheduled_for", params.to);
    }

    // Apply sorting (default: scheduled_for DESC)
    const sort = params.sort || "-scheduled_for";
    const isDescending = sort.startsWith("-");
    const sortField = isDescending ? sort.substring(1) : sort;
    query = query.order(sortField, { ascending: !isDescending });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[WorkoutSessionService] Error listing sessions:", error);
      throw new Error(`Failed to list workout sessions: ${error.message}`);
    }

    const total = count || 0;
    const lastPage = total === 0 ? 1 : Math.ceil(total / pageSize);

    return {
      data: (data || []) as WorkoutSessionDTO[],
      total,
      page,
      page_size: pageSize,
      last_page: lastPage,
    };
  }

  /**
   * Create a new workout session.
   * Validates that the workout plan exists and belongs to the user.
   * Session is created with 'scheduled' status.
   *
   * @param userId - User ID creating the session
   * @param command - Session creation data
   * @returns Created workout session
   * @throws NotFoundError if workout plan not found or doesn't belong to user
   */
  async createSession(userId: UUID, command: WorkoutSessionCreateCommand): Promise<WorkoutSessionDTO> {
    // Validate workout plan ownership
    await this.validateWorkoutPlanOwnership(command.workout_plan_id, userId);

    // Insert workout session
    const { data, error } = await this.supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        workout_plan_id: command.workout_plan_id,
        scheduled_for: command.scheduled_for,
        notes: command.notes || null,
        status: "scheduled", // New sessions start as scheduled
      })
      .select()
      .single();

    if (error) {
      console.error("[WorkoutSessionService] Error creating session:", error);
      throw new Error(`Failed to create workout session: ${error.message}`);
    }

    return data as WorkoutSessionDTO;
  }

  /**
   * Get a single workout session by ID with all its sets.
   * Returns session details including all session_sets with exercise names.
   *
   * @param sessionId - Session ID to retrieve
   * @param userId - User ID for ownership validation
   * @returns Session with embedded sets and workout plan name
   * @throws NotFoundError if session not found or doesn't belong to user
   */
  async getSessionById(sessionId: number, userId: UUID): Promise<WorkoutSessionDetailDTO> {
    // Query session with embedded sets and related data using Supabase's nested select
    const { data, error } = await this.supabase
      .from("workout_sessions")
      .select(
        `
        *,
        workout_plan:workout_plans(name),
        sets:session_sets(
          id,
          workout_session_id,
          plan_exercise_id,
          set_number,
          target_reps,
          actual_reps,
          weight_kg,
          status,
          completed_at,
          notes,
          created_at,
          updated_at,
          plan_exercise:plan_exercises(
            exercise:exercises(name)
          )
        )
      `
      )
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Workout session not found");
      }
      console.error("[WorkoutSessionService] Error fetching session:", error);
      throw new Error(`Failed to fetch workout session: ${error.message}`);
    }

    // Transform sets to include exercise name
    const setsWithExercises = ((data.sets as any[]) || []).map((set) => ({
      id: set.id,
      workout_session_id: set.workout_session_id,
      plan_exercise_id: set.plan_exercise_id,
      set_number: set.set_number,
      target_reps: set.target_reps,
      actual_reps: set.actual_reps,
      weight_kg: set.weight_kg,
      status: set.status,
      completed_at: set.completed_at,
      notes: set.notes,
      created_at: set.created_at,
      updated_at: set.updated_at,
      exercise_name: set.plan_exercise?.exercise?.name || "Nieznane ćwiczenie",
    }));

    // Sort sets by plan_exercise_id and set_number
    const sortedSets = setsWithExercises.sort((a, b) => {
      if (a.plan_exercise_id !== b.plan_exercise_id) {
        return a.plan_exercise_id - b.plan_exercise_id;
      }
      return a.set_number - b.set_number;
    });

    return {
      ...(data as WorkoutSessionDTO),
      plan_name: (data.workout_plan as any)?.name || "Nieznany plan",
      sets: sortedSets,
    };
  }

  /**
   * Update an existing workout session.
   * Allows partial updates of scheduled_for, notes, and status.
   *
   * @param sessionId - Session ID to update
   * @param userId - User ID for ownership validation
   * @param command - Update data (partial)
   * @returns Updated workout session
   * @throws NotFoundError if session not found or doesn't belong to user
   */
  async updateSession(
    sessionId: number,
    userId: UUID,
    command: WorkoutSessionUpdateCommand
  ): Promise<WorkoutSessionDTO> {
    // First check if session exists and belongs to user
    const { data: existing, error: fetchError } = await this.supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError("Workout session not found");
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (command.scheduled_for !== undefined) {
      updates.scheduled_for = command.scheduled_for;
    }
    if (command.notes !== undefined) {
      updates.notes = command.notes;
    }
    if (command.status !== undefined) {
      updates.status = command.status;
    }

    // Update session
    const { data, error } = await this.supabase
      .from("workout_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[WorkoutSessionService] Error updating session:", error);
      throw new Error(`Failed to update workout session: ${error.message}`);
    }

    return data as WorkoutSessionDTO;
  }

  /**
   * Delete a workout session.
   * Only sessions with 'scheduled' status can be deleted.
   *
   * @param sessionId - Session ID to delete
   * @param userId - User ID for ownership validation
   * @throws NotFoundError if session not found or doesn't belong to user
   * @throws UnprocessableEntityError if session is not in 'scheduled' status
   */
  async deleteSession(sessionId: number, userId: UUID): Promise<void> {
    // First check if session exists and belongs to user
    const { data: session, error: fetchError } = await this.supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new NotFoundError("Workout session not found");
    }

    // Validate status is 'scheduled'
    if (session.status !== "scheduled") {
      throw new UnprocessableEntityError("Cannot delete session that has been started. Status must be 'scheduled'.");
    }

    // Delete session
    const { error } = await this.supabase.from("workout_sessions").delete().eq("id", sessionId).eq("user_id", userId);

    if (error) {
      console.error("[WorkoutSessionService] Error deleting session:", error);
      throw new Error(`Failed to delete workout session: ${error.message}`);
    }
  }

  /**
   * Start a workout session (workflow action).
   * Changes status from 'scheduled' to 'in_progress'.
   * Database trigger automatically creates session_sets for all plan exercises.
   *
   * @param sessionId - Session ID to start
   * @param userId - User ID for ownership validation
   * @returns Session with created sets
   * @throws NotFoundError if session not found
   * @throws BadRequestError if session is not in 'scheduled' status
   * @throws ConflictError if user already has an in-progress session
   */
  async startSession(sessionId: number, userId: UUID): Promise<WorkoutSessionDetailDTO> {
    // Check if session exists and belongs to user
    const { data: session, error: fetchError } = await this.supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new NotFoundError("Workout session not found");
    }

    // Validate status is 'scheduled'
    if (session.status !== "scheduled") {
      throw new BadRequestError("Session must be in 'scheduled' status to start");
    }

    // Check if user already has an in-progress session
    const { data: inProgressSessions } = await this.supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .limit(1);

    if (inProgressSessions && inProgressSessions.length > 0) {
      throw new ConflictError(
        "User already has a workout session in progress. Complete or abandon the current session first."
      );
    }

    // Update session to in_progress
    // Database trigger will:
    // 1. Set started_at to NOW()
    // 2. Create session_sets for all plan_exercises
    const { error: updateError } = await this.supabase
      .from("workout_sessions")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (updateError) {
      // Check if error is unique constraint violation (23505)
      if (updateError.code === "23505") {
        throw new ConflictError(
          "User already has a workout session in progress. Complete or abandon the current session first."
        );
      }
      console.error("[WorkoutSessionService] Error starting session:", updateError);
      throw new Error(`Failed to start workout session: ${updateError.message}`);
    }

    // Fetch updated session with sets
    return await this.getSessionById(sessionId, userId);
  }

  /**
   * Complete a workout session (workflow action).
   * Changes status from 'in_progress' to 'completed'.
   * Validates that all session sets are completed or skipped.
   *
   * @param sessionId - Session ID to complete
   * @param userId - User ID for ownership validation
   * @returns Updated workout session
   * @throws NotFoundError if session not found
   * @throws BadRequestError if session is not in 'in_progress' status
   * @throws UnprocessableEntityError if not all sets are completed/skipped
   */
  async completeSession(sessionId: number, userId: UUID): Promise<WorkoutSessionDTO> {
    // Check if session exists and belongs to user
    const { data: session, error: fetchError } = await this.supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new NotFoundError("Workout session not found");
    }

    // Validate status is 'in_progress'
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session must be in 'in_progress' status to complete");
    }

    // Check if all sets are completed or skipped (none pending)
    const { data: pendingSets, error: setsError } = await this.supabase
      .from("session_sets")
      .select("id")
      .eq("workout_session_id", sessionId)
      .eq("status", "pending")
      .limit(1);

    if (setsError) {
      console.error("[WorkoutSessionService] Error checking sets:", setsError);
      throw new Error(`Failed to validate session sets: ${setsError.message}`);
    }

    if (pendingSets && pendingSets.length > 0) {
      // Count total pending sets for error message
      const { count } = await this.supabase
        .from("session_sets")
        .select("id", { count: "exact", head: true })
        .eq("workout_session_id", sessionId)
        .eq("status", "pending");

      throw new UnprocessableEntityError(
        `Cannot complete session. All sets must be marked as 'completed' or 'skipped'. Found ${count || 0} sets with 'pending' status.`
      );
    }

    // Update session to completed
    // Database trigger will set completed_at to NOW()
    const { data, error } = await this.supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[WorkoutSessionService] Error completing session:", error);
      throw new Error(`Failed to complete workout session: ${error.message}`);
    }

    return data as WorkoutSessionDTO;
  }

  /**
   * Abandon a workout session (workflow action).
   * Changes status from 'in_progress' to 'abandoned'.
   * Database trigger will set completed_at to NOW().
   *
   * @param sessionId - Session ID to abandon
   * @param userId - User ID for ownership validation
   * @returns Updated workout session
   * @throws NotFoundError if session not found
   * @throws BadRequestError if session is not in 'in_progress' status
   */
  async abandonSession(sessionId: number, userId: UUID): Promise<WorkoutSessionDTO> {
    // Check if session exists and belongs to user
    const { data: session, error: fetchError } = await this.supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      throw new NotFoundError("Workout session not found");
    }

    // Validate status is 'in_progress'
    if (session.status !== "in_progress") {
      throw new BadRequestError("Session must be in 'in_progress' status to abandon");
    }

    // Update session to abandoned
    // Database trigger will set completed_at to NOW()
    const { data, error } = await this.supabase
      .from("workout_sessions")
      .update({
        status: "abandoned",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[WorkoutSessionService] Error abandoning session:", error);
      throw new Error(`Failed to abandon workout session: ${error.message}`);
    }

    return data as WorkoutSessionDTO;
  }

  /**
   * Private helper: Validate that a workout plan exists and belongs to user.
   *
   * @param planId - Workout plan ID to validate
   * @param userId - User ID for ownership check
   * @throws NotFoundError if plan not found or doesn't belong to user
   */
  private async validateWorkoutPlanOwnership(planId: number, userId: UUID): Promise<void> {
    const { data, error } = await this.supabase
      .from("workout_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Workout plan not found or does not belong to user");
    }
  }
}
