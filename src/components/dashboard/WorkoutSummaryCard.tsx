import React from "react";
import type { WorkoutSessionDTO } from "../../types";
import { Button } from "../ui/button";

interface WorkoutSummaryCardProps {
  session: WorkoutSessionDTO;
}

const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({ session }) => {
  const completedAt = new Date(
    session.completed_at ?? session.updated_at ?? session.scheduled_for
  ).toLocaleDateString();
  return (
    <div className="border rounded-lg p-4 bg-background">
      <h3 className="text-lg font-semibold mb-2">Ostatni trening – {completedAt}</h3>
      <ul className="text-sm mb-4">
        <li>Czas trwania: {session.duration_minutes ?? "-"} min</li>
        <li>Volume: {session.total_volume_kg ?? "-"} kg</li>
      </ul>
      <Button variant="outline" onClick={() => (window.location.href = `/history/${session.id}`)}>
        Szczegóły
      </Button>
    </div>
  );
};

export default WorkoutSummaryCard;
