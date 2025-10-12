import React from "react";
import type { WorkoutPlanDTO } from "../../types";
import { WorkoutPlanCard } from "./WorkoutPlanCard.tsx";

export const PlansGrid: React.FC<{ plans: WorkoutPlanDTO[] }> = ({ plans }) => {
  if (plans.length === 0) return null;
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <WorkoutPlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
};
