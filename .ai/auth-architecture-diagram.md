# Diagram Architektury Modułu Autentykacji – Fitness Log

## Metadata

**Wersja:** 1.0  
**Data:** 2025-10-15  
**Powiązane dokumenty:** [prd.md](./prd.md), [auth-spec.md](./auth-spec.md)

## Opis

Diagram przedstawia kompletną architekturę modułu autentykacji aplikacji Fitness Log, uwzględniając:

- **Warstwy aplikacji**: klient, middleware, API, serwisy, baza danych
- **Strony publiczne i chronione** z odpowiednimi layoutami
- **Przepływy autentykacji**: rejestracja, logowanie, wylogowanie
- **Ochronę zasobów**: middleware i Layout.astro z weryfikacją sesji
- **Integrację z Supabase Auth** i relację między `auth.users` a `public.users`
- **Komponenty React** z walidacją formularzy
- **Endpointy API** z weryfikacją autoryzacji
- **Serwisy domenowe** z logiką biznesową

## Diagram

```mermaid
flowchart TD
    subgraph "Warstwa Klienta"
        User["Użytkownik"]podziel

        subgraph "Strony Publiczne"
            IndexPage["index.astro<br/>Landing Page"]
            LoginPage["login.astro<br/>Strona Logowania"]
            RegisterPage["register.astro<br/>Strona Rejestracji"]
        end

        subgraph "Strony Chronione"
            DashboardPage["dashboard.astro<br/>Pulpit"]
            ProfilePage["profile.astro<br/>Profil"]
            PlansPage["plans.astro<br/>Plany"]
            WorkoutPage["workout/[id]/active.astro<br/>Aktywny Trening"]
        end

        subgraph "Komponenty React Formularzy"
            LoginForm["LoginForm.tsx<br/>Formularz logowania<br/>react-hook-form + zod"]
            RegisterForm["RegisterForm.tsx<br/>Formularz rejestracji<br/>walidacja + wskaźnik siły hasła"]
        end

        subgraph "Komponenty Prezentacyjne"
            AuthCard["AuthCard.astro<br/>Kontener formularzy auth<br/>logo + tytuł + slot"]
            TopMenu["TopMenu.astro<br/>Menu nawigacyjne<br/>+ przycisk wyloguj"]
            PublicLayout["PublicLayout.astro<br/>Layout publiczny<br/>bez menu"]
            ProtectedLayout["Layout.astro<br/>Layout chroniony<br/>weryfikacja sesji + TopMenu"]
        end
    end

    subgraph "Warstwa Middleware"
        Middleware["middleware/index.ts<br/>Weryfikacja sesji<br/>Przekierowania<br/>Kontrola bezczynności<br/>Udostępnia supabaseClient"]
    end

    subgraph "Warstwa API"
        subgraph "Endpointy Autentykacji"
            LogoutEndpoint["POST /api/v1/auth/logout<br/>Wylogowanie użytkownika"]
        end

        subgraph "Endpointy Profilu"
            GetProfile["GET /api/v1/profile<br/>Pobranie profilu"]
            CreateProfile["POST /api/v1/profile<br/>Utworzenie profilu"]
            UpdateProfile["PATCH /api/v1/profile<br/>Aktualizacja profilu"]
        end

        subgraph "Helpery API"
            CheckAuth["checkAuth()<br/>Weryfikacja sesji w endpointach"]
            ApiHelpers["api-helpers.ts<br/>errorResponse, jsonResponse<br/>handleZodError, logApiError"]
        end
    end

    subgraph "Warstwa Serwisów"
        ProfileService["ProfileService<br/>CRUD na public.users<br/>Sprawdzanie własności"]

        subgraph "Walidacja"
            ProfileValidation["profile.validation.ts<br/>Schematy Zod<br/>profileCreateSchema<br/>profileUpdateSchema"]
        end
    end

    subgraph "Warstwa Bazy Danych"
        SupabaseClient["supabase.client.ts<br/>Klient Supabase<br/>Zarządzanie sesją"]

        subgraph "Supabase Auth"
            AuthUsers["auth.users<br/>Użytkownicy Auth<br/>email, hashed password"]
            AuthMethods["Metody Auth:<br/>signUp()<br/>signInWithPassword()<br/>signOut()<br/>getSession()"]
        end

        subgraph "Baza Aplikacji"
            PublicUsers["public.users<br/>Profile użytkowników<br/>weight, height, gender, injuries"]
        end
    end

    %% Przepływ rejestracji
    User -->|"wypełnia formularz"| RegisterPage
    RegisterPage --> PublicLayout
    PublicLayout --> AuthCard
    AuthCard --> RegisterForm
    RegisterForm -->|"walidacja client-side"| RegisterForm
    RegisterForm -->|"signUp(email, password)"| SupabaseClient
    SupabaseClient -->|"utworzenie użytkownika"| AuthUsers
    AuthUsers -->|"sesja + JWT"| RegisterForm
    RegisterForm -->|"POST {} empty body"| CreateProfile
    CreateProfile --> CheckAuth
    CheckAuth --> ProfileService
    ProfileService --> ProfileValidation
    ProfileService -->|"INSERT"| PublicUsers
    PublicUsers -->|"ProfileDTO"| RegisterForm
    RegisterForm -->|"redirect"| DashboardPage

    %% Przepływ logowania
    User -->|"wypełnia formularz"| LoginPage
    LoginPage --> PublicLayout
    PublicLayout --> AuthCard
    AuthCard --> LoginForm
    LoginForm -->|"walidacja client-side"| LoginForm
    LoginForm -->|"signInWithPassword(email, password)"| SupabaseClient
    SupabaseClient -->|"weryfikacja"| AuthUsers
    AuthUsers -->|"sesja + JWT"| LoginForm
    LoginForm -->|"redirect"| DashboardPage

    %% Przepływ wylogowania
    User -->|"klik wyloguj"| TopMenu
    TopMenu -->|"POST"| LogoutEndpoint
    LogoutEndpoint -->|"signOut()"| SupabaseClient
    SupabaseClient -->|"usuwa sesję"| AuthUsers
    LogoutEndpoint -->|"redirect"| LoginPage

    %% Przepływ ochrony stron
    User -->|"żądanie strony"| Middleware
    Middleware -->|"getSession()"| SupabaseClient
    SupabaseClient -->|"sprawdza sesję"| AuthUsers
    Middleware -->|"zalogowani na /login,/register"| DashboardPage
    Middleware -->|"niezalogowani na chronione"| LoginPage
    Middleware -->|"limit bezczynności"| LoginPage

    %% Strony chronione przez Layout
    DashboardPage --> ProtectedLayout
    ProfilePage --> ProtectedLayout
    PlansPage --> ProtectedLayout
    WorkoutPage --> ProtectedLayout
    ProtectedLayout -->|"zawiera"| TopMenu
    ProtectedLayout -->|"getSession()"| SupabaseClient
    ProtectedLayout -->|"brak sesji → redirect"| LoginPage

    %% Operacje na profilu
    ProfilePage -->|"GET"| GetProfile
    GetProfile --> CheckAuth
    CheckAuth --> ProfileService
    ProfileService -->|"SELECT WHERE user_id"| PublicUsers

    ProfilePage -->|"PATCH dane"| UpdateProfile
    UpdateProfile --> CheckAuth
    UpdateProfile --> ProfileValidation
    CheckAuth --> ProfileService
    ProfileService -->|"UPDATE WHERE user_id"| PublicUsers

    %% Wspólne zależności
    AuthMethods -.->|"używane przez"| SupabaseClient
    ApiHelpers -.->|"używane przez"| LogoutEndpoint
    ApiHelpers -.->|"używane przez"| CreateProfile
    ApiHelpers -.->|"używane przez"| GetProfile
    ApiHelpers -.->|"używane przez"| UpdateProfile

    %% Relacja między tabelami
    AuthUsers -.->|"1:1 relacja<br/>id references"| PublicUsers

    %% Style dla różnych typów węzłów
    classDef publicPages fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef protectedPages fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef reactComponents fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef layouts fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef middleware fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef api fill:#ffe0b2,stroke:#e64a19,stroke-width:2px
    classDef services fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class IndexPage,LoginPage,RegisterPage publicPages
    class DashboardPage,ProfilePage,PlansPage,WorkoutPage protectedPages
    class LoginForm,RegisterForm reactComponents
    class AuthCard,TopMenu,PublicLayout,ProtectedLayout layouts
    class Middleware middleware
    class LogoutEndpoint,GetProfile,CreateProfile,UpdateProfile,CheckAuth,ApiHelpers api
    class ProfileService,ProfileValidation services
    class SupabaseClient,AuthUsers,AuthMethods,PublicUsers database
```

