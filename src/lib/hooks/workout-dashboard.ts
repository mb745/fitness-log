import { useQuery } from "@tanstack/react-query";
import { WorkoutSessionsListResponse, WorkoutSessionDTO, UpcomingWorkoutDTO } from "../../types";

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
      const data = await fetchJson<WorkoutSessionsListResponse>(
        "/api/v1/workout-sessions?status=scheduled&sort=scheduled_for&limit=1"
      );
      return data.data[0] as WorkoutSessionDTO | undefined;
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
