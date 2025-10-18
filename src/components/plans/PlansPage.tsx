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

  const showEmptyState = !isLoading && !error && (!data || !data.data || data.data.length === 0);
  const showGrid = !isLoading && !error && data && data.data && data.data.length > 0;

  return (
    <div className="container py-8 space-y-6" data-testid="plans-page-container">
      <HeaderBar />

      {isLoading && <p data-testid="plans-loading-indicator">Ładowanie...</p>}
      {error && (
        <p className="text-red-500" data-testid="plans-error-message">
          Błąd ładowania planów
        </p>
      )}

      {showGrid && <PlansGrid plans={data.data} />}
      {showEmptyState && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nie masz jeszcze żadnych planów treningowych</p>
          <button
            data-testid="add-new-plan-button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/plans/new";
              }
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            + Dodaj nowy plan
          </button>
        </div>
      )}
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
