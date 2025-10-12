import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkoutPlans } from "../../lib/hooks/workout-plans";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { PlansGrid } from "./PlansGrid.tsx";

const LOCAL_KEY = "showInactivePlans";

const HeaderBar: React.FC<{
  showInactive: boolean;
  onToggle(): void;
}> = ({ showInactive, onToggle }) => (
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-semibold">Plany Treningowe</h1>
    <div className="flex items-center gap-2">
      <span className="text-sm">Pokaż nieaktywne</span>
      <Switch checked={showInactive} onCheckedChange={onToggle} />
    </div>
  </div>
);

const FloatingActionButton: React.FC = () => (
  <Button
    className="fixed bottom-6 right-6 rounded-full h-14 w-14 text-3xl"
    onClick={() => {
      if (typeof window !== "undefined") {
        window.location.href = "/plans/new";
      }
    }}
  >
    +
  </Button>
);

const PlansPageInner: React.FC = () => {
  const [showInactive, setShowInactive] = React.useState<boolean>(false);

  // Load persisted flag after mount (client-side only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCAL_KEY);
    if (stored !== null) setShowInactive(stored === "true");
  }, []);

  const { data, isLoading, error } = useWorkoutPlans(showInactive);

  const toggle = () => {
    const next = !showInactive;
    setShowInactive(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_KEY, String(next));
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <HeaderBar showInactive={showInactive} onToggle={toggle} />

      {isLoading && <p>Ładowanie...</p>}
      {error && <p className="text-red-500">Błąd ładowania planów</p>}

      {data && data.data.length > 0 ? <PlansGrid plans={data.data} /> : !isLoading && <p>Brak planów.</p>}

      <FloatingActionButton />
    </div>
  );
};

const PlansPage: React.FC = () => {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <PlansPageInner />
    </QueryClientProvider>
  );
};

export default PlansPage;
