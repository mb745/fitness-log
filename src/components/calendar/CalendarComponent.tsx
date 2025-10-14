import React, { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { CalendarEventVM, CalendarView } from "../../types";
import { useCalendarSessions } from "../../lib/hooks/workout-sessions";
import { useActiveWorkoutPlan } from "../../lib/hooks/workout-plans";
import CalendarEvent from "./CalendarEvent";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    pl: pl,
  },
});

// Custom toolbar without view buttons
const CustomToolbar: React.FC<ToolbarProps> = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate("TODAY")}>
          Dzisiaj
        </button>
        <button type="button" onClick={() => onNavigate("PREV")}>
          Poprzedni
        </button>
        <button type="button" onClick={() => onNavigate("NEXT")}>
          Następny
        </button>
      </span>
      <span className="rbc-toolbar-label">{label}</span>
    </div>
  );
};

interface CalendarComponentProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onSelectEvent: (event: CalendarEventVM) => void;
  currentDate: Date;
  onNavigate: (date: Date) => void;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  view,
  onViewChange,
  onSelectEvent,
  currentDate,
  onNavigate,
}) => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  });

  const { data: activePlan } = useActiveWorkoutPlan();
  const {
    data: sessionsResponse,
    isLoading,
    error,
  } = useCalendarSessions(dateRange.from, dateRange.to, activePlan?.id);

  const events = useMemo(() => {
    return sessionsResponse?.data || [];
  }, [sessionsResponse]);

  const handleNavigate = (date: Date) => {
    onNavigate(date);

    // Update date range for API call - always use month view
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    setDateRange({
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    });
  };

  const handleViewChange = (newView: string) => {
    // Since we only support month view now, ignore other view changes
    if (newView === "month") {
      onViewChange("month");
    }
  };

  const eventStyleGetter = (event: CalendarEventVM) => {
    const statusColors = {
      scheduled: "#3b82f6", // blue
      in_progress: "#f59e0b", // yellow
      completed: "#10b981", // green
      abandoned: "#ef4444", // red
    };

    return {
      style: {
        backgroundColor: statusColors[event.status],
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Błąd ładowania danych kalendarza</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        view={view}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        messages={{
          allDay: "Cały dzień",
          previous: "Poprzedni",
          next: "Następny",
          today: "Dzisiaj",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień",
          agenda: "Agenda",
          date: "Data",
          time: "Czas",
          event: "Wydarzenie",
          noEventsInRange: "Brak wydarzeń w tym zakresie",
          showMore: (total: number) => `+ Zobacz ${total} więcej`,
        }}
        culture="pl"
        components={{
          event: CalendarEvent,
          toolbar: CustomToolbar,
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
