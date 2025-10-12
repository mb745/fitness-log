import React from "react";
import type { WorkoutSessionDTO } from "../../types";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface HeroCardProps {
  session: WorkoutSessionDTO;
  onStart: () => Promise<void>;
  isStarting?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ session, onStart, isStarting }) => {
  if (!session) {
    return <Skeleton className="h-32 w-full" />;
  }

  const scheduledDate = new Date(session.scheduled_for).toLocaleString();

  return (
    <div className="border rounded-lg p-4 bg-background">
      <h2 className="text-xl font-semibold mb-2">{session.plan_name ?? "Workout"}</h2>
      <p className="text-muted-foreground mb-4">{scheduledDate}</p>
      <Button onClick={onStart} disabled={isStarting}>
        {isStarting ? "Starting..." : "Rozpocznij"}
      </Button>
    </div>
  );
};

export default HeroCard;
