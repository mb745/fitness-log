import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID, SessionSetDTO, SessionSetUpdateCommand, WorkoutSessionStatus } from "../../types";
import type { Database } from "../../db/database.types";
import { NotFoundError } from "../api-helpers";

/**
 * Extended session set DTO that includes parent workout session data.
 * Used internally to validate ownership and session status.
 */
interface SessionSetWithSession extends SessionSetDTO {
  workout_sessions: {
    user_id: UUID;
    status: WorkoutSessionStatus;
  };
}

/**
 * Service for managing individual session sets within workout sessions.
 * Handles retrieval and updates of training set execution data.
 *
 * Key business rules enforced:
 * - Session sets can only be updated when parent session is 'in_progress'
 * - Users can only access their own session sets
 * - Status transitions must follow allowed state machine rules
 */
export class SessionSetService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a session set with its parent workout session data.
   * Validates that the session set belongs to the specified user.
   *
   * This method performs a JOIN with workout_sessions to:
   * 1. Verify the user owns the parent workout session
   * 2. Retrieve the parent session status for validation
   * 3. Ensure data isolation between users
   *
   * @param sessionSetId - ID of the session set to retrieve
   * @param userId - User ID to validate ownership
   * @returns Session set with embedded workout session data
   * @throws NotFoundError if session set doesn't exist or doesn't belong to user
   */
  async getSessionSetWithSession(sessionSetId: number, userId: UUID): Promise<SessionSetWithSession> {
    const { data, error } = await this.supabase
      .from("session_sets")
      .select(
        `
        *,
        workout_sessions!inner(
          user_id,
          status
        )
      `
      )
      .eq("id", sessionSetId)
      .eq("workout_sessions.user_id", userId)
      .single();

    if (error) {
      // PGRST116 is Supabase error code for "no rows returned"
      if (error.code === "PGRST116") {
        throw new NotFoundError("Session set not found");
      }
      console.error("[SessionSetService] Error fetching session set:", error);
      throw new Error(`Failed to fetch session set: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError("Session set not found");
    }

    return data as SessionSetWithSession;
  }

  /**
   * Update a session set with new execution data.
   * Automatically sets completed_at timestamp when status changes to 'completed'.
   *
   * Note: This method assumes authorization and business rule validation
   * (session status, status transitions) have been performed by the caller.
   *
   * @param sessionSetId - ID of the session set to update
   * @param updates - Partial update data (actual_reps, weight_kg, status)
   * @returns Updated session set
   * @throws NotFoundError if session set not found after update (shouldn't happen)
   */
  async updateSessionSet(sessionSetId: number, updates: SessionSetUpdateCommand): Promise<SessionSetDTO> {
    // Prepare update payload
    const updatePayload: Record<string, unknown> = { ...updates };

    // Auto-set completed_at timestamp when status changes to completed
    if (updates.status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("session_sets")
      .update(updatePayload)
      .eq("id", sessionSetId)
      .select()
      .single();

    if (error) {
      console.error("[SessionSetService] Error updating session set:", error);
      throw new Error(`Failed to update session set: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError("Session set not found");
    }

    return data as SessionSetDTO;
  }
}
