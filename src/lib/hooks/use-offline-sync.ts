import { useEffect, useCallback } from "react";
import { useActiveWorkoutStore } from "./active-workout-context";
import { usePatchSet } from "./active-workout";

/**
 * Hook: useOfflineSync
 * Manages offline queue synchronization.
 *
 * Features:
 * - Monitors online/offline status
 * - Automatically syncs queue when coming back online
 * - Retries failed updates from queue
 * - Removes successfully synced items from queue
 *
 * Usage: Call this hook once in ActiveWorkoutPage component
 */
export function useOfflineSync() {
  const { offlineQueue, removeFromOfflineQueue, clearOfflineQueue } = useActiveWorkoutStore();
  const { mutate: patchSet } = usePatchSet();

  /**
   * Sync all items from offline queue
   */
  const syncQueue = useCallback(() => {
    if (offlineQueue.length === 0) {
      return;
    }

    console.log(`[OfflineSync] Syncing ${offlineQueue.length} items from queue`);

    // Process each item in queue
    offlineQueue.forEach((item) => {
      patchSet(
        {
          setId: item.setId,
          updates: item.updates,
        },
        {
          onSuccess: () => {
            console.log(`[OfflineSync] Successfully synced set ${item.setId}`);
            removeFromOfflineQueue(item.setId);
          },
          onError: (error) => {
            console.error(`[OfflineSync] Failed to sync set ${item.setId}:`, error);
            // Keep in queue for next sync attempt
            // Could implement exponential backoff here
          },
        }
      );
    });
  }, [offlineQueue, patchSet, removeFromOfflineQueue]);

  /**
   * Monitor online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log("[OfflineSync] Connection restored, syncing queue");
      // Small delay to ensure connection is stable
      setTimeout(() => {
        syncQueue();
      }, 1000);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [syncQueue]);

  /**
   * Periodic sync (every 30 seconds) if online
   */
  useEffect(() => {
    if (!navigator.onLine) {
      return;
    }

    const interval = setInterval(() => {
      if (navigator.onLine && offlineQueue.length > 0) {
        console.log("[OfflineSync] Periodic sync triggered");
        syncQueue();
      }
    }, 30_000); // 30 seconds

    return () => clearInterval(interval);
  }, [syncQueue, offlineQueue.length]);

  return {
    syncQueue,
    clearQueue: clearOfflineQueue,
    queueSize: offlineQueue.length,
  };
}
