import React from "react";
import type { WorkoutSessionDTO } from "../../types";
import { Button } from "../ui/button";

interface NamedWorkoutSession extends WorkoutSessionDTO {
  plan_name?: string;
}

interface ActiveWorkoutBannerProps {
  session: NamedWorkoutSession;
  progress: number; // 0-1
  onContinue: () => void;
}

const ActiveWorkoutBanner: React.FC<ActiveWorkoutBannerProps> = ({ session, progress, onContinue }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-lg">
      <div>
        <p className="font-medium">Aktywny trening: {session.plan_name ?? `ID ${session.id}`}</p>
        <div className="w-full bg-primary-foreground/20 h-2 rounded mt-1">
          <div className="bg-primary-foreground h-2 rounded" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </div>
      </div>
      <Button variant="secondary" onClick={onContinue}>
        Kontynuuj
      </Button>
    </div>
  );
};

export default ActiveWorkoutBanner;
