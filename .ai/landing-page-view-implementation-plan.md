# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page (`/`) jest publicznym widokiem wejściowym aplikacji. Jego głównym celem jest konwersja odwiedzających na zarejestrowanych użytkowników poprzez atrakcyjną prezentację wartości aplikacji „Planuj. Trenuj. Progresuj.” oraz wyraźne wezwanie do działania (CTA) prowadzące do rejestracji.

## 2. Routing widoku

- Ścieżka: `/`
- Meta: `prerender: true` (statyczny build) + `noindex` dla środowisk testowych

## 3. Struktura komponentów

```
<Layout>
  <LandingPage>
    ├── <HeroSection>
    │     └── <CTAButton>
    └── <FeaturesSection>
           ├── <FeatureCard> × 3
           └── <SkipLink>
```

## 4. Szczegóły komponentów

### HeroSection

- **Opis**: Pełnoekranowa sekcja hero z hasłem, podtytułem i przyciskiem CTA.
- **Główne elementy**: `h1`, `p`, `CTAButton` (komponent `Button` z `/src/components/ui`), tło gradientowe.
- **Interakcje**: Kliknięcie CTA przekierowuje do `/register`.
- **Walidacja**: Brak.
- **Typy**: `HeroProps` (opcjonalnie `title`, `subtitle`).
- **Propsy**:
  ```typescript
  interface HeroProps {
    title?: string;
    subtitle?: string;
  }
  ```

### FeaturesSection

- **Opis**: Sekcja przedstawiająca trzy kluczowe funkcje aplikacji.
- **Główne elementy**: `section`, siatka `grid` Tailwind, trzy `FeatureCard`.
- **Interakcje**: Cała sekcja statyczna; brak akcji.
- **Walidacja**: Brak.
- **Typy**: `Feature[]` (zob. Typy).
- **Propsy**: `features: Feature[]`.

### FeatureCard

- **Opis**: Kafelek z ikoną, tytułem i opisem funkcji.
- **Główne elementy**: `div`, `svg`/`img` (ikona), `h3`, `p`.
- **Interakcje**: Hover z subtelną animacją (Tailwind `transform scale-105`).
- **Walidacja**: Alt text obowiązkowy.
- **Typy**:
  ```typescript
  interface Feature {
    id: number;
    icon: string; // ścieżka do assetu lub nazwa ikonki heroicons
    title: string;
    description: string;
  }
  ```
- **Propsy**: `feature: Feature`.

### CTAButton

- Używa istniejącego komponentu `Button` (`variant="primary"`, `size="lg"`, `as="a" href="/register"`).
- ARIA: `aria-label="Zarejestruj się – rozpocznij"`.

## 5. Typy

```typescript
export interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
}
```

Typy są lokalne dla widoku, brak potrzeby eksportu globalnego.

## 6. Zarządzanie stanem

Statyczny widok – brak globalnego stanu. Mały lokalny `useState<boolean>` do animacji hover nie wymaga custom hooków.

## 7. Integracja API

Brak bezpośrednich wywołań API. Wszystkie treści statyczne lub parametryzowane przez `import` JSON/MD.

## 8. Interakcje użytkownika

1. **Skip link** – link “Przejdź do treści” widoczny dla screen readerów/focus po TAB.
2. **Klik CTA** – `onClick` / `href` przekierowuje do `/register`.

## 9. Warunki i walidacja

- Dostępność: alt text dla ikon, poprawna kolejność focusu, kontrast 4.5:1.
- Responsywność: jedno- lub dwukolumnowa siatka na mobilkach.

## 10. Obsługa błędów

Brak dynamicznych danych ⇒ brak scenariuszy błędów runtime. Skupić się na błędach build-time (missing asset) – linter + `vite` catch.

## 11. Kroki implementacji

1. Utworzenie pliku `src/pages/index.astro` z `export const prerender = true`.
2. Stworzenie komponentów `HeroSection.astro`, `FeaturesSection.astro`, `FeatureCard.astro` w `src/components/landing/`.
3. Dodanie przykładowych danych funkcji w `src/content/features.ts` (tablica `Feature[]`).
4. Implementacja semantycznego HTML + Tailwind classes.
5. Dodanie skip linku w Layoucie głównym.
6. Weryfikacja Lighthouse (≥95 pkt dostępności).
7. Testy wizualne w break-points: xs, sm, lg.
