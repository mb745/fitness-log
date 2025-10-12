# Plan implementacji modalu Szczegóły Ćwiczenia

## 1. Przegląd
Modal prezentuje szczegółowe informacje o ćwiczeniu wraz z historią wolumenu użytkownika z ostatnich 12 tygodni.

## 2. Wywołanie
- Otwierany z `ExerciseCard` w bibliotece.

## 3. Struktura komponentów
```
ExerciseDetailModal
 ├── ImageHero
 ├── MetadataBadges (group, subgroup, type, rep range)
 ├── InstructionsList (step-by-step)
 └── VolumeChart (line chart)
```

## 4. Szczegóły komponentów
### VolumeChart
- `recharts` LineChart.
- Dataset: `[{ date:'2025-10-01', volume:1234 }, …]`.
- API: `GET /api/v1/analytics/exercise-progression?exercise_id=:id`.

### InstructionsList
- Render list `<ol>`.
- ARIA `aria-label="Instrukcje"`.

## 5. Typy
- `ExerciseDTO`
- `ExerciseProgressionDTO[]` (view from `types.ts`).

## 6. Zarządzanie stanem
- React Query `useExerciseProgression(id)` (staleTime: 1 h).

## 7. Integracja API
| Endpoint | Method |
| `/api/v1/analytics/exercise-progression?exercise_id={id}` | GET |

## 8. Interakcje użytkownika
- Scroll wewnątrz modalu (body lock backdrop).
- Zamknięcie via X lub ESC (not in progression modal spec so allowed here).

## 9. Warunki i walidacja
- Pokaz skeleton w trakcie pobierania progression.

## 10. Obsługa błędów
- Jeśli progression 404 → ukryj wykres, pokaż info "Brak danych".

## 11. Kroki implementacji
1. Utwórz modal w `src/components/modals/ExerciseDetailModal.tsx`.
2. Pobierz progression w efekcie po mount.
3. Dodaj test chart rendering.
