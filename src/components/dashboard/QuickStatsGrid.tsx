import React from "react";
import StatTile from "./StatTile";
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
          <StatTile key={t.label} label={t.label} value={t.value} />
        )
      )}
    </div>
  );
};

export default QuickStatsGrid;
