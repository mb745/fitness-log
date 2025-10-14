import { useToasts } from "@/lib/hooks/use-toast";
import { X } from "lucide-react";

/**
 * Toaster Component
 * Renders all active toast notifications.
 * Should be placed at the root of the application.
 */
export function Toaster() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all animate-in fade-in zoom-in ${
            toast.variant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border bg-background text-foreground"
          }`}
        >
          <div className="grid gap-1">
            {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
            {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
          </div>
          <button
            className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            onClick={() => {
              // Toast auto-removes, but user can manually dismiss
              const event = new CustomEvent("dismiss-toast", { detail: { id: toast.id } });
              window.dispatchEvent(event);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
