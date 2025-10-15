import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useActiveWorkout, useUpcomingWorkout, useQuickStats } from "../../lib/hooks/workout-dashboard";
import { useActiveWorkoutPlan } from "../../lib/hooks/workout-plans";
import HeroCard from "./HeroCard";
import ActiveWorkoutBanner from "./ActiveWorkoutBanner";
import QuickStatsGrid from "./QuickStatsGrid";
import CalendarPage from "../calendar/CalendarPage";

const DashboardPageInner: React.FC = () => {
  const { data: activeSession } = useActiveWorkout();
  const { data: upcomingSession } = useUpcomingWorkout();
  const { data: stats, isLoading: statsLoading } = useQuickStats();
  const { data: activePlan } = useActiveWorkoutPlan();
  // const { data: lastCompleted } = useLastCompletedWorkout();

  const handleStart = async () => {
    if (!upcomingSession) return;
    await fetch(`/api/v1/workout-sessions/${upcomingSession.id}/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    window.location.href = `/workout/${upcomingSession.id}/active`;
  };

  return (
    <div className={`container mx-auto py-8 space-y-6 ${activeSession ? "pb-32" : ""}`}>
      {/* Upcoming workout info - removed duplicate lightweight card (HeroCard covers it) */}

      {activeSession && (
        <ActiveWorkoutBanner
          session={activeSession}
          progress={0}
          onContinue={() => (window.location.href = `/workout/${activeSession.id}/active`)}
        />
      )}

      {!activeSession && upcomingSession && (
        <HeroCard session={upcomingSession} onStart={handleStart} isStarting={false} />
      )}

      {stats && <QuickStatsGrid stats={stats} isLoading={statsLoading} />}

      {/* Info when no active plan */}
      {!activePlan && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-2">
          <h3 className="text-xl font-semibold">Brak zaplanowanych treningów</h3>
          <p className="text-muted-foreground">
            Dodaj nowy plan treningowy w {""}
            <a href="/plans/new" className="text-primary hover:underline">
              kreatorze planów treningowych
            </a>
          </p>
        </div>
      )}

      {/* Calendar Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kalendarz treningów</h2>
          <p className="text-muted-foreground mt-2">
            Zarządzaj swoimi treningami - przeglądaj zaplanowane, trwające i ukończone sesje.
          </p>
        </div>
        <CalendarPage />
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPageInner />
    </QueryClientProvider>
  );
};

export default DashboardPage;
