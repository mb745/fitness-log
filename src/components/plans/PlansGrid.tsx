import React from "react";
import type { WorkoutPlanDTO } from "../../types";
import { WorkoutPlanCard } from "./WorkoutPlanCard.tsx";
import { Button } from "../ui/button";

export const PlansGrid: React.FC<{ plans: WorkoutPlanDTO[] }> = ({ plans }) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" data-testid="plans-grid">
      {plans.map((plan) => (
        <WorkoutPlanCard key={plan.id} plan={plan} />
      ))}
      <div className="border border-dashed rounded-lg p-4 flex flex-col min-h-[138px] hover:border-primary hover:bg-accent/50 transition-colors">
        <div className="flex-1 flex items-center justify-center">
          <Button
            data-testid="add-new-plan-button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/plans/new";
              }
            }}
            size="lg"
            variant="outline"
          >
            + Dodaj nowy plan
          </Button>
        </div>
      </div>
    </div>
  );
};
