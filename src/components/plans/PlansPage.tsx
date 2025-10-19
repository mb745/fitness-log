import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkoutPlans } from "../../lib/hooks/workout-plans";
import { PlansGrid } from "./PlansGrid.tsx";

const HeaderBar: React.FC = () => (
  <div className="mb-8" data-testid="plans-page-header">
    <h1 className="text-2xl font-semibold">Plany Treningowe</h1>
  </div>
);

const PlansPageInner: React.FC = () => {
  // Always include inactive plans
  const { data, isLoading, error } = useWorkoutPlans(true);

  const plans = data?.data || [];

  return (
    <div className="container py-8 space-y-6" data-testid="plans-page-container">
      <HeaderBar />

      {isLoading && <p data-testid="plans-loading-indicator">Ładowanie...</p>}
      {error && (
        <p className="text-red-500" data-testid="plans-error-message">
          Błąd ładowania planów
        </p>
      )}

      {!isLoading && !error && <PlansGrid plans={plans} />}
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
