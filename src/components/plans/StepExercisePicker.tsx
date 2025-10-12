import React from "react";
import { usePlanDraft } from "../../lib/hooks/plan-draft";
import { ExerciseLibraryModal } from "../modals/ExerciseLibraryModal";
import type { ExerciseDTO } from "../../types";
import { Button } from "../ui/button";

export const StepExercisePicker: React.FC = () => {
  const { draft, setExercises } = usePlanDraft();
  const [modalOpen, setModalOpen] = React.useState(false);

  const addExercise = (exercise: ExerciseDTO) => {
    // Prevent duplicates
    if (draft.exercises.some((e) => e.exercise_id === exercise.id)) {
      setModalOpen(false);
      return;
    }
    const next = [
      ...draft.exercises,
      {
        exercise_id: exercise.id,
        order_index: draft.exercises.length,
        target_sets: 3,
        target_reps: 10,
        rest_seconds: null,
        notes: null,
      },
    ];
    setExercises(next);
    setModalOpen(false);
  };

  const remove = (idx: number) => {
    const next = draft.exercises.filter((_, i) => i !== idx).map((ex, i) => ({ ...ex, order_index: i }));
    setExercises(next);
  };

  return (
    <div>
      {/* Prevent form submission – we only want to open the modal */}
      <Button type="button" onClick={() => setModalOpen(true)}>
        Dodaj ćwiczenia
      </Button>

      <ul className="mt-4 space-y-2">
        {draft.exercises.map((ex, idx) => (
          <li key={idx} className="border rounded p-2 flex justify-between items-center">
            <span>
              #{idx + 1} – ćwiczenie ID {ex.exercise_id}
            </span>
            <button className="text-red-500 text-sm" onClick={() => remove(idx)}>
              Usuń
            </button>
          </li>
        ))}
      </ul>

      <ExerciseLibraryModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addExercise} />
    </div>
  );
};
