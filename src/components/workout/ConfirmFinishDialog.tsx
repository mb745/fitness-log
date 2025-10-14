import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  pendingSetsCount: number;
}

/**
 * ConfirmFinishDialog Component
 * Confirmation dialog for completing workout session.
 * Shows warning if not all sets are completed.
 */
export function ConfirmFinishDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  pendingSetsCount,
}: ConfirmFinishDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    // Only close on success (handled by parent)
  };

  const hasUnfinishedSets = pendingSetsCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zakończyć trening?</DialogTitle>
          <DialogDescription>
            {hasUnfinishedSets ? (
              <>
                <span className="text-yellow-600 font-semibold">
                  Uwaga: {pendingSetsCount}{" "}
                  {pendingSetsCount === 1 ? "seria nie jest ukończona" : "serii nie jest ukończonych"}.
                </span>
                <br />
                Aby zakończyć trening, wszystkie serie muszą być oznaczone jako ukończone lub pominięte.
              </>
            ) : (
              "Czy na pewno chcesz zakończyć ten trening? Postęp zostanie zapisany."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {hasUnfinishedSets ? "Wróć do treningu" : "Anuluj"}
          </Button>
          {!hasUnfinishedSets && (
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Kończenie..." : "Zakończ trening"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
