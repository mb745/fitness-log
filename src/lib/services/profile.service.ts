import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDTO, ProfileCreateCommand, ProfileUpdateCommand, UUID } from "../../types";

/**
 * Service for managing user profiles in the application.
 * Handles CRUD operations for the users table.
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a user profile by user ID.
   *
   * @param userId - The UUID of the user
   * @returns ProfileDTO if found, null if not found
   * @throws Error if database query fails
   */
  async getProfile(userId: UUID): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", userId).single();

    // PGRST116 is Supabase's error code for "no rows returned"
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Checks if a profile exists for the given user ID.
   *
   * @param userId - The UUID of the user
   * @returns true if profile exists, false otherwise
   */
  async profileExists(userId: UUID): Promise<boolean> {
    const { data, error } = await this.supabase.from("users").select("id").eq("id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      throw new Error(`Failed to check profile existence: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * Creates a new user profile.
   *
   * @param userId - The UUID of the user (from auth.users)
   * @param profileData - The profile data to create (all fields optional)
   * @returns The newly created ProfileDTO
   * @throws Error if profile already exists or database operation fails
   */
  async createProfile(userId: UUID, profileData: ProfileCreateCommand): Promise<ProfileDTO> {
    // Check if profile already exists
    const exists = await this.profileExists(userId);
    if (exists) {
      throw new Error("Profile already exists");
    }

    const { data, error } = await this.supabase
      .from("users")
      .insert({
        id: userId,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      // PostgreSQL unique constraint violation (23505)
      if (error.code === "23505") {
        throw new Error("Profile already exists");
      }
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates an existing user profile with partial data.
   *
   * @param userId - The UUID of the user
   * @param profileData - Partial profile data to update
   * @returns The updated ProfileDTO
   * @throws Error if profile doesn't exist or database operation fails
   */
  async updateProfile(userId: UUID, profileData: ProfileUpdateCommand): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase.from("users").update(profileData).eq("id", userId).select().single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  }
}