## Legenda kolorów

- **Niebieski** (jasny) - Strony publiczne
- **Pomarańczowy** (jasny) - Strony chronione
- **Fioletowy** (jasny) - Komponenty React
- **Zielony** (jasny) - Layouty Astro
- **Żółty** (jasny) - Middleware
- **Pomarańczowy** (ciemniejszy) - Endpointy API
- **Turkusowy** (jasny) - Serwisy i walidacja
- **Różowy** (jasny) - Warstwa bazy danych

## Kluczowe przepływy

### 1. Rejestracja użytkownika (US-001)

1. Użytkownik wypełnia formularz rejestracji
2. Walidacja client-side (zod)
3. Wywołanie `signUp()` → utworzenie w `auth.users`
4. Utworzenie profilu przez API → wpis w `public.users`
5. Przekierowanie na `/dashboard`

### 2. Logowanie użytkownika (US-002)

1. Użytkownik wypełnia formularz logowania
2. Walidacja client-side (zod)
3. Wywołanie `signInWithPassword()` → weryfikacja i sesja
4. Przekierowanie na `/dashboard`

### 3. Wylogowanie użytkownika (US-003)

1. Kliknięcie przycisku "Wyloguj" w TopMenu
2. Wywołanie `POST /api/v1/auth/logout`
3. Usunięcie sesji przez `signOut()`
4. Przekierowanie na `/login`

