import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import type { SessionSetDTO } from "@/types";

interface FixedHeaderProps {
  planName: string;
  sets: SessionSetDTO[];
  onBack: () => void;
  onAbandon: () => void;
}

/**
 * FixedHeader Component
 * Sticky header at top of active workout view.
 * Shows:
 * - Back button
 * - Plan name
 * - Progress bar
 * - Abandon button
 */
export function FixedHeader({ planName, sets, onBack, onAbandon }: FixedHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        {/* Top row: Back button, title, abandon button */}
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Powrót</span>
          </Button>

          <h1 className="text-lg font-bold">{planName}</h1>

          <Button
            variant="ghost"
            size="sm"
            onClick={onAbandon}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Porzuć</span>
          </Button>
        </div>

        {/* Progress bar */}
        <ProgressBar sets={sets} />
      </div>
    </header>
  );
}
