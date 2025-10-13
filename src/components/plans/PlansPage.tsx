import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkoutPlans } from "../../lib/hooks/workout-plans";
import { Button } from "../ui/button";
import { PlansGrid } from "./PlansGrid.tsx";

const HeaderBar: React.FC = () => (
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-semibold">Plany Treningowe</h1>
    <Button
      onClick={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/plans/new";
        }
      }}
    >
      + Dodaj nowy plan
    </Button>
  </div>
);

const PlansPageInner: React.FC = () => {
  // Always include inactive plans
  const { data, isLoading, error } = useWorkoutPlans(true);

  return (
    <div className="container py-8 space-y-6">
      <HeaderBar />

      {isLoading && <p>Ładowanie...</p>}
      {error && <p className="text-red-500">Błąd ładowania planów</p>}

      {data && data.data.length > 0 ? <PlansGrid plans={data.data} /> : !isLoading && <p>Brak planów.</p>}
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
