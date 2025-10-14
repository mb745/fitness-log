import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveWorkoutStore } from "@/lib/hooks/active-workout-context";

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * RestTimer Component
 * Displays countdown timer for rest periods between sets.
 * Auto-starts after completing a set, with controls to pause, adjust, or skip.
 *
 * Features:
 * - Visual progress bar
 * - +30s / -30s adjustment buttons
 * - Pause/Resume toggle
 * - Skip button
 * - ARIA live region for accessibility
 */
export function RestTimer() {
  const { timer, pauseTimer, resumeTimer, skipTimer, adjustTimer, tickTimer } = useActiveWorkoutStore();

  // Tick timer every second when running
  useEffect(() => {
    if (!timer || !timer.isRunning) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, tickTimer]);

  if (!timer) return null;

  const progress = ((timer.initialSeconds - timer.remainingSeconds) / timer.initialSeconds) * 100;

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Przerwa</h3>
          <Button variant="ghost" size="sm" onClick={skipTimer} className="h-8 text-white hover:bg-white/20">
            Pomiń
          </Button>
        </div>

        {/* Timer Display with ARIA */}
        <div
          className="mb-3 text-center text-4xl font-bold tabular-nums"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatTime(timer.remainingSeconds)}
        </div>

        {/* Progress Bar */}
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Decrease time */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustTimer(-30)}
            disabled={timer.remainingSeconds < 30}
            className="h-9 text-white hover:bg-white/20"
          >
            -30s
          </Button>

          {/* Pause/Resume */}
          <Button
            variant="secondary"
            size="sm"
            onClick={timer.isRunning ? pauseTimer : resumeTimer}
            className="h-9 min-w-[80px]"
          >
            {timer.isRunning ? "Pauza" : "Wznów"}
          </Button>

          {/* Increase time */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => adjustTimer(30)}
            className="h-9 text-white hover:bg-white/20"
          >
            +30s
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
