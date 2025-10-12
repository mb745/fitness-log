# Plan implementacji modalu Alert Stagnacji

## 1. Przegląd

Modal informuje o braku progresu w ćwiczeniu w ostatnich 5 treningach i proponuje działania.

## 2. Wywołanie

- Klik badge "Stagnacja" w historii lub po stronie backend event.

## 3. Struktura

```
StagnationAlertModal
 ├── MessageSection
 ├── VolumeChart/Table
 ├── SuggestionsForm (RadioGroup)
 ├── DisableCheckbox
 └── ActionsBar (Apply / Reject)
```

## 4. Typy

`StagnationSuggestion { type:"weight"|"reps"|"exercise"; value:number|string }`

## 5. API

- Data: `GET /api/v1/analytics/exercise-progression?exercise_id=id&limit=5`.
- Apply: similar to progression modal PATCH.

## 6. Kroki

1. Fetch last 5 sessions volume.
2. Compute suggestions.
3. Apply patch.
