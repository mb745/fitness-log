import type { SessionSetDTO } from "@/types";

interface ProgressBarProps {
  sets: SessionSetDTO[];
}

/**
 * ProgressBar Component
 * Displays workout progress as completed/skipped sets out of total sets.
 * Shows visual progress bar and text status.
 */
export function ProgressBar({ sets }: ProgressBarProps) {
  const totalSets = sets.length;
  const completedSets = sets.filter((set) => set.status === "completed" || set.status === "skipped").length;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Text status */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Postęp treningu</span>
        <span className="text-muted-foreground">
          {completedSets} / {totalSets} serii
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={completedSets}
          aria-valuemin={0}
          aria-valuemax={totalSets}
          aria-label={`${completedSets} z ${totalSets} serii ukończonych`}
        />
      </div>
    </div>
  );
}
