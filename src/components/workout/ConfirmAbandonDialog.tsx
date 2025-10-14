import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmAbandonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * ConfirmAbandonDialog Component
 * Confirmation dialog for abandoning workout session.
 * Warns user that progress will be lost.
 */
export function ConfirmAbandonDialog({ open, onOpenChange, onConfirm, isPending }: ConfirmAbandonDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Porzucić trening?</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz porzucić ten trening? Ta akcja jest nieodwracalna, a postęp zostanie zapisany jako
            &quot;porzucony&quot;.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Porzucanie..." : "Porzuć trening"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
