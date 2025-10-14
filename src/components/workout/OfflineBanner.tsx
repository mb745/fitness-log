import { WifiOff } from "lucide-react";

/**
 * OfflineBanner Component
 * Displays a banner when user is offline.
 * Informs that changes are being queued and will sync when online.
 */
export function OfflineBanner() {
  return (
    <div className="border-b border-yellow-500 bg-yellow-50 px-4 py-2" role="alert" aria-live="assertive">
      <div className="container mx-auto flex items-center gap-2 text-sm text-yellow-800">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Tryb offline:</strong> Zmiany są zapisywane lokalnie i zostaną zsynchronizowane po przywróceniu
          połączenia.
        </p>
      </div>
    </div>
  );
}
