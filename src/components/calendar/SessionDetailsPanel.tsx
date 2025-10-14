import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WorkoutSessionDetailDTO, WorkoutSessionDTO, WorkoutSessionStatus } from "../../types";
import {
  useStartSessionMutation,
  useDeleteSessionMutation,
  useAbandonSessionMutation,
} from "../../lib/hooks/workout-sessions";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

function getStatusBadge(status: WorkoutSessionStatus) {
  const statusConfig = {
    scheduled: { label: "Zaplanowany", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    in_progress: {
      label: "W trakcie",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    completed: { label: "Ukończony", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    abandoned: { label: "Porzucony", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };

  const config = statusConfig[status];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
}

interface SessionDetailsPanelProps {
  sessionId: number | null;
  open: boolean;
  onClose: () => void;
  onStart?: (session: WorkoutSessionDetailDTO) => void;
  onContinue?: (sessionId: number) => void;
}

export const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({
  sessionId,
  open,
  onClose,
  onStart,
  onContinue,
}) => {
  const [session, setSession] = useState<WorkoutSessionDTO | null>(null);

  // Fetch session details when sessionId changes
  const { data: sessionDetails, isLoading } = useQuery({
    queryKey: ["sessionDetails", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      return await fetchJson<WorkoutSessionDetailDTO>(`/api/v1/workout-sessions/${sessionId}`);
    },
    enabled: !!sessionId && open,
  });

  const startMutation = useStartSessionMutation();
  const deleteMutation = useDeleteSessionMutation();
  const abandonMutation = useAbandonSessionMutation();

  // Update local session state when data changes
  useEffect(() => {
    if (sessionDetails) {
      setSession(sessionDetails);
    }
  }, [sessionDetails]);

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      const result = await startMutation.mutateAsync(sessionId);
      onStart?.(result);
      onClose();
    } catch (error) {
      // Error handling will be done by mutation
      console.error("Failed to start session:", error);
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    try {
      await deleteMutation.mutateAsync(sessionId);
      onClose();
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleContinue = () => {
    if (!sessionId) return;
    onContinue?.(sessionId);
    onClose();
  };

  const handleAbandon = async () => {
    if (!sessionId) return;
    try {
      await abandonMutation.mutateAsync(sessionId);
      onClose();
    } catch (error) {
      console.error("Failed to abandon session:", error);
    }
  };

  if (!open || !sessionId) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Szczegóły treningu</SheetTitle>
          <SheetDescription>{sessionDetails?.plan_name || "Ładowanie..."}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 px-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          ) : session ? (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(session.status)}
              </div>

              {/* Scheduled date */}
              <div>
                <span className="text-sm font-medium">Data:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(session.scheduled_for).toLocaleDateString("pl-PL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Notes */}
              {session.notes && (
                <div>
                  <span className="text-sm font-medium">Notatki:</span>
                  <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                </div>
              )}

              {/* Exercises */}
              {sessionDetails?.sets && sessionDetails.sets.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Ćwiczenia:</span>
                  <div className="mt-2 space-y-3">
                    {(() => {
                      // Group sets by exercise name
                      const groupedSets = sessionDetails.sets.reduce(
                        (acc, set) => {
                          const key = set.exercise_name;
                          if (!acc[key]) {
                            acc[key] = [];
                          }
                          acc[key].push(set);
                          return acc;
                        },
                        {} as Record<string, typeof sessionDetails.sets>
                      );

                      return Object.entries(groupedSets).map(([exerciseName, sets]) => (
                        <div key={exerciseName} className="border rounded p-3">
                          <p className="font-medium text-sm mb-2">{exerciseName}</p>
                          <div className="space-y-1">
                            {sets.map((set) => (
                              <div key={set.id} className="text-sm text-muted-foreground pl-2">
                                Seria {set.set_number}:{" "}
                                {set.actual_reps ? `${set.actual_reps} powtórzeń` : "Nie wykonane"}
                                {set.weight_kg && ` • ${set.weight_kg}kg`}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {session.status === "scheduled" && (
                  <>
                    <Button onClick={handleStart} disabled={startMutation.isPending} className="w-full">
                      {startMutation.isPending ? "Rozpoczynanie..." : "Rozpocznij trening"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="w-full"
                    >
                      {deleteMutation.isPending ? "Usuwanie..." : "Odwołaj trening"}
                    </Button>
                  </>
                )}

                {session.status === "in_progress" && (
                  <>
                    <Button onClick={handleContinue} className="w-full">
                      Wróć do treningu
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAbandon}
                      disabled={abandonMutation.isPending}
                      className="w-full"
                    >
                      {abandonMutation.isPending ? "Porzucanie..." : "Porzuć trening"}
                    </Button>
                  </>
                )}

                {session.status === "completed" && (
                  <Button variant="outline" onClick={onClose} className="w-full">
                    Zamknij
                  </Button>
                )}

                {session.status === "abandoned" && (
                  <Button variant="outline" onClick={onClose} className="w-full">
                    Zamknij
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nie udało się załadować szczegółów sesji</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionDetailsPanel;
