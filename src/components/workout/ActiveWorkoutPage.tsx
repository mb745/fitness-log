import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FixedHeader } from "./FixedHeader";
import { FixedFooter } from "./FixedFooter";
import { ExerciseSection } from "./ExerciseSection";
import { ConfirmAbandonDialog } from "./ConfirmAbandonDialog";
import { ConfirmFinishDialog } from "./ConfirmFinishDialog";
import { OfflineBanner } from "./OfflineBanner";
import { useActiveSession, useCompleteSession, useAbandonSessionForActive } from "@/lib/hooks/active-workout";
import { useActiveWorkoutStore } from "@/lib/hooks/active-workout-context";
import { useOfflineSync } from "@/lib/hooks/use-offline-sync";
import { useToast } from "@/lib/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionSetWithExerciseDTO } from "@/types";

const queryClient = new QueryClient();

interface ActiveWorkoutPageProps {
  sessionId: number;
}

/**
 * ActiveWorkoutPage Component
 * Main view for active workout session.
 *
 * Features:
 * - Real-time set tracking with auto-save
 * - Rest timer management
 * - Progress tracking
 * - Offline support with queue
 * - Complete/Abandon workflows with confirmation
 * - Redirect on invalid session status
 */
export function ActiveWorkoutPage({ sessionId }: ActiveWorkoutPageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveWorkoutPageContent sessionId={sessionId} />
    </QueryClientProvider>
  );
}

function ActiveWorkoutPageContent({ sessionId }: ActiveWorkoutPageProps) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  // Fetch session data
  const { data: session, isLoading, error } = useActiveSession(sessionId);

  // Mutations
  const completeMutation = useCompleteSession();
  const abandonMutation = useAbandonSessionForActive();

  // Store actions
  const { setSession, clearSession } = useActiveWorkoutStore();

  // Offline sync
  useOfflineSync();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update store when session data changes
  useEffect(() => {
    if (session) {
      setSession(session);
    }
  }, [session, setSession]);

  // Redirect if session is not in_progress
  useEffect(() => {
    if (session && session.status !== "in_progress") {
      toast({
        variant: "destructive",
        title: "Sesja niedostępna",
        description: "Ta sesja nie jest już aktywna. Status: " + session.status,
      });
      window.location.href = "/dashboard";
    }
  }, [session, toast]);

  // Handle error states
  useEffect(() => {
    if (error) {
      const errorCode = error.message;
      if (errorCode === "403" || errorCode === "404") {
        toast({
          variant: "destructive",
          title: "Błąd dostępu",
          description: "Nie masz dostępu do tej sesji lub sesja nie istnieje.",
        });
        window.location.href = "/dashboard";
      }
    }
  }, [error, toast]);

  /**
   * Handle back button
   */
  const handleBack = () => {
    window.location.href = "/dashboard";
  };

  /**
   * Handle abandon button (show confirmation)
   */
  const handleAbandonClick = () => {
    setShowAbandonDialog(true);
  };

  /**
   * Handle abandon confirmation
   */
  const handleAbandonConfirm = () => {
    abandonMutation.mutate(sessionId, {
      onSuccess: () => {
        clearSession();
        toast({
          title: "Trening porzucony",
          description: "Sesja treningowa została porzucona.",
        });
        window.location.href = "/dashboard";
      },
      onError: (error) => {
        console.error("Failed to abandon session:", error);
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się porzucić treningu. Spróbuj ponownie.",
        });
      },
    });
  };

  /**
   * Handle finish button (show confirmation)
   */
  const handleFinishClick = () => {
    setShowFinishDialog(true);
  };

  /**
   * Handle finish confirmation
   */
  const handleFinishConfirm = () => {
    completeMutation.mutate(sessionId, {
      onSuccess: () => {
        clearSession();
        toast({
          title: "Trening ukończony!",
          description: "Gratulacje! Sesja treningowa została zakończona.",
        });
        window.location.href = "/dashboard";
      },
      onError: (error) => {
        const errorCode = error.message;
        if (errorCode === "422") {
          toast({
            variant: "destructive",
            title: "Nie można zakończyć",
            description: "Wszystkie serie muszą być ukończone lub pominięte.",
          });
        } else {
          console.error("Failed to complete session:", error);
          toast({
            variant: "destructive",
            title: "Błąd",
            description: "Nie udało się zakończyć treningu. Spróbuj ponownie.",
          });
        }
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-20 border-b bg-background p-4">
          <Skeleton className="h-8 w-48 mx-auto mb-3" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="container mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state (shouldn't reach here due to useEffect redirects)
  if (error || !session) {
    return null;
  }

  // Group sets by exercise
  const exerciseGroups = session.sets.reduce(
    (acc, set) => {
      const exerciseName = set.exercise_name;
      if (!acc[exerciseName]) {
        acc[exerciseName] = [];
      }
      acc[exerciseName].push(set);
      return acc;
    },
    {} as Record<string, SessionSetWithExerciseDTO[]>
  );

  const exerciseList = Object.entries(exerciseGroups);

  // Calculate pending sets count
  const pendingSetsCount = session.sets.filter((set) => set.status === "pending").length;

  // Get default rest time (could be from plan settings in future)
  const defaultRestSeconds = 90;

  // Find current active set (first pending set)
  const currentActiveSetId = session.sets.find((set) => set.status === "pending")?.id || null;

  // Debug logging (remove in production)
  console.log("Active workout render:", {
    sessionId: session.id,
    totalSets: session.sets.length,
    pendingSets: pendingSetsCount,
    currentActiveSetId,
    setStatuses: session.sets.map((s) => ({ id: s.id, status: s.status })),
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Fixed Header */}
      <FixedHeader
        planName={session.plan_name}
        sets={session.sets}
        onBack={handleBack}
        onAbandon={handleAbandonClick}
      />

      {/* Offline Banner */}
      {!isOnline && <OfflineBanner />}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Exercise List */}
        <div className="space-y-8">
          {exerciseList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Brak ćwiczeń w tym treningu.</p>
            </div>
          ) : (
            exerciseList.map(([exerciseName, sets]) => (
              <ExerciseSection
                key={exerciseName}
                exerciseName={exerciseName}
                sets={sets}
                restSeconds={defaultRestSeconds}
                currentActiveSetId={currentActiveSetId}
                totalSetsCount={session.sets.length}
                pendingSetsCount={pendingSetsCount}
              />
            ))
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <FixedFooter
        onFinish={handleFinishClick}
        disabled={completeMutation.isPending || abandonMutation.isPending}
        pendingSetsCount={pendingSetsCount}
      />

      {/* Confirmation Dialogs */}
      <ConfirmAbandonDialog
        open={showAbandonDialog}
        onOpenChange={setShowAbandonDialog}
        onConfirm={handleAbandonConfirm}
        isPending={abandonMutation.isPending}
      />

      <ConfirmFinishDialog
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
        onConfirm={handleFinishConfirm}
        isPending={completeMutation.isPending}
        pendingSetsCount={pendingSetsCount}
      />
    </div>
  );
}
