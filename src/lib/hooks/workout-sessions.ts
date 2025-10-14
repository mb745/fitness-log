import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  WorkoutSessionsListResponse,
  WorkoutSessionDTO,
  WorkoutSessionDetailDTO,
  ISODateString,
  CalendarEventVM,
  CalendarEventsListResponse,
} from "../../types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

function mapDTOToCalendarEventVM(dto: WorkoutSessionDTO): CalendarEventVM {
  // For calendar display, sessions are shown as all-day events
  const date = new Date(dto.scheduled_for);
  return {
    id: dto.id,
    title: `Trening #${dto.id}`, // TODO: Get plan name from related data
    start: date,
    end: date,
    status: dto.status,
  };
}

export function buildCalendarSessionsKey(from: ISODateString, to: ISODateString, workoutPlanId?: number) {
  return ["calendarSessions", { from, to, workoutPlanId }];
}

export function useCalendarSessions(from: ISODateString, to: ISODateString, workoutPlanId?: number) {
  return useQuery({
    queryKey: buildCalendarSessionsKey(from, to, workoutPlanId),
    queryFn: async () => {
      const qs = new URLSearchParams({
        from,
        to,
        page_size: "1000", // Large page size for calendar view
      });
      if (workoutPlanId) {
        qs.append("workout_plan_id", workoutPlanId.toString());
      }
      const response = await fetchJson<WorkoutSessionsListResponse>(`/api/v1/workout-sessions?${qs.toString()}`);
      // Map DTOs to CalendarEventVMs
      const events: CalendarEventVM[] = response.data.map(mapDTOToCalendarEventVM);
      return {
        ...response,
        data: events,
      } as CalendarEventsListResponse;
    },
    staleTime: 60_000, // Cache for 1 minute
    enabled: !!from && !!to,
  });
}

export function useStartSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      return await fetchJson<WorkoutSessionDetailDTO>(`/api/v1/workout-sessions/${sessionId}/start`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["calendarSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["workoutSessions"], exact: false });
    },
  });
}

export function useDeleteSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await fetch(`/api/v1/workout-sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      return sessionId;
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["calendarSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["workoutSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["sessionDetails"], exact: false });
    },
  });
}

export function useAbandonSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      return await fetchJson<WorkoutSessionDTO>(`/api/v1/workout-sessions/${sessionId}/abandon`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["calendarSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["workoutSessions"], exact: false });
      qc.invalidateQueries({ queryKey: ["sessionDetails"], exact: false });
    },
  });
}
