import React from "react";
import type { WorkoutPlanDTO } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { useActivatePlanMutation, useDeletePlanMutation } from "../../lib/hooks/workout-plans";
import { Button } from "../ui/button";

// Extend the base DTO with an optional exercises_count that may be returned by API aggregates.
type WorkoutPlanWithCount = WorkoutPlanDTO & {
  // Returned by list endpoint aggregates
  exercises_count?: number | null;
};

// Shape returned by GET /api/v1/workout-plans/:id (subset used here)
interface WorkoutPlanDetail {
  exercises: {
    id: number;
    target_sets: number;
    rest_seconds: number | null;
    exercise: { name: string };
  }[];
}

interface Props {
  plan: WorkoutPlanWithCount;
}

export const WorkoutPlanCard: React.FC<Props> = ({ plan }) => {
  const activateMutation = useActivatePlanMutation();
  const deleteMutation = useDeletePlanMutation();

  // Lazy-load exercises list for this plan
  const { data: detail, isLoading: exercisesLoading } = useQuery({
    queryKey: ["workoutPlanDetail", plan.id],
    enabled: !!plan.id,
    queryFn: async () => {
      const res = await fetch(`/api/v1/workout-plans/${plan.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as WorkoutPlanDetail;
    },
    staleTime: 60_000,
  });

  return (
    <div className="border rounded-lg p-4 flex flex-col" data-testid={`plan-card-${plan.id}`}>
      <div className="flex-1">
        <h2 className="text-lg font-medium mb-2" data-testid={`plan-name-${plan.id}`}>
          {plan.is_active ? plan.name : `${plan.name} (plan nieaktywny)`}
        </h2>
        {detail && detail.exercises.length > 0 && (
          <div className="text-sm mb-2 space-y-1" data-testid={`plan-exercises-list-${plan.id}`}>
            {detail.exercises.map((ex) => (
              <p key={ex.id} className="flex flex-wrap gap-1" data-testid={`plan-exercise-item-${plan.id}-${ex.id}`}>
                <span className="font-medium">{ex.exercise.name}</span>
                <span className="text-muted-foreground">—</span>
                <span>
                  {ex.target_sets} serie
                  {ex.rest_seconds ? `, przerwa ${ex.rest_seconds}s` : ""}
                </span>
              </p>
            ))}
          </div>
        )}
        {!detail && !exercisesLoading && <p className="text-sm text-muted-foreground mb-2">Brak ćwiczeń</p>}
        {exercisesLoading && <p className="text-sm text-muted-foreground mb-2">Ładowanie ćwiczeń...</p>}
      </div>
      <div className="mt-auto flex gap-2 pt-2 border-t">
        {!plan.is_active && (
          <Button
            disabled={activateMutation.isPending}
            data-testid={`activate-plan-button-${plan.id}`}
            onClick={() => activateMutation.mutate(plan.id)}
            size="sm"
          >
            Aktywuj
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          data-testid={`delete-plan-button-${plan.id}`}
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (confirm("Usunąć plan?")) deleteMutation.mutate(plan.id);
          }}
        >
          Usuń
        </Button>
      </div>
    </div>
  );
};
