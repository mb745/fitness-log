import React, { useEffect, useRef, useMemo } from "react";
import { useExercisesInfinite } from "../../lib/hooks/exercises";
import type { ExerciseDTO, ExerciseType } from "../../types";
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
  const [type, setType] = React.useState<ExerciseType | undefined>(undefined);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExercisesInfinite({
    q: query.length >= 2 ? query : undefined,
    type,
  });

  // Flattened items array
  const items = useMemo(() => (data ? data.pages.flatMap((p) => p.data) : []), [data]);

  // Virtualizer setup
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchNextPage();
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[80vh] rounded-lg shadow-lg flex flex-col">
        {/* ModalHeader */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Input
            className="flex-1"
            placeholder="Wyszukaj ćwiczenie..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
          <Select value={type ?? ""} onValueChange={(v) => setType(v as ExerciseType)}>
            <option value="">Wszystkie</option>
            <option value="compound">Compound</option>
            <option value="isolation">Isolation</option>
          </Select>
          <Button variant="ghost" onClick={onClose}>
            Zamknij
          </Button>
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
                  className="absolute left-0 right-0 py-2 border-b cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => exercise && onAdd(exercise)}
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
          {/* sentinel */}
          <div ref={sentinelRef} />
          {isFetchingNextPage && <p className="text-center py-2 text-sm">Ładowanie...</p>}
          {!isFetchingNextPage && items.length === 0 && <p className="text-center py-8">Brak wyników</p>}
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibraryModal;
