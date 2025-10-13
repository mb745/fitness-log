import React from "react";
import { usePlanDraft } from "../../lib/hooks/plan-draft";

export const StepSummary: React.FC = () => {
  const { draft } = usePlanDraft();
  const totalSeries = draft.exercises.reduce((acc, e) => acc + e.target_sets, 0);
  // Rest applies between sets, so (sets - 1) intervals per exercise
  const totalRestSeconds = draft.exercises.reduce(
    (acc, e) => acc + (e.rest_seconds ?? 0) * Math.max(e.target_sets - 1, 0),
    0
  );
  const estimatedMinutes = Math.ceil((totalSeries * 60 + totalRestSeconds) / 60);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Podsumowanie planu</h2>
      <p>Nazwa: {draft.name}</p>
      <p>Liczba ćwiczeń: {draft.exercises.length}</p>
      <p>Łącznie serii: {totalSeries}</p>
      <p>Szacowany czas (bez rozgrzewki): ~{estimatedMinutes} min</p>
    </div>
  );
};
