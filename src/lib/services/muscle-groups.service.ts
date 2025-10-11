import type { SupabaseClient } from "../../db/supabase.client";
import type { MuscleGroupDTO, MuscleSubgroupDTO } from "../../types";

/**
 * Service for managing muscle groups and subgroups dictionaries.
 *
 * These are read-only reference data tables used throughout
 * the application for exercise categorization.
 */
export class MuscleGroupsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all muscle groups ordered by name.
   *
   * @returns Array of muscle groups
   * @throws Error if database query fails
   */
  async getAllMuscleGroups(): Promise<MuscleGroupDTO[]> {
    const { data, error } = await this.supabase.from("muscle_groups").select("*").order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch muscle groups: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Retrieves a single muscle group by its ID.
   *
   * @param id - The ID of the muscle group
   * @returns MuscleGroupDTO if found, null if not found
   * @throws Error if database query fails
   */
  async getMuscleGroupById(id: number): Promise<MuscleGroupDTO | null> {
    const { data, error } = await this.supabase.from("muscle_groups").select("*").eq("id", id).single();

    // PGRST116 is Supabase's error code for "no rows returned"
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch muscle group: ${error.message}`);
    }

    return data;
  }

  /**
   * Retrieves all subgroups for a specific muscle group.
   *
   * @param muscleGroupId - The ID of the muscle group
   * @returns Array of muscle subgroups
   * @throws Error if database query fails
   */
  async getSubgroupsByMuscleGroupId(muscleGroupId: number): Promise<MuscleSubgroupDTO[]> {
    const { data, error } = await this.supabase
      .from("muscle_subgroups")
      .select("*")
      .eq("muscle_group_id", muscleGroupId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch muscle subgroups: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Retrieves all muscle subgroups ordered by muscle group ID.
   *
   * @returns Array of all muscle subgroups
   * @throws Error if database query fails
   */
  async getAllMuscleSubgroups(): Promise<MuscleSubgroupDTO[]> {
    const { data, error } = await this.supabase
      .from("muscle_subgroups")
      .select("*")
      .order("muscle_group_id", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch muscle subgroups: ${error.message}`);
    }

    return data || [];
  }
}
