import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkoutPlansListResponse, WorkoutPlanDTO, WorkoutPlanActivateCommand } from "../../types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

export function buildWorkoutPlansKey(showInactive: boolean) {
  return ["workoutPlans", { showInactive }];
}

export function buildActiveWorkoutPlanKey() {
  return ["activeWorkoutPlan"];
}

export function useWorkoutPlans(showInactive: boolean) {
  return useQuery({
    queryKey: buildWorkoutPlansKey(showInactive),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (!showInactive) qs.append("is_active", "true");
      return await fetchJson<WorkoutPlansListResponse>(`/api/v1/workout-plans?${qs.toString()}`);
    },
    staleTime: 60_000,
  });
}

export function useActivatePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: number) => {
      return await fetchJson<WorkoutPlanDTO>(`/api/v1/workout-plans/${planId}/activate`, {
        method: "POST",
        body: JSON.stringify({} as WorkoutPlanActivateCommand),
      });
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["workoutPlans"], exact: false });
    },
  });
}

export function useDeletePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: number) => {
      const res = await fetch(`/api/v1/workout-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      return planId;
    },
    onMutate: async (planId) => {
      await qc.cancelQueries({ queryKey: ["workoutPlans"] });

      // Snapshot previous values
      const prev = qc.getQueriesData<WorkoutPlansListResponse>({ queryKey: ["workoutPlans"] });

      // Optimistically remove the plan from each cached result
      prev.forEach(([key, value]) => {
        if (!value) return;
        qc.setQueryData<WorkoutPlansListResponse>(key, {
          ...value,
          data: value.data.filter((p) => p.id !== planId),
        });
      });

      return { prev };
    },
    onError: (_err, _planId, context) => {
      // Rollback optimistic update
      if (context?.prev) {
        context.prev.forEach(([key, value]: [unknown, WorkoutPlansListResponse | undefined]) => {
          qc.setQueryData(key, value);
        });
      }
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["workoutPlans"] });
    },
  });
}

export function useActiveWorkoutPlan() {
  return useQuery({
    queryKey: buildActiveWorkoutPlanKey(),
    queryFn: async () => {
      const qs = new URLSearchParams({ is_active: "true", page_size: "1" });
      const response = await fetchJson<WorkoutPlansListResponse>(`/api/v1/workout-plans?${qs.toString()}`);
      // Return the first active plan or null if none
      return response.data.length > 0 ? response.data[0] : null;
    },
    staleTime: 60_000,
  });
}
