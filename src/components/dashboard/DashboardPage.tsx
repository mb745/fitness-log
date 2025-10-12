import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useActiveWorkout,
  useUpcomingWorkout,
  useQuickStats,
  useLastCompletedWorkout,
} from "../../lib/hooks/workout-dashboard";
import HeroCard from "./HeroCard";
import ActiveWorkoutBanner from "./ActiveWorkoutBanner";
import QuickStatsGrid from "./QuickStatsGrid";
import WorkoutSummaryCard from "./WorkoutSummaryCard";
import { Button } from "../ui/button";

const DashboardPageInner: React.FC = () => {
  const { data: activeSession } = useActiveWorkout();
  const { data: upcomingSession } = useUpcomingWorkout();
  const { data: stats, isLoading: statsLoading } = useQuickStats();
  const { data: lastCompleted } = useLastCompletedWorkout();

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
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Panel użytkownika</h1>
      {/* Navigation buttons */}
      <div className="flex gap-3 mb-4">
        <Button asChild size="sm">
          <a href="/plans/new">Nowy plan</a>
        </Button>
        <Button variant="secondary" asChild size="sm">
          <a href="/plans">Moje plany</a>
        </Button>
      </div>

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

      {lastCompleted && <WorkoutSummaryCard session={lastCompleted} />}
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
