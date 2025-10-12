import React from "react";
import { usePlanDraft } from "../../lib/hooks/plan-draft";

export const StepSummary: React.FC = () => {
  const { draft } = usePlanDraft();
  const totalSets = draft.exercises.reduce((acc, e) => acc + e.target_sets, 0);
  const avgRest = draft.exercises.reduce((acc, e) => acc + (e.rest_seconds ?? 60), 0) / (draft.exercises.length || 1);
  const estimatedMinutes = Math.ceil((totalSets * avgRest) / 60);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Podsumowanie planu</h2>
      <p>Nazwa: {draft.name}</p>
      <p>Liczba ćwiczeń: {draft.exercises.length}</p>
      <p>Łącznie serii: {totalSets}</p>
      <p>Szacowany czas (bez rozgrzewki): ~{estimatedMinutes} min</p>
    </div>
  );
};
