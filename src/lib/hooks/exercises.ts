import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ExercisesListResponse, ExercisesQueryParams, ExerciseDTO } from "../../types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

export function buildExercisesQueryKey(filters: Partial<ExercisesQueryParams>) {
  return ["exercises", filters];
}

function buildQueryString(filters: Partial<ExercisesQueryParams>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      params.append(key, String(value));
    }
  });
  if (!params.has("page_size")) params.append("page_size", "20");
  return params.toString();
}

/**
 * Hook returning paginated list of exercises with React Query infinite loading.
 * Consumers can call `fetchNextPage` when sentinel becomes visible.
 */
export function useExercisesInfinite(filters: Partial<ExercisesQueryParams>) {
  return useInfiniteQuery({
    queryKey: buildExercisesQueryKey(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const qs = buildQueryString({ ...filters, page: pageParam });
      return await fetchJson<ExercisesListResponse>(`/api/v1/exercises?${qs}`);
    },
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (lastPage.page < lastPage.last_page) return lastPageParam + 1;
      return undefined;
    },
    staleTime: 60_000,
  });
}

/**
 * Non-infinite version useful when total count small.
 */
export function useExercises(filters: Partial<ExercisesQueryParams>) {
  return useQuery({
    queryKey: buildExercisesQueryKey(filters),
    queryFn: async () => {
      const qs = buildQueryString(filters);
      return await fetchJson<ExercisesListResponse>(`/api/v1/exercises?${qs}`);
    },
    staleTime: 60_000,
  });
}
