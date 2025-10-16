import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkoutPlans } from "../../lib/hooks/workout-plans";
import { PlansGrid } from "./PlansGrid.tsx";

const HeaderBar: React.FC = () => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold">Plany Treningowe</h1>
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

      {data && !isLoading && <PlansGrid plans={data.data} />}
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
