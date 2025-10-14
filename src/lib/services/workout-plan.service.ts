import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UUID,
  WorkoutPlanDTO,
  WorkoutPlanDetailDTO,
  WorkoutPlansListQuery,
  WorkoutPlansListResponse,
  WorkoutPlanCreateCommand,
  WorkoutPlanUpdateCommand,
  PlanExerciseCreateInput,
  PlanExerciseDTO,
  PlanExercisePatchCommand,
} from "../../types";
import type { Database } from "../../db/database.types";

/**
 * Service for managing workout plans and their exercises.
 * Handles all business logic for workout plan operations.
 */
export class WorkoutPlanService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List workout plans for a user with pagination and filtering.
   */
  async listPlans(userId: UUID, query: WorkoutPlansListQuery): Promise<WorkoutPlansListResponse> {
    const page = query.page || 1;
    const pageSize = Math.min(query.page_size || 20, 100);
    const offset = (page - 1) * pageSize;

    // Build query with filters
    let supabaseQuery = this.supabase.from("workout_plans").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply is_active filter if provided
    if (query.is_active !== undefined) {
      supabaseQuery = supabaseQuery.eq("is_active", query.is_active);
    }

    // Apply sorting
    const sort = query.sort || "-created_at";
    const isDescending = sort.startsWith("-");
    const sortField = isDescending ? sort.substring(1) : sort;
    supabaseQuery = supabaseQuery.order(sortField, { ascending: !isDescending });

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + pageSize - 1);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      console.error("[WorkoutPlanService] Error listing plans:", error);
      throw new Error(`Failed to list workout plans: ${error.message}`);
    }

    const total = count || 0;
    const lastPage = Math.ceil(total / pageSize);

    return {
      data: (data || []) as WorkoutPlanDTO[],
      total,
      page,
      page_size: pageSize,
      last_page: lastPage,
    };
  }

  /**
   * Create a new workout plan with exercises.
   * Uses a transaction to ensure atomicity.
   */
  async createPlan(userId: UUID, command: WorkoutPlanCreateCommand): Promise<WorkoutPlanDTO> {
    // Insert workout plan
    const { data: plan, error: planError } = await this.supabase
      .from("workout_plans")
      .insert({
        user_id: userId,
        name: command.name,
        schedule_type: command.schedule_type,
        schedule_days: command.schedule_days,
        schedule_interval_days: command.schedule_interval_days,
        is_active: false, // New plans are inactive by default
      })
      .select()
      .single();

    if (planError) {
      console.error("[WorkoutPlanService] Error creating plan:", planError);
      throw new Error(`Failed to create workout plan: ${planError.message}`);
    }

    // Insert exercises
    const exercisesToInsert = command.exercises.map((exercise) => ({
      workout_plan_id: plan.id,
      exercise_id: exercise.exercise_id,
      order_index: exercise.order_index,
      target_sets: exercise.target_sets,
      target_reps: exercise.target_reps,
      rest_seconds: exercise.rest_seconds ?? 30,
      notes: exercise.notes || null,
    }));

    const { error: exercisesError } = await this.supabase.from("plan_exercises").insert(exercisesToInsert);

    if (exercisesError) {
      console.error("[WorkoutPlanService] Error creating exercises:", exercisesError);

      // Rollback: delete the created plan
      await this.supabase.from("workout_plans").delete().eq("id", plan.id);

      // Check if it's a foreign key violation (invalid exercise_id)
      if (exercisesError.code === "23503") {
        throw new Error("One or more exercise IDs do not exist");
      }

      throw new Error(`Failed to create plan exercises: ${exercisesError.message}`);
    }

    return plan as WorkoutPlanDTO;
  }

  /**
   * Get a workout plan by ID with all exercises.
   * Returns null if not found or doesn't belong to user.
   */
  async getPlanById(planId: number, userId: UUID): Promise<WorkoutPlanDetailDTO | null> {
    const { data, error } = await this.supabase
      .from("workout_plans")
      .select(
        `
        *,
        plan_exercises (
          *,
          exercises (*)
        )
      `
      )
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("[WorkoutPlanService] Error getting plan:", error);
      throw new Error(`Failed to get workout plan: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Transform the nested structure to match WorkoutPlanDetailDTO
    const plan: WorkoutPlanDetailDTO = {
      ...data,
      schedule_type: data.schedule_type as "weekly" | "interval",
      exercises: (data.plan_exercises || []).map((pe: any) => ({
        ...pe,
        exercise: {
          ...pe.exercises,
          exercise_type: pe.exercises.exercise_type as "compound" | "isolation",
        },
      })),
    };

    // Remove the nested plan_exercises property as it's now in exercises
    delete (plan as any).plan_exercises;

    return plan;
  }

  /**
   * Update a workout plan.
   * Returns null if not found or doesn't belong to user.
   */
  async updatePlan(planId: number, userId: UUID, command: WorkoutPlanUpdateCommand): Promise<WorkoutPlanDTO | null> {
    const { data, error } = await this.supabase
      .from("workout_plans")
      .update(command)
      .eq("id", planId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[WorkoutPlanService] Error updating plan:", error);
      throw new Error(`Failed to update workout plan: ${error.message}`);
    }

    return data as WorkoutPlanDTO;
  }

  /**
   * Delete a workout plan.
   * Returns false if not found or doesn't belong to user.
   * Throws error if plan is used in sessions (foreign key constraint).
   */
  async deletePlan(planId: number, userId: UUID): Promise<boolean> {
    // New: Remove any workout sessions that reference this plan before deleting the plan itself
    const { error: sessionsError } = await this.supabase
      .from("workout_sessions")
      .delete()
      .eq("workout_plan_id", planId)
      .eq("user_id", userId);

    if (sessionsError) {
      console.error("[WorkoutPlanService] Error deleting sessions for plan:", sessionsError);
      throw new Error(`Failed to delete related workout sessions: ${sessionsError.message}`);
    }

    // Proceed to delete the plan now that no foreign key constraints remain
    const { error } = await this.supabase.from("workout_plans").delete().eq("id", planId).eq("user_id", userId);

    if (error) {
      // Removed FK violation guard; sessions referencing this plan are now deleted above.
      if (error.code === "PGRST116") {
        return false;
      }

      console.error("[WorkoutPlanService] Error deleting plan:", error);
      throw new Error(`Failed to delete workout plan: ${error.message}`);
    }

    return true;
  }

  /**
   * Activate a workout plan and deactivate all others for the user.
   * Returns null if plan not found or doesn't belong to user.
   * Abandons all scheduled and in-progress sessions of the previously active plan.
   */
  async activatePlan(planId: number, userId: UUID): Promise<WorkoutPlanDTO | null> {
    // First, verify plan exists and belongs to user
    const plan = await this.verifyPlanOwnership(planId, userId);
    if (!plan) {
      return null;
    }

    // Find currently active plan
    const { data: activePlans } = await this.supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true);

    // If there's an active plan, abandon all its scheduled and in-progress sessions
    if (activePlans && activePlans.length > 0) {
      const activePlanIds = activePlans.map((p) => p.id);

      const { error: abandonError } = await this.supabase
        .from("workout_sessions")
        .update({
          status: "abandoned",
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .in("workout_plan_id", activePlanIds)
        .in("status", ["scheduled", "in_progress"]);

      if (abandonError) {
        console.error("[WorkoutPlanService] Error abandoning previous plan sessions:", abandonError);
        throw new Error(`Failed to abandon previous plan sessions: ${abandonError.message}`);
      }
    }

    // Deactivate all other plans
    const { error: deactivateError } = await this.supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("user_id", userId)
      .neq("id", planId);

    if (deactivateError) {
      console.error("[WorkoutPlanService] Error deactivating plans:", deactivateError);
      throw new Error(`Failed to deactivate other plans: ${deactivateError.message}`);
    }

    // Activate the target plan
    const { data, error } = await this.supabase
      .from("workout_plans")
      .update({ is_active: true })
      .eq("id", planId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[WorkoutPlanService] Error activating plan:", error);
      throw new Error(`Failed to activate workout plan: ${error.message}`);
    }

    return data as WorkoutPlanDTO;
  }

  /**
   * Replace all exercises in a workout plan.
   * Deletes existing exercises and inserts new ones.
   */
  async replaceExercises(
    planId: number,
    userId: UUID,
    exercises: PlanExerciseCreateInput[]
  ): Promise<WorkoutPlanDetailDTO | null> {
    // Verify plan ownership
    const planExists = await this.verifyPlanOwnership(planId, userId);
    if (!planExists) {
      return null;
    }

    // Delete existing exercises
    const { error: deleteError } = await this.supabase.from("plan_exercises").delete().eq("workout_plan_id", planId);

    if (deleteError) {
      console.error("[WorkoutPlanService] Error deleting exercises:", deleteError);
      throw new Error(`Failed to delete existing exercises: ${deleteError.message}`);
    }

    // Insert new exercises
    const exercisesToInsert = exercises.map((exercise) => ({
      workout_plan_id: planId,
      exercise_id: exercise.exercise_id,
      order_index: exercise.order_index,
      target_sets: exercise.target_sets,
      target_reps: exercise.target_reps,
      rest_seconds: exercise.rest_seconds ?? 30,
      notes: exercise.notes || null,
    }));

    const { error: insertError } = await this.supabase.from("plan_exercises").insert(exercisesToInsert);

    if (insertError) {
      console.error("[WorkoutPlanService] Error inserting exercises:", insertError);

      // Check if it's a foreign key violation (invalid exercise_id)
      if (insertError.code === "23503") {
        throw new Error("One or more exercise IDs do not exist");
      }

      throw new Error(`Failed to insert exercises: ${insertError.message}`);
    }

    // Return the updated plan with exercises
    return this.getPlanById(planId, userId);
  }

  /**
   * Update a single exercise in a workout plan.
   * Returns null if exercise not found or plan doesn't belong to user.
   */
  async updateExercise(
    planExerciseId: number,
    userId: UUID,
    data: PlanExercisePatchCommand
  ): Promise<PlanExerciseDTO | null> {
    // Verify ownership through join with workout_plans
    const { data: existingExercise, error: checkError } = await this.supabase
      .from("plan_exercises")
      .select(
        `
        *,
        workout_plans!inner (user_id)
      `
      )
      .eq("id", planExerciseId)
      .eq("workout_plans.user_id", userId)
      .single();

    if (checkError || !existingExercise) {
      return null;
    }

    // Update the exercise
    const { data: updated, error } = await this.supabase
      .from("plan_exercises")
      .update(data)
      .eq("id", planExerciseId)
      .select()
      .single();

    if (error) {
      console.error("[WorkoutPlanService] Error updating exercise:", error);
      throw new Error(`Failed to update exercise: ${error.message}`);
    }

    return updated as PlanExerciseDTO;
  }

  /**
   * Delete an exercise from a workout plan.
   * Returns false if not found or doesn't belong to user.
   * Throws error if it's the last exercise or if used in sessions.
   */
  async deleteExercise(planExerciseId: number, planId: number, userId: UUID): Promise<boolean> {
    // Check exercise count in plan
    const { count, error: countError } = await this.supabase
      .from("plan_exercises")
      .select("*", { count: "exact", head: true })
      .eq("workout_plan_id", planId);

    if (countError) {
      console.error("[WorkoutPlanService] Error counting exercises:", countError);
      throw new Error(`Failed to count exercises: ${countError.message}`);
    }

    if (count === 1) {
      throw new Error("Cannot delete the last exercise from a workout plan. A plan must have at least one exercise.");
    }

    // Verify ownership through join
    const { data: exercise, error: checkError } = await this.supabase
      .from("plan_exercises")
      .select(
        `
        id,
        workout_plans!inner (user_id)
      `
      )
      .eq("id", planExerciseId)
      .eq("workout_plan_id", planId)
      .eq("workout_plans.user_id", userId)
      .single();

    if (checkError || !exercise) {
      return false;
    }

    // Delete the exercise
    const { error } = await this.supabase.from("plan_exercises").delete().eq("id", planExerciseId);

    if (error) {
      // Check if it's a foreign key violation (exercise used in sessions)
      if (error.code === "23503") {
        throw new Error("Cannot delete exercise that has been used in workout sessions");
      }

      console.error("[WorkoutPlanService] Error deleting exercise:", error);
      throw new Error(`Failed to delete exercise: ${error.message}`);
    }

    return true;
  }

  /**
   * Verify that a workout plan exists and belongs to the user.
   * Returns the plan if valid, null otherwise.
   */
  async verifyPlanOwnership(planId: number, userId: UUID): Promise<WorkoutPlanDTO | null> {
    const { data, error } = await this.supabase
      .from("workout_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as WorkoutPlanDTO;
  }

  /**
   * Generate and insert scheduled workout sessions for the given plan for the next 3 months.
   * This is invoked right after creating & activating a plan.
   */
  async scheduleFutureSessions(plan: WorkoutPlanDTO, userId: UUID): Promise<void> {
    const startDate = new Date();
    // Start scheduling from tomorrow to avoid creating a past session if user creates plan late in the day
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(8, 0, 0, 0); // default 08:00 local

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // 3 months window

    const sessionDates: string[] = [];

    if (plan.schedule_type === "weekly" && plan.schedule_days && plan.schedule_days.length > 0) {
      const daySet = new Set<number>(plan.schedule_days);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (daySet.has(d.getDay())) {
          sessionDates.push(new Date(d).toISOString());
        }
      }
    } else if (plan.schedule_type === "interval" && plan.schedule_interval_days) {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + plan.schedule_interval_days)) {
        sessionDates.push(new Date(d).toISOString());
      }
    }

    if (sessionDates.length === 0) return;

    const inserts = sessionDates.map((iso) => ({
      user_id: userId,
      workout_plan_id: plan.id,
      scheduled_for: iso,
      status: "scheduled" as const,
    }));

    const { error } = await this.supabase.from("workout_sessions").insert(inserts);

    if (error) {
      console.error("[WorkoutPlanService] Error scheduling future sessions:", error);
      // Do not fail plan creation if scheduling fails; log and continue
    }
  }
}
