import React from "react";
import type { QuickStatsVM } from "../../lib/hooks/workout-dashboard";
import { Skeleton } from "../ui/skeleton";

interface QuickStatsGridProps {
  stats: QuickStatsVM;
  isLoading?: boolean;
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats, isLoading }) => {
  const tiles = [
    { label: "Treningi w tygodniu", value: stats.weeklyCount },
    { label: "Treningi w miesiącu", value: stats.monthlyCount },
    { label: "Streak dni", value: stats.streak },
    { label: "Aktywne plany", value: stats.plansActive },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((t) =>
        isLoading ? (
          <Skeleton key={t.label} className="h-24 w-full" />
        ) : (
          <div
            key={t.label}
            className="rounded-lg border p-4 flex flex-col items-center justify-center text-center bg-card"
          >
            <span className="text-3xl font-bold mb-1" data-testid="stat-value">
              {t.value}
            </span>
            <span className="text-sm text-muted-foreground" data-testid="stat-label">
              {t.label}
            </span>
          </div>
        )
      )}
    </div>
  );
};

export default QuickStatsGrid;
