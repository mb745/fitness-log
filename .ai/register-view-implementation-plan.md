# Plan implementacji widoku Register

## 1. Przegląd
Widok rejestracji (`/register`) pozwala utworzyć nowe konto, automatycznie zalogować użytkownika i utworzyć pusty profil (`POST /api/v1/profile`). Formularz wymaga e-maila, hasła i potwierdzenia hasła, prezentuje wskaźnik siły hasła i checkbox akceptacji regulaminu.

## 2. Routing widoku
- Ścieżka: `/register`
- Publiczny, redirect do `/dashboard`, jeśli zalogowany.

## 3. Struktura komponentów
```
<Layout public>
  <RegisterPage>
    ├── <AuthCard>
          ├── <RegisterForm>
                ├── <EmailInput>
                ├── <PasswordInput>
                ├── <ConfirmPasswordInput>
                ├── <PasswordStrengthIndicator>
                ├── <TermsCheckbox>
                ├── <SubmitButton>
                └── <ToastContainer>
          └── <LinkLogin>
```

## 4. Szczegóły komponentów
### RegisterForm
- **Opis**: Zarządza polami, walidacją i wywołaniami Supabase `signUp` oraz `POST /api/v1/profile`.
- **Walidacja**:
  - `email`: poprawny format.
  - `password`: min 8 znaków (litera, cyfra), musi pasować `confirmPassword`.
  - `termsAccepted`: wymagane.
- **Interakcje**:
  - Submit → `handleRegister`.
- **Typy**:
  ```typescript
  interface RegisterFormState {
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
    isSubmitting: boolean;
    error?: string;
  }
  ```

### PasswordStrengthIndicator
- **Opis**: Pasek i etykieta (słaby/średni/mocny) bazujące na algorytmie zxcvbn.
- **Propsy**: `password: string`.

### TermsCheckbox
- **Opis**: Checkbox z linkiem do regulaminu.
- **Propsy**: `checked`, `onChange`.

## 5. Typy
Brak nowych globalnych typów – użycie lokalnych i istniejących `ProfileCreateCommand` przy POST.

## 6. Zarządzanie stanem
- `useForm` (React Hook Form) + Zod resolver.
- Po rejestracji: `supabase.auth.setSession` zostaje automatycznie zrobione.
- `useMutation` z `@tanstack/react-query` dla `POST /profile`.

## 7. Integracja API
1. `supabase.auth.signUp({ email, password })`
2. On success → `fetch('/api/v1/profile', { method: 'POST', body: JSON.stringify({}) })`
   - Content-Type: `application/json`
   - Expected 201.

## 8. Interakcje użytkownika
1. Wpisz e-mail/hasło → strength live update.
2. Checkbox warunkuje aktywację przycisku.
3. Submit → spinner, disabled.
4. Sukces → redirect `/dashboard`.
5. Błąd → toast.

## 9. Warunki i walidacja
- Silne hasło wymagane? MVP akceptuje >=medium.
- Terms not accepted → disabled submit.

## 10. Obsługa błędów
- 400 (walidacja) → highlight fields.
- 409 email exists → toast „Użytkownik istnieje”.
- 500 → generic toast.

## 11. Kroki implementacji
1. `src/pages/register.astro`.
2. Komponenty w `src/components/auth/`.
3. Dodanie `zxcvbn` npm.
4. Implementacja formy z React Hook Form + Zod.
5. Mutacje z React Query.
6. Middleware redirect.
