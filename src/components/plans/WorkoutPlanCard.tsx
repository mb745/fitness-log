import React from "react";
import type { WorkoutPlanDTO } from "../../types";
import { useActivatePlanMutation, useDeletePlanMutation } from "../../lib/hooks/workout-plans";
import { Button } from "../ui/button";

// Extend the base DTO with an optional exercises_count that may be returned by API aggregates.
type WorkoutPlanWithCount = WorkoutPlanDTO & {
  exercises_count?: number | null;
};

interface Props {
  plan: WorkoutPlanWithCount;
}

export const WorkoutPlanCard: React.FC<Props> = ({ plan }) => {
  const activateMutation = useActivatePlanMutation();
  const deleteMutation = useDeletePlanMutation();

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex-1">
        <h2 className="text-lg font-medium mb-2">{plan.name}</h2>
        <p className="text-sm mb-2">Harmonogram: {plan.schedule_type}</p>
        <p className="text-sm text-muted-foreground mb-4">Ćwiczeń: {plan.exercises_count ?? "-"}</p>
      </div>
      <div className="mt-auto flex gap-2">
        {!plan.is_active && (
          <Button disabled={activateMutation.isPending} onClick={() => activateMutation.mutate(plan.id)} size="sm">
            Aktywuj
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
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
