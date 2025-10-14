import { create } from "zustand";

/**
 * Toast variant types
 */
export type ToastVariant = "default" | "destructive";

/**
 * Toast item interface
 */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

/**
 * Toast store state
 */
interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

/**
 * Global toast store using zustand
 */
const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/**
 * Hook: useToast
 * Provides toast notification functionality.
 *
 * @example
 * const { toast } = useToast();
 * toast({ title: "Success", description: "Item saved" });
 * toast({ title: "Error", description: "Failed", variant: "destructive" });
 */
export function useToast() {
  const { addToast, removeToast } = useToastStore();

  return {
    toast: addToast,
    dismiss: removeToast,
  };
}

/**
 * Hook: useToasts
 * Returns all active toasts (for rendering)
 */
export function useToasts() {
  return useToastStore((state) => state.toasts);
}
