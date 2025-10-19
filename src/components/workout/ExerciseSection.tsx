import { SessionSetRow } from "./SessionSetRow";
import type { SessionSetWithExerciseDTO } from "@/types";

interface ExerciseSectionProps {
  exerciseName: string;
  sets: SessionSetWithExerciseDTO[];
  restSeconds?: number;
  currentActiveSetId: number | null;
  pendingSetsCount: number;
}

/**
 * ExerciseSection Component
 * Groups sets for a single exercise with a header showing exercise name.
 * Displays all sets for the exercise in order.
 */
export function ExerciseSection({
  exerciseName,
  sets,
  restSeconds,
  currentActiveSetId,
  pendingSetsCount,
}: ExerciseSectionProps) {
  return (
    <section className="space-y-3" aria-labelledby={`exercise-${exerciseName.replace(/\s+/g, "-").toLowerCase()}`}>
      {/* Exercise header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
        <h3 id={`exercise-${exerciseName.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-semibold">
          {exerciseName}
        </h3>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* Sets list */}
      <div className="space-y-2" role="list" aria-label={`Serie dla ${exerciseName}`}>
        {sets.map((set) => {
          // Check if this is the last pending set
          const isLastPendingSet = pendingSetsCount === 1 && set.status === "pending";
          return (
            <div key={set.id} role="listitem">
              <SessionSetRow
                set={set}
                restSeconds={restSeconds}
                isCurrentActive={set.id === currentActiveSetId}
                isLastSet={isLastPendingSet}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
