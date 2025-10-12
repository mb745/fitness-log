# Plan implementacji widoku Login

## 1. Przegląd
Widok logowania (`/login`) umożliwia istniejącym użytkownikom uwierzytelnienie się w aplikacji. Formularz przyjmuje e-mail i hasło, waliduje dane po stronie klienta, wyświetla komunikaty o błędach bez ujawniania, które pole jest niepoprawne (zgodnie z US-002) oraz zarządza stanem ładowania.

## 2. Routing widoku
- Ścieżka: `/login`
- Strona publiczna (ale ukryta w nawigacji, jeśli użytkownik jest zalogowany – redirect to `/dashboard`).

## 3. Struktura komponentów
```
<Layout public>
  <LoginPage>
    ├── <AuthCard>
          ├── <LoginForm>
                ├── <EmailInput>
                ├── <PasswordInput>
                ├── <SubmitButton>
                └── <ToastContainer>
          └── <LinkRegister>
```

## 4. Szczegóły komponentów
### AuthCard
- **Opis**: Centralnie wyrównana karta z logo, nagłówkiem „Zaloguj się”, formularzem i linkiem do rejestracji.
- **Elementy**: `div.card`, `img.logo`, slot na `children`.
- **Interakcje**: Brak.
- **Propsy**: `children`.

### LoginForm
- **Opis**: Kontroluje pola formularza, walidację i wysyłkę do API Supabase (`supabase.auth.signInWithPassword`).
- **Elementy**: `form`, `EmailInput`, `PasswordInput`, `SubmitButton`.
- **Interakcje**:
  - `onSubmit` → `handleLogin`
  - Real-time walidacja e-mail regex, min 8 char hasło.
- **Walidacja**:
  - Front: `email` poprawny format; `password` min 8 znaków.
  - Po API: 401 → „Nieprawidłowe dane logowania”.
- **Typy**:
  ```typescript
  interface LoginFormState {
    email: string;
    password: string;
    isSubmitting: boolean;
    error?: string;
  }
  ```
- **Propsy**: None (zarządzany lokalnie).

### EmailInput & PasswordInput
- **Opis**: Inputy z etykietą, błędem i `aria-invalid`.
- **Interakcje**: `onChange` → update state.
- **Walidacja**: Wystawiają komunikat, gdy pole `touched` i `invalid`.
- **Propsy**: `value`, `onChange`, `error`.

### SubmitButton
- **Opis**: Używa komponentu `Button` (`variant="primary"`).
- **Interakcje**: Disabled, gdy `isSubmitting` lub form invalid.
- **Propsy**: `isLoading: boolean`.

### ToastContainer
- **Opis**: Globalny kontener z `@/components/ui/toast` dla komunikatów (sukces/blad).

## 5. Typy
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```
Same lokalne, brak eksportu do `/src/types.ts`.

## 6. Zarządzanie stanem
- `useState` do pól + `useReducer` opcjonalnie.
- Custom hook `useAuthRedirect` – przekieruj zalogowanych na `/dashboard`.

## 7. Integracja API
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email, password,
});
```
- Na sukces: `router.push('/dashboard');`
- Na error: `setError('Nieprawidłowe dane logowania'); log.warn`.

## 8. Interakcje użytkownika
1. Użytkownik wprowadza dane → natychmiastowa walidacja.
2. Submit → spinner w przycisku.
3. Sukces → redirect.
4. Błąd → toast.

## 9. Warunki i walidacja
- Blokada przycisku, gdy pola puste.
- Po 5 błędnych próbach w 1 min – wyświetl info o `rateLimit` (dane z 429).

## 10. Obsługa błędów
- 401: ogólny komunikat.
- 429: toast „Zbyt wiele prób. Spróbuj za minutę”.
- 500: toast „Wystąpił błąd serwera. Spróbuj ponownie później”.

## 11. Kroki implementacji
1. `src/pages/login.astro` z `export const prerender = false`.
2. Instalacja `@supabase/auth-helpers` jeśli brak.
3. Stworzenie folderu `src/components/auth/` z `AuthCard`, `LoginForm`.
4. Implementacja walidacji React Hook Form lub Zod + `@hookform/resolvers`.
5. Dodanie redirectu w middleware, jeśli `ctx.locals.user` i path `/login|/register`.
6. Testy: błędne dane, 429, sukces.
