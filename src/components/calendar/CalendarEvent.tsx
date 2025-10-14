import React from "react";
import type { CalendarEventVM, WorkoutSessionStatus } from "../../types";

interface CalendarEventProps {
  event: CalendarEventVM;
}

function getStatusBadge(status: WorkoutSessionStatus) {
  const statusConfig = {
    scheduled: { label: "Zaplanowany", className: "bg-blue-500 text-white" },
    in_progress: { label: "W trakcie", className: "bg-yellow-500 text-white" },
    completed: { label: "Ukończony", className: "bg-green-500 text-white" },
    abandoned: { label: "Porzucony", className: "bg-red-500 text-white" },
  };

  return statusConfig[status];
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ event }) => {
  const statusConfig = getStatusBadge(event.status);

  // Create tooltip text
  const tooltipText = `Status: ${statusConfig.label}\nData: ${event.start.toLocaleDateString("pl-PL")}`;

  return (
    <div className="flex items-center justify-center w-full cursor-pointer" title={tooltipText}>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.className}`}>{statusConfig.label}</span>
    </div>
  );
};

export default CalendarEvent;
