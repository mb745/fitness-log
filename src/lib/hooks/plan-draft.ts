import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WorkoutPlanCreateInput, PlanExerciseInput } from "../validation/workout-plan.validation";

export interface PlanDraftState {
  draft: WorkoutPlanCreateInput & { isDirty: boolean };
  setField<K extends keyof WorkoutPlanCreateInput>(key: K, value: WorkoutPlanCreateInput[K]): void;
  setExercises(exercises: PlanExerciseInput[]): void;
  markClean(): void;
  reset(): void;
}

const initialDraft: WorkoutPlanCreateInput & { isDirty: boolean } = {
  name: "",
  schedule_type: "weekly",
  schedule_days: [],
  schedule_interval_days: null,
  exercises: [],
  isDirty: false,
};

export const usePlanDraft = create<PlanDraftState>()(
  immer((set) => ({
    draft: initialDraft,
    setField: (key, value) =>
      set((state) => {
        // @ts-expect-error dynamic property assignment with zustand/immer
        state.draft[key] = value;
        state.draft.isDirty = true;
      }),
    setExercises: (exercises) =>
      set((state) => {
        state.draft.exercises = exercises;
        state.draft.isDirty = true;
      }),
    markClean: () =>
      set((state) => {
        state.draft.isDirty = false;
      }),
    reset: () =>
      set((state) => {
        state.draft = { ...initialDraft };
      }),
  }))
);
