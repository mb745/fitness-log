import type { SupabaseClient } from "../../db/supabase.client";
import type { ExerciseDTO, ExercisesListResponse, ExercisesQueryParams, ExerciseType } from "../../types";
import { buildPaginationMeta, parseSortParam } from "../api-helpers";

/**
 * Service for managing exercises from the global library.npx supabase start
 *
 * Handles read-only operations for the exercises table.
 */
export class ExerciseService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a paginated list of exercises with filtering, search, and sorting.
   *
   * @param params - Query parameters for filtering, pagination, and sorting
   * @returns Paginated response with exercises and metadata
   * @throws Error if database query fails
   */
  async listExercises(params: ExercisesQueryParams): Promise<ExercisesListResponse> {
    const {
      q,
      muscle_group_id,
      muscle_subgroup_id,
      type,
      is_active = true, // Default to active exercises only
      page = 1,
      page_size = 20,
      sort,
    } = params;

    // Start building the query
    let query = this.supabase.from("exercises").select("*", { count: "exact" });

    // Apply filters
    // Filter by active status (default: true for public access)
    query = query.eq("is_active", is_active);

    // Filter by muscle group
    if (muscle_group_id !== undefined) {
      query = query.eq("muscle_group_id", muscle_group_id);
    }

    // Filter by muscle subgroup
    if (muscle_subgroup_id !== undefined) {
      query = query.eq("muscle_subgroup_id", muscle_subgroup_id);
    }

    // Filter by exercise type
    if (type !== undefined) {
      query = query.eq("exercise_type", type);
    }

    // Apply full-text search (using ILIKE for trigram index)
    if (q !== undefined && q.trim() !== "") {
      // Escape special characters for ILIKE pattern
      const searchTerm = q.trim().replace(/[%_]/g, "\\$&");
      query = query.ilike("name", `%${searchTerm}%`);
    }

    // Apply sorting
    const sortParam = parseSortParam(sort);
    if (sortParam) {
      query = query.order(sortParam.column, { ascending: sortParam.ascending });
    } else {
      // Default sort: by name ascending
      query = query.order("name", { ascending: true });
    }

    // Apply pagination
    const offset = (page - 1) * page_size;
    query = query.range(offset, offset + page_size - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    // Map database rows to ExerciseDTO (narrowing exercise_type to domain enum)
    const exercises: ExerciseDTO[] = (data || []).map((row) => ({
      ...row,
      exercise_type: row.exercise_type as ExerciseType,
    }));

    // Build pagination metadata
    const total = count ?? 0;
    const paginationMeta = buildPaginationMeta(total, page, page_size);

    return {
      data: exercises,
      ...paginationMeta,
    };
  }

  /**
   * Retrieves a single exercise by its ID.
   *
   * @param id - The ID of the exercise
   * @returns ExerciseDTO if found, null if not found
   * @throws Error if database query fails
   */
  async getExerciseById(id: number): Promise<ExerciseDTO | null> {
    const { data, error } = await this.supabase.from("exercises").select("*").eq("id", id).single();

    // PGRST116 is Supabase's error code for "no rows returned"
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch exercise: ${error.message}`);
    }

    // Map database row to ExerciseDTO (narrowing exercise_type to domain enum)
    return {
      ...data,
      exercise_type: data.exercise_type as ExerciseType,
    };
  }
}
