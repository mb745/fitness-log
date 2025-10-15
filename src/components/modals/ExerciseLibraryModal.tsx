import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useExercisesInfinite } from "../../lib/hooks/exercises";
import { useQuery } from "@tanstack/react-query";
import type { ExerciseDTO, MuscleGroupDTO, ExercisesListResponse } from "../../types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { useVirtualizer } from "@tanstack/react-virtual";

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface ExerciseLibraryModalProps {
  open: boolean;
  onClose(): void;
  onAdd(exercise: ExerciseDTO): void;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({ open, onClose, onAdd }) => {
  const [rawQuery, setRawQuery] = React.useState<string>("");
  const query = useDebounce(rawQuery, 300);
  const [muscleGroupId, setMuscleGroupId] = React.useState<number | undefined>(undefined);

  // Fetch muscle groups for dropdown
  const { data: muscleGroups } = useQuery({
    queryKey: ["muscle-groups"],
    queryFn: async () => {
      const res = await fetch("/api/v1/muscle-groups", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as MuscleGroupDTO[];
    },
    staleTime: 60_000,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExercisesInfinite({
    q: query.length >= 2 ? query : undefined,
    muscle_group_id: muscleGroupId,
    page_size: 40,
  });

  // Flattened items array
  const items = useMemo(() => {
    if (!data) return [] as ExerciseDTO[];
    return (data.pages as ExercisesListResponse[]).flatMap((p) => p.data);
  }, [data]);

  // Virtualizer setup
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  // Infinite scroll: fetch next page when near bottom
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;

    const { scrollTop, clientHeight, scrollHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[80vh] rounded-lg shadow-lg flex flex-col">
        {/* ModalHeader */}
        <div className="p-4 border-b space-y-2">
          {/* Row 1: muscle group filter + close */}
          <div className="flex items-center gap-2">
            <Select
              className="flex-1"
              value={muscleGroupId?.toString() ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setMuscleGroupId(val ? Number(val) : undefined);
              }}
            >
              <option value="">Wszystkie grupy</option>
              {muscleGroups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Button variant="ghost" onClick={onClose}>
              Zamknij
            </Button>
          </div>
          {/* Row 2: search input full width */}
          <Input
            className="w-full"
            placeholder="Wyszukaj ćwiczenie..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
        </div>

        {/* VirtualizedExerciseList */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 relative">
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const exercise = items[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (exercise) onAdd(exercise);
                    }
                  }}
                  className="absolute left-0 right-0 py-2 border-b cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => {
                    if (exercise) onAdd(exercise);
                  }}
                  // no sentinel ref here
                >
                  {exercise ? (
                    <>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">{exercise.exercise_type}</p>
                    </>
                  ) : (
                    <Skeleton className="h-6 w-full" />
                  )}
                </div>
              );
            })}
          </div>
          {/* spacer to allow scroll near-end detection */}
          <div className="h-4" />
          {isFetchingNextPage && <p className="text-center py-2 text-sm">Ładowanie...</p>}
          {!isFetchingNextPage && items.length === 0 && <p className="text-center py-8">Brak wyników</p>}
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibraryModal;
