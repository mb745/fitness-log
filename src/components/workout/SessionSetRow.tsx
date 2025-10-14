import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { usePatchSet } from "@/lib/hooks/active-workout";
import { useActiveWorkoutStore } from "@/lib/hooks/active-workout-context";
import { RestTimer } from "./RestTimer";
import type { SessionSetDTO } from "@/types";
import { useToast } from "@/lib/hooks/use-toast";

interface SessionSetRowProps {
  set: SessionSetDTO;
  restSeconds?: number;
  isCurrentActive: boolean;
  isLastSet: boolean;
}

/**
 * SessionSetRow Component
 * Displays a single set row with inputs for reps and weight.
 * Features:
 * - Number inputs for reps and weight
 * - Complete (✓) and Skip (⊘) buttons
 * - Auto-save with debounce (500ms)
 * - Optimistic updates
 * - Validation (reps ≥ 0, weight ≥ 0)
 * - Auto-start rest timer on complete
 * - Only allows editing of current active set
 */
export function SessionSetRow({ set, restSeconds = 90, isCurrentActive, isLastSet }: SessionSetRowProps) {
  const { toast } = useToast();
  const { mutate: patchSet } = usePatchSet();
  const { timer, startTimer, addToOfflineQueue } = useActiveWorkoutStore();

  // Local state for inputs (controlled components)
  const [reps, setReps] = useState(set.actual_reps?.toString() ?? "");
  const [weight, setWeight] = useState(set.weight_kg?.toString() ?? "");

  // Track if timer just finished for this set (to show notification)
  const [showTimerFinished, setShowTimerFinished] = useState(false);
  const previousTimerRef = useRef(timer);

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update local state when set prop changes (from optimistic update)
  useEffect(() => {
    setReps(set.actual_reps?.toString() ?? "");
    setWeight(set.weight_kg?.toString() ?? "");
  }, [set.actual_reps, set.weight_kg]);

  // Detect when timer finishes and this becomes the active set
  useEffect(() => {
    const hadTimer = previousTimerRef.current !== null;
    const nowNoTimer = timer === null;
    const isPendingStatus = set.status === "pending";

    if (hadTimer && nowNoTimer && isCurrentActive && isPendingStatus) {
      // Timer just finished and this is now the active set
      setShowTimerFinished(true);

      // Hide the notification after 5 seconds
      const timeout = setTimeout(() => {
        setShowTimerFinished(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }

    previousTimerRef.current = timer;
  }, [timer, isCurrentActive, set.status]);

  /**
   * Debounced auto-save for inputs
   */
  const debouncedSave = useCallback(
    (field: "actual_reps" | "weight_kg", value: string) => {
      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        const numValue = parseFloat(value);

        // Validate
        if (isNaN(numValue) || numValue < 0) {
          return;
        }

        // Send update
        const updates = {
          [field]: field === "actual_reps" ? Math.floor(numValue) : numValue,
        };

        patchSet(
          {
            setId: set.id,
            updates,
          },
          {
            onError: (error) => {
              console.error("Failed to update set:", error);

              // Add to offline queue if network error
              if (!navigator.onLine) {
                addToOfflineQueue(set.id, updates);
                toast({
                  title: "Offline",
                  description: "Zmiany zapisane lokalnie i zostaną zsynchronizowane później.",
                });
              } else {
                toast({
                  variant: "destructive",
                  title: "Błąd",
                  description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
                });
              }
            },
          }
        );
      }, 500);
    },
    [set.id, patchSet, toast, addToOfflineQueue]
  );

  /**
   * Handle reps input change
   */
  const handleRepsChange = (value: string) => {
    // Allow empty string or valid numbers
    if (value === "" || /^\d+$/.test(value)) {
      setReps(value);
      if (value !== "") {
        debouncedSave("actual_reps", value);
      }
    }
  };

  /**
   * Handle weight input change
   */
  const handleWeightChange = (value: string) => {
    // Allow empty string or valid decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setWeight(value);
      if (value !== "") {
        debouncedSave("weight_kg", value);
      }
    }
  };

  /**
   * Mark set as completed
   */
  const handleComplete = () => {
    // Validate that reps are provided
    const repsNum = parseInt(reps, 10);
    if (!reps || isNaN(repsNum) || repsNum < 0) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Podaj liczbę powtórzeń aby ukończyć serię.",
      });
      return;
    }

    const updates = {
      status: "completed" as const,
      actual_reps: repsNum,
      weight_kg: weight ? parseFloat(weight) : undefined,
    };

    patchSet(
      {
        setId: set.id,
        updates,
      },
      {
        onSuccess: () => {
          // Start rest timer only if this is not the last set
          if (!isLastSet) {
            startTimer(set.id, restSeconds);
          }
        },
        onError: (error) => {
          console.error("Failed to complete set:", error);

          // Add to offline queue if network error
          if (!navigator.onLine) {
            addToOfflineQueue(set.id, updates);
            toast({
              title: "Offline",
              description: "Serie ukończone lokalnie. Zostanie zsynchronizowane później.",
            });
            // Still start timer for better UX (only if not last set)
            if (!isLastSet) {
              startTimer(set.id, restSeconds);
            }
          } else {
            toast({
              variant: "destructive",
              title: "Błąd",
              description: "Nie udało się ukończyć serii. Spróbuj ponownie.",
            });
          }
        },
      }
    );
  };

  /**
   * Mark set as skipped
   */
  const handleSkip = () => {
    const updates = {
      status: "skipped" as const,
    };

    patchSet(
      {
        setId: set.id,
        updates,
      },
      {
        onError: (error) => {
          console.error("Failed to skip set:", error);

          // Add to offline queue if network error
          if (!navigator.onLine) {
            addToOfflineQueue(set.id, updates);
            toast({
              title: "Offline",
              description: "Serie pominięte lokalnie. Zostanie zsynchronizowane później.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Błąd",
              description: "Nie udało się pominąć serii. Spróbuj ponownie.",
            });
          }
        },
      }
    );
  };

  const isCompleted = set.status === "completed";
  const isSkipped = set.status === "skipped";
  const isPending = set.status === "pending";

  // Check if timer should be shown for this set
  const showTimer = timer && timer.triggeredBySetId === set.id;

  // Determine if inputs should be disabled
  const isDisabled = !isPending || !isCurrentActive;

  // Debug logging (remove in production)
  if (isPending) {
    console.log(`Set ${set.id} (${set.set_number}):`, {
      isPending,
      isCurrentActive,
      isDisabled,
      status: set.status,
      isLastSet,
    });
  }

  return (
    <>
      {/* Timer finished notification */}
      {showTimerFinished && isCurrentActive && (
        <div className="mb-2 rounded-lg bg-green-100 border border-green-300 p-3 text-center text-sm font-medium text-green-800 animate-pulse">
          ⏰ Przerwa zakończona! Czas na kolejną serię
        </div>
      )}

      <div
        className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
          isCompleted
            ? "border-green-500 bg-green-50"
            : isSkipped
              ? "border-gray-300 bg-gray-50 opacity-60"
              : isCurrentActive && isPending
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md"
                : "border-border opacity-50"
        }`}
      >
        {/* Set number */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
          {set.set_number}
        </div>

        {/* Target info */}
        <div className="min-w-[80px] text-sm text-muted-foreground">Cel: {set.target_reps} rep</div>

        {/* Inputs */}
        <div className="flex flex-1 gap-2">
          {/* Reps input */}
          <div className="flex-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Reps"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              disabled={isDisabled}
              className="h-10"
              aria-label="Liczba powtórzeń"
            />
          </div>

          {/* Weight input */}
          <div className="flex-1">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="kg"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              disabled={isDisabled}
              className="h-10"
              aria-label="Waga w kilogramach"
            />
          </div>
        </div>

        {/* Action buttons */}
        {isPending && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="default"
              size="icon"
              onClick={handleComplete}
              disabled={!isCurrentActive}
              className="h-10 w-10 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ukończ serię"
            >
              <Check className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              disabled={!isCurrentActive}
              className="h-10 w-10 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Pomiń serię"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Status badges with live region */}
        {isCompleted && (
          <div
            className="shrink-0 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white"
            role="status"
            aria-live="polite"
          >
            Ukończone
          </div>
        )}
        {isSkipped && (
          <div
            className="shrink-0 rounded-full bg-gray-400 px-3 py-1 text-xs font-medium text-white"
            role="status"
            aria-live="polite"
          >
            Pominięte
          </div>
        )}
      </div>

      {/* Rest Timer - shown below completed set */}
      {showTimer && (
        <div className="mt-3">
          <RestTimer />
        </div>
      )}
    </>
  );
}
