# Plan implementacji widoku Profil

## 1. Przegląd
Widok pozwala użytkownikowi zarządzać danymi osobowymi, kontem i preferencjami.

## 2. Routing
- `/profile`

## 3. Struktura komponentów
```
ProfilePage
 ├── Tabs/Accordion
 │    ├── PersonalTab (weight, height, gender)
 │    ├── LimitationsTab (textarea)
 │    ├── AccountTab (email RO, change pwd, logout)
 │    ├── PreferencesTab (units, sounds, suggestions toggles)
 │    └── AboutTab
```

## 4. Typy
- `ProfileDTO`, `ProfileUpdateCommand`.
- `PreferencesVM { unit:"kg"|"lbs"; sound:boolean; progression:boolean; stagnation:boolean }`.

## 5. Stan
- React Hook Form + Zod `profileSchema`.
- Auto‐save 2 s debounce.

## 6. API
- `GET /api/v1/profile`
- `POST /api/v1/profile`
- `PATCH /api/v1/profile`

## 7. Interakcje
- Change fields → autosave.
- Change pwd → Supabase auth panel.
- Logout → `supabase.auth.signOut()`.

## 8. Walidacja
- weight 0< ≤500, height 100–250.

## 9. Kroki
1. Validation schema.
2. Fetch or create profile on mount.
3. Form components.
4. Preferences toggles persisted localStorage.
5. Accessibility and responsive.
