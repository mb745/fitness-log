import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CalendarEventVM, CalendarView, WorkoutSessionDTO } from "../../types";
import CalendarComponent from "./CalendarComponent";
import SessionDetailsPanel from "./SessionDetailsPanel";

const CalendarPageInner: React.FC = () => {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleSelectEvent = (event: CalendarEventVM) => {
    setSelectedSessionId(event.id);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedSessionId(null);
  };

  const handleStartSession = (session: WorkoutSessionDTO) => {
    // Navigate to active workout page after starting
    window.location.href = `/workout/${session.id}/active`;
  };

  const handleContinueSession = (sessionId: number) => {
    // Navigate to active workout page
    window.location.href = `/workout/${sessionId}/active`;
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-card border rounded-lg p-4">
        <CalendarComponent
          view={view}
          onViewChange={setView}
          onSelectEvent={handleSelectEvent}
          currentDate={currentDate}
          onNavigate={setCurrentDate}
        />
      </div>

      {/* Session Details Panel */}
      <SessionDetailsPanel
        sessionId={selectedSessionId}
        open={panelOpen}
        onClose={handleClosePanel}
        onStart={handleStartSession}
        onContinue={handleContinueSession}
      />
    </div>
  );
};

const CalendarPage: React.FC = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CalendarPageInner />
    </QueryClientProvider>
  );
};

export default CalendarPage;
