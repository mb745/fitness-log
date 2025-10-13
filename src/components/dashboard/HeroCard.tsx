import React from "react";
import type { WorkoutSessionDTO } from "../../types";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface HeroCardProps {
  session: WorkoutSessionDTO & { plan_name?: string };
  onStart: () => Promise<void>;
  isStarting?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({ session, onStart, isStarting }) => {
  if (!session) {
    return <Skeleton className="h-32 w-full" />;
  }

  const scheduledDate = new Date(session.scheduled_for).toLocaleDateString();

  return (
    <div className="border rounded-lg p-4 bg-background space-y-1">
      <p>
        <span className="font-medium">Nazwa treningu:</span> {session.plan_name ?? "Trening"}
      </p>
      <p className="text-muted-foreground">
        <span className="font-medium">Data najbliższej sesji:</span> {scheduledDate}
      </p>
      <Button onClick={onStart} disabled={isStarting}>
        {isStarting ? "Starting..." : "Rozpocznij"}
      </Button>
    </div>
  );
};

export default HeroCard;
