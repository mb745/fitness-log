import React from "react";
import { usePlanDraft } from "../../lib/hooks/plan-draft";
import { workoutPlanCreateSchema } from "../../lib/validation/workout-plan.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { WorkoutPlanCreateInput } from "../../lib/validation/workout-plan.validation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// Combined add & configure step
import { StepExercises } from "./StepExercises";
import { StepSummary } from "./StepSummary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast } from "../ui/toast";

const steps = ["Podstawy", "Ćwiczenia", "Podsumowanie"] as const;

const PlanWizardInner: React.FC = () => {
  const { draft, setField, markClean } = usePlanDraft();
  const [stepIdx, setStepIdx] = React.useState(0);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const form = useForm<WorkoutPlanCreateInput>({
    resolver: zodResolver(workoutPlanCreateSchema),
    defaultValues: draft,
    mode: "onChange",
  });

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  // Autosave removed – plan zapisujemy dopiero na ostatnim kroku

  React.useEffect(() => {
    const sub = form.watch((value) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Object.keys(value) as (keyof WorkoutPlanCreateInput)[]).forEach((k) => setField(k, value[k] as any));
    });
    return () => sub.unsubscribe();
  }, [form, setField]);

  const StepBasics = (
    <>
      {/* Hidden input to fix schedule_type as 'weekly' */}
      <input type="hidden" value="weekly" {...form.register("schedule_type")} />
      <div className="mb-4">
        <label htmlFor="plan-name" className="block text-sm mb-1">
          Nazwa planu
        </label>
        <Input id="plan-name" {...form.register("name", { required: true })} />
        {form.formState.errors.name && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Schedule days – always visible (weekly schedule) */}
      <div className="mb-4">
        <span className="block text-sm mb-1">Dni treningowe</span>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Pn", value: 1 },
            { label: "Wt", value: 2 },
            { label: "Śr", value: 3 },
            { label: "Cz", value: 4 },
            { label: "Pt", value: 5 },
            { label: "So", value: 6 },
            { label: "Nd", value: 0 },
          ].map((day) => (
            <label key={day.value} className="flex items-center space-x-1 text-sm">
              <input type="checkbox" value={day.value} {...form.register("schedule_days")} className="accent-primary" />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
        {form.formState.errors.schedule_days && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.schedule_days.message as string}</p>
        )}
      </div>
    </>
  );

  const renderStep = () => {
    switch (stepIdx) {
      case 0:
        return StepBasics;
      case 1:
        return <StepExercises />;
      case 2:
        return <StepSummary />;
      default:
        return <p>Placeholder</p>;
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      {/* StepperHeader */}
      <ol className="flex mb-6">
        {steps.map((label, idx) => (
          <li key={label} className={`flex-1 text-center ${idx === stepIdx ? "font-bold" : "text-muted-foreground"}`}>
            {label}
          </li>
        ))}
      </ol>

      {/*
        Submit behavior:
        • On the first step we don't require the full schema (which expects exercises),
          so we bypass schema validation and just advance to the next step.
        • From the second step onwards we use the normal react-hook-form `handleSubmit`,
          which validates against the full schema.
      */}
      <form
        onSubmit={async (e) => {
          if (stepIdx < steps.length - 1) {
            // Bypass full schema validation for intermediary steps
            e.preventDefault();
            next();
            return;
          }

          // Final step – validate required form fields first (e.g. name)
          e.preventDefault();

          // Validate schedule specific fields client-side so we don’t send invalid payloads
          const extraFields: (keyof WorkoutPlanCreateInput)[] = ["schedule_days"];

          const isValid = await form.trigger(["name", "schedule_type", ...extraFields]);
          if (!isValid) {
            const missing = Object.keys(form.formState.errors)
              .map((k) => {
                switch (k) {
                  case "name":
                    return "Nazwa planu";
                  case "schedule_days":
                    return "Dni treningowe";
                  case "schedule_interval_days":
                    return "Interwał dni";
                  default:
                    return k;
                }
              })
              .join(", ");

            setToastMessage(`Uzupełnij wymagane pola: ${missing}`);
            setStepIdx(0);
            return; // Validation errors are displayed by RHF
          }

          try {
            // Cast schedule_days to number[] if present (RHF stores strings)
            const payload = {
              ...draft,
              schedule_days: draft.schedule_days?.map((d) => Number(d)) ?? null,
              schedule_type: "weekly",
            } as WorkoutPlanCreateInput;

            const res = await fetch("/api/v1/workout-plans", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              credentials: "include",
            });
            if (!res.ok) throw new Error(String(res.status));
            markClean();
            setToastMessage("Plan utworzony pomyślnie!");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to create plan", error);
            setToastMessage("Nie udało się zapisać planu. Spróbuj ponownie.");
          }
        }}
      >
        {renderStep()}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="secondary" disabled={stepIdx === 0} onClick={back}>
            Wstecz
          </Button>
          <Button type="submit" disabled={stepIdx === steps.length - 1 && draft.exercises.length === 0}>
            {stepIdx === steps.length - 1 ? "Zakończ" : "Dalej"}
          </Button>
        </div>
      </form>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export const PlanWizard: React.FC = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PlanWizardInner />
    </QueryClientProvider>
  );
};

export default PlanWizard;
