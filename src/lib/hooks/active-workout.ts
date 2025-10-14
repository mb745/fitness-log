import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkoutSessionDetailDTO, SessionSetDTO, SessionSetUpdateCommand, WorkoutSessionDTO } from "../../types";

/**
 * Fetch JSON helper with credentials
 */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const statusCode = res.status;
    throw new Error(String(statusCode));
  }
  return (await res.json()) as T;
}

/**
 * Query key builder for active workout session
 */
export function buildActiveSessionKey(sessionId: number) {
  return ["activeSession", sessionId];
}

/**
 * Hook: useActiveSession
 * Fetches workout session details for active workout view.
 * Returns session with all sets and exercise names.
 *
 * @param sessionId - Session ID to fetch
 * @returns Query result with session details
 */
export function useActiveSession(sessionId: number) {
  return useQuery({
    queryKey: buildActiveSessionKey(sessionId),
    queryFn: async () => {
      return await fetchJson<WorkoutSessionDetailDTO>(`/api/v1/workout-sessions/${sessionId}`);
    },
    staleTime: 0, // Don't cache - always consider stale for immediate updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 1, // Only retry once on failure
  });
}

/**
 * Hook: usePatchSet
 * Mutation for updating a session set (reps, weight, status).
 * Implements optimistic updates for better UX.
 *
 * @returns Mutation object for patching sets
 */
export function usePatchSet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ setId, updates }: { setId: number; updates: SessionSetUpdateCommand }) => {
      return await fetchJson<SessionSetDTO>(`/api/v1/session-sets/${setId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    // Optimistic update: immediately update UI before server responds
    onMutate: async ({ setId, updates }) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await qc.cancelQueries({ queryKey: ["activeSession"], exact: false });

      // Snapshot the previous value
      const previousData = qc.getQueriesData<WorkoutSessionDetailDTO>({ queryKey: ["activeSession"], exact: false });

      // Optimistically update all active session queries
      qc.setQueriesData<WorkoutSessionDetailDTO>({ queryKey: ["activeSession"], exact: false }, (old) => {
        if (!old) return old;
        return {
          ...old,
          sets: old.sets.map((set) =>
            set.id === setId
              ? {
                  ...set,
                  ...updates,
                  // Set completed_at if status is being set to completed
                  ...(updates.status === "completed" && { completed_at: new Date().toISOString() }),
                }
              : set
          ),
        };
      });

      return { previousData };
    },
    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    // Always refetch after error or success to ensure sync
    onSettled: async (_data, _error, variables) => {
      // Invalidate and refetch to ensure UI is in sync
      await qc.invalidateQueries({ queryKey: ["activeSession"], exact: false });
      // Force immediate refetch for better responsiveness
      await qc.refetchQueries({ queryKey: ["activeSession"], exact: false });
    },
  });
}

/**
 * Hook: useCompleteSession
 * Mutation for completing a workout session.
 * Changes session status from 'in_progress' to 'completed'.
 *
 * @returns Mutation object for completing session
 */
export function useCompleteSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      return await fetchJson<WorkoutSessionDTO>(`/api/v1/workout-sessions/${sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      // Invalidate all related queries
      qc.invalidateQueries({ queryKey: ["activeSession"], exact: false });
      qc.invalidateQueries({ queryKey: ["calendarSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["workoutSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["sessionDetails"], exact: false });
    },
  });
}

/**
 * Hook: useAbandonSessionForActive
 * Mutation for abandoning a workout session from active workout view.
 * Changes session status from 'in_progress' to 'abandoned'.
 *
 * Note: This is a separate hook from useAbandonSessionMutation in workout-sessions.ts
 * to allow for different invalidation strategies (active workout clears local state).
 *
 * @returns Mutation object for abandoning session
 */
export function useAbandonSessionForActive() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      return await fetchJson<WorkoutSessionDTO>(`/api/v1/workout-sessions/${sessionId}/abandon`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      // Invalidate all related queries
      qc.invalidateQueries({ queryKey: ["activeSession"], exact: false });
      qc.invalidateQueries({ queryKey: ["calendarSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["workoutSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["sessionDetails"], exact: false });
    },
  });
}
