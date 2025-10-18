import React from "react";
import { usePlanDraft } from "../../lib/hooks/plan-draft";
import { ExerciseLibraryModal } from "../modals/ExerciseLibraryModal";
import type { ExerciseDTO } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useQuery } from "@tanstack/react-query";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, idx }: { id: number; idx: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const { draft, setExercises } = usePlanDraft();
  const ex = draft.exercises[idx];
  // Fetch exercise details to display human-readable name instead of internal ID
  const { data: exercise } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/exercises/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load exercise ${id}`);
      return (await res.json()) as ExerciseDTO;
    },
    staleTime: 60_000,
  });

  const updateField = (field: "target_sets" | "target_reps" | "rest_seconds", value: number) => {
    const next = draft.exercises.map((exercise, i) => (i === idx ? { ...exercise, [field]: value } : exercise));
    setExercises(next);
  };

  const remove = () => {
    const next = draft.exercises.filter((_, i) => i !== idx).map((e, i) => ({ ...e, order_index: i }));
    setExercises(next);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border rounded p-3 mb-2 bg-white dark:bg-slate-800"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {exercise ? exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1) : `Ćwiczenie ID ${ex.exercise_id}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
          <button
            type="button"
            aria-label="Usuń ćwiczenie"
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={remove}
          >
            Usuń
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
        <label htmlFor={`sets-${idx}`}>
          Serie
          <Input
            id={`sets-${idx}`}
            type="number"
            min={1}
            step={1}
            value={ex.target_sets}
            onChange={(e) => updateField("target_sets", Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
        <label htmlFor={`reps-${idx}`}>
          Powtórzeń w serii
          <Input
            id={`reps-${idx}`}
            type="number"
            min={1}
            step={1}
            value={ex.target_reps}
            onChange={(e) => updateField("target_reps", Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
        <label htmlFor={`rest-${idx}`}>
          Odpoczynek (s)
          <Input
            id={`rest-${idx}`}
            type="number"
            min={0}
            step={30}
            value={ex.rest_seconds ?? 30}
            onChange={(e) => updateField("rest_seconds", Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
      </div>
    </div>
  );
}

export const StepExercises: React.FC = () => {
  const { draft, setExercises } = usePlanDraft();
  const [modalOpen, setModalOpen] = React.useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const addExercise = (exercise: ExerciseDTO) => {
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
        rest_seconds: 30,
        notes: null,
      },
    ];
    setExercises(next);
    setModalOpen(false);
  };

  return (
    <div>
      <Button className="mb-4" type="button" data-testid="add-exercises-button" onClick={() => setModalOpen(true)}>
        Dodaj ćwiczenia
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = draft.exercises.findIndex((e) => e.exercise_id === active.id);
          const newIndex = draft.exercises.findIndex((e) => e.exercise_id === over.id);
          const newArr = arrayMove(draft.exercises, oldIndex, newIndex).map((e, idx) => ({
            ...e,
            order_index: idx,
          }));
          setExercises(newArr);
        }}
      >
        <SortableContext items={draft.exercises.map((e) => e.exercise_id)} strategy={verticalListSortingStrategy}>
          {draft.exercises.map((ex, idx) => (
            <SortableItem key={ex.exercise_id} id={ex.exercise_id} idx={idx} />
          ))}
        </SortableContext>
        {draft.exercises.length === 0 && (
          <p className="text-center text-sm mt-4" data-testid="empty-exercises-message">
            Brak ćwiczeń – dodaj pierwsze, aby je skonfigurować.
          </p>
        )}
      </DndContext>

      <ExerciseLibraryModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addExercise} />
    </div>
  );
};

export default StepExercises;
