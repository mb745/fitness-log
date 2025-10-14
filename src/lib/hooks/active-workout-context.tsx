import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionSetUpdateCommand, WorkoutSessionDetailDTO } from "../../types";

/**
 * Timer state for rest timer
 */
export interface TimerState {
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** Initial duration in seconds */
  initialSeconds: number;
  /** Whether timer is running */
  isRunning: boolean;
  /** Set ID that triggered the timer */
  triggeredBySetId: number;
}

/**
 * Offline queue item for pending updates
 */
export interface OfflineQueueItem {
  setId: number;
  updates: SessionSetUpdateCommand;
  timestamp: number;
}

/**
 * Active workout state
 */
export interface ActiveWorkoutState {
  // Session data
  sessionId: number | null;
  session: WorkoutSessionDetailDTO | null;

  // Current progress
  currentSetId: number | null;

  // Timer state
  timer: TimerState | null;

  // Offline queue for failed updates
  offlineQueue: OfflineQueueItem[];

  // Actions
  setSession: (session: WorkoutSessionDetailDTO) => void;
  setCurrentSetId: (setId: number | null) => void;
  startTimer: (setId: number, durationSeconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  skipTimer: () => void;
  adjustTimer: (seconds: number) => void;
  tickTimer: () => void;
  clearTimer: () => void;
  addToOfflineQueue: (setId: number, updates: SessionSetUpdateCommand) => void;
  removeFromOfflineQueue: (setId: number) => void;
  clearOfflineQueue: () => void;
  clearSession: () => void;
}

/**
 * Create active workout store with persistence
 */
export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionId: null,
      session: null,
      currentSetId: null,
      timer: null,
      offlineQueue: [],

      // Session management
      setSession: (session) =>
        set({
          sessionId: session.id,
          session,
        }),

      setCurrentSetId: (setId) =>
        set({
          currentSetId: setId,
        }),

      // Timer management
      startTimer: (setId, durationSeconds) =>
        set({
          timer: {
            remainingSeconds: durationSeconds,
            initialSeconds: durationSeconds,
            isRunning: true,
            triggeredBySetId: setId,
          },
        }),

      pauseTimer: () => {
        const { timer } = get();
        if (!timer) return;
        set({
          timer: {
            ...timer,
            isRunning: false,
          },
        });
      },

      resumeTimer: () => {
        const { timer } = get();
        if (!timer) return;
        set({
          timer: {
            ...timer,
            isRunning: true,
          },
        });
      },

      skipTimer: () =>
        set({
          timer: null,
        }),

      adjustTimer: (seconds) => {
        const { timer } = get();
        if (!timer) return;
        const newRemaining = Math.max(0, timer.remainingSeconds + seconds);
        set({
          timer: {
            ...timer,
            remainingSeconds: newRemaining,
          },
        });
      },

      tickTimer: () => {
        const { timer } = get();
        if (!timer || !timer.isRunning) return;

        const newRemaining = Math.max(0, timer.remainingSeconds - 1);

        if (newRemaining === 0) {
          // Timer finished
          set({ timer: null });
        } else {
          set({
            timer: {
              ...timer,
              remainingSeconds: newRemaining,
            },
          });
        }
      },

      clearTimer: () =>
        set({
          timer: null,
        }),

      // Offline queue management
      addToOfflineQueue: (setId, updates) =>
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue.filter((item) => item.setId !== setId),
            {
              setId,
              updates,
              timestamp: Date.now(),
            },
          ],
        })),

      removeFromOfflineQueue: (setId) =>
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((item) => item.setId !== setId),
        })),

      clearOfflineQueue: () =>
        set({
          offlineQueue: [],
        }),

      // Clear all session data
      clearSession: () =>
        set({
          sessionId: null,
          session: null,
          currentSetId: null,
          timer: null,
          offlineQueue: [],
        }),
    }),
    {
      name: (state) => `active-workout-${state.sessionId || "temp"}`,
      partialize: (state) => ({
        // Only persist essential state
        sessionId: state.sessionId,
        currentSetId: state.currentSetId,
        timer: state.timer,
        offlineQueue: state.offlineQueue,
        // Don't persist session data (refetch from server)
      }),
    }
  )
);
