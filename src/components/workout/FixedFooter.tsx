import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface FixedFooterProps {
  onFinish: () => void;
  disabled?: boolean;
  pendingSetsCount: number;
}

/**
 * FixedFooter Component
 * Sticky footer at bottom of active workout view (mobile).
 * Shows finish workout button.
 *
 * On desktop, this is shown inline at the bottom of content.
 */
export function FixedFooter({ onFinish, disabled, pendingSetsCount }: FixedFooterProps) {
  return (
    <footer className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <Button onClick={onFinish} disabled={disabled} size="lg" className="w-full gap-2 text-base font-semibold">
          <CheckCircle className="h-5 w-5" />
          Zakończ trening
          {pendingSetsCount > 0 && (
            <span className="ml-1 text-sm font-normal opacity-80">({pendingSetsCount} serii nie ukończonych)</span>
          )}
        </Button>
      </div>
    </footer>
  );
}
