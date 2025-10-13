import { useQuery } from "@tanstack/react-query";
import type {
  WorkoutSessionsListResponse,
  WorkoutSessionDTO,
  UpcomingWorkoutDTO,
  WorkoutPlansListResponse,
} from "../../types";

export interface QuickStatsVM {
  weeklyCount: number;
  monthlyCount: number;
  streak: number;
  plansActive: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function useActiveWorkout() {
  return useQuery({
    queryKey: ["workout", "active"],
    queryFn: async () => {
      const data = await fetchJson<WorkoutSessionsListResponse>("/api/v1/workout-sessions?status=in_progress&limit=1");
      return data.data[0] as WorkoutSessionDTO | undefined;
    },
    staleTime: 15_000,
  });
}

export function useUpcomingWorkout() {
  return useQuery({
    queryKey: ["workout", "upcoming"],
    queryFn: async () => {
      // First fetch the active workout plan (there should be at most one)
      const plansRes = await fetchJson<WorkoutPlansListResponse>("/api/v1/workout-plans?is_active=true&page_size=1");

      const activePlan = plansRes.data[0];
      if (!activePlan) return undefined;

      // Fetch upcoming sessions for this plan only, sorted ascending by scheduled_for
      const sessionsRes = await fetchJson<WorkoutSessionsListResponse>(
        `/api/v1/workout-sessions?status=scheduled&sort=scheduled_for&limit=1&workout_plan_id=${activePlan.id}`
      );

      // Attach plan name to response for display convenience
      const session = sessionsRes.data[0] as (WorkoutSessionDTO & { plan_name?: string }) | undefined;
      if (session) session.plan_name = activePlan.name;

      return session;
    },
    staleTime: 15_000,
  });
}

export function useLastCompletedWorkout() {
  return useQuery({
    queryKey: ["workout", "lastCompleted"],
    queryFn: async () => {
      const data = await fetchJson<WorkoutSessionsListResponse>(
        "/api/v1/workout-sessions?status=completed&sort=-completed_at&limit=1"
      );
      return data.data[0] as WorkoutSessionDTO | undefined;
    },
    staleTime: 60_000,
  });
}

export function useQuickStats() {
  return useQuery({
    queryKey: ["quickStats"],
    queryFn: async (): Promise<QuickStatsVM> => {
      const upcoming = await fetchJson<UpcomingWorkoutDTO[]>("/api/v1/analytics/upcoming-workouts");
      // TODO: Derive stats properly once backend available
      return {
        weeklyCount: 0,
        monthlyCount: 0,
        streak: 0,
        plansActive: upcoming.length,
      };
    },
    staleTime: 60_000,
  });
}