### 4. Ochrona zasobów (US-019)

1. Middleware sprawdza sesję dla każdego żądania
2. Layout.astro dodatkowo weryfikuje server-side
3. Niezalogowani → redirect na `/login`
4. Zalogowani na `/login` lub `/register` → redirect na `/dashboard`
5. Kontrola limitu bezczynności (30 min domyślnie)

## Wymagane zmiany implementacyjne

Zgodnie z [auth-spec.md](./auth-spec.md):

### Frontend

- [ ] LoginForm/RegisterForm – usunąć dyrektywę `"use client"`
- [ ] TopMenu – dodać przycisk wylogowania
- [ ] Layout.astro – dodać sprawdzenie sesji i redirect
- [ ] Obsługa 401 i redirect na `/login?reason=idle`

### Backend

- [ ] Utworzyć endpoint `POST /api/v1/auth/logout`
- [ ] Zaktualizować `checkAuth` w `api-helpers.ts`
- [ ] Dodać `checkAuthAndActivity` (idle timeout + session check)
- [ ] Wdrożyć autoryzację/własność w serwisach
- [ ] CSRF: weryfikacja Origin/double submit cookie

### Middleware

- [ ] Ochrona chronionych stron
- [ ] Utrzymywanie cookie `lastActivityAt`
- [ ] Wymuszanie wylogowania po bezczynności

## Odniesienia

- [PRD - Dokument wymagań produktu](./prd.md)
- [Specyfikacja techniczna modułu autentykacji](./auth-spec.md)
