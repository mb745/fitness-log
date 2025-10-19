# Fitness Log

![Node.js 22.14.0](https://img.shields.io/badge/Node.js-22.14.0-43853D?logo=node.js&logoColor=white)
![Astro 5](https://img.shields.io/badge/Astro-5.13.7-BC52EE?logo=astro)
![React 19](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

## Table of Contents

- [Fitness Log](#fitness-log)
  - [Table of Contents](#table-of-contents)
  - [1. Project name](#1-project-name)
  - [2. Project description](#2-project-description)
  - [3. Tech stack](#3-tech-stack)
    - [Frontend](#frontend)
    - [Backend \& Services](#backend--services)
    - [Tooling \& Infrastructure](#tooling--infrastructure)
  - [4. Getting started locally](#4-getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Additional commands](#additional-commands)
  - [5. Available scripts](#5-available-scripts)
  - [6. Project scope](#6-project-scope)
  - [7. Project status](#7-project-status)
  - [8. License](#8-license)
  - [9. Testing](#9-testing)
    - [Unit tests](#unit-tests)
    - [End-to-end (E2E) tests](#end-to-end-e2e-tests)
  - [10. Deployments & Releases](#10-deployments--releases)

## 1. Project name

Fitness Log

## 2. Project description

Fitness Log is an MVP web application that helps strength-training enthusiasts plan workouts, execute training sessions, and track progress over time. The product targets users with foundational lifting experience who need a simple yet structured tool that guides progression, highlights stagnation, and keeps upcoming sessions front and center. Core capabilities include an exercise library with rich metadata, a calendar-connected plan builder, an in-session logging interface with timers, history insights, and intelligent progression suggestions powered by the user's prior performance.

## 3. Tech stack

### Frontend

- Astro 5 for performant hybrid rendering with minimal JavaScript overhead
- React 19 for interactive client components where user input and live updates are required
- TypeScript 5 for type-safe development and IDE tooling
- Tailwind CSS 4 for utility-first styling with responsive and stateful variants
- shadcn/ui and Radix UI primitives for accessible, composable UI building blocks

### Backend & Services

- Supabase (PostgreSQL, authentication, storage) as the managed backend foundation
- Planned integration with Openrouter.ai for AI-driven recommendations beyond the MVP scope

### Tooling & Infrastructure

- Node.js 22.14.0 (see `.nvmrc`) and npm for package management
- ESLint 9 and Prettier for linting and formatting (with Husky + lint-staged pre-commit hooks)
- GitHub Actions for CI/CD automation
- Cloudflare for hosting and global CDN distribution

## 4. Getting started locally

### Prerequisites

- Node.js 22.14.0 (use `nvm use` to match `.nvmrc`)
- npm (bundled with Node.js)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create your environment file based on the provided template:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

4. Open the printed local URL (defaults to `http://localhost:3000`) to view the app.

### Additional commands

- Build a production bundle:

```bash
npm run build
```

- Preview the production build locally:

```bash
npm run preview
```

## 5. Available scripts

| Script             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Launches the Astro dev server with live reload.    |
| `npm run build`    | Generates a production-ready build of the site.    |
| `npm run preview`  | Serves the built output locally for smoke testing. |
| `npm run astro`    | Opens the Astro CLI for auxiliary commands.        |
| `npm run lint`     | Runs ESLint across the project.                    |
| `npm run lint:fix` | Attempts to automatically fix lint issues.         |
| `npm run format`   | Formats supported files with Prettier.             |

## 6. Project scope

The MVP aims to deliver the following pillars:

- **Exercise library** with muscle-group taxonomy, exercise type, rep range guidance, instructions, and search/filtering by name, group, and type.
- **Training plan builder** that schedules exercises with sets, reps, rest times, manual ordering, and calendar assignments (weekly patterns or custom intervals) with full edit support.
- **Calendar experience** showing monthly/weekly overviews, quick access to session details, and dashboard highlights for the next workout.
- **Active workout screen** that tracks per-set reps, loads, completion status, rest timers with adjustable intervals, and visual training progress.
- **Progression intelligence** offering suggestions to increase reps or load, stagnation alerts after repeated plateaus, and recap modals with actionable recommendations.
- **Training history** providing completed/abandoned session logs, filters, and detailed per-set records.
- **Authentication & profile management** covering sign-up, login, logout, and editable profile data (weight, height, limitations) while keeping training data secure.
- **Status management & analytics** capturing session states (Scheduled, In Progress, Completed, Abandoned) and telemetry for user retention and workout completion metrics.

Out-of-scope items for the MVP include automated plan generation, visual progress charts, push/email notifications, rich media instructions, and advanced analytics dashboards. For full details, refer to the [Product Requirements Document](./.ai/prd.md).

## 7. Project status

- **Phase:** MVP discovery and implementation planning.
- **Key success metrics:**
  - ≥50% of registered users complete more than one workout within four weeks.
  - 60% of sessions transition from In Progress to Completed.
  - Average recorded session length remains between 30–90 minutes.
- **Open considerations:** finalizing the "Abandoned" session workflow (e.g., background jobs), defining exercise library maintenance, and validating Supabase usage limits.

## 8. License

License information has not yet been specified. Please add a license file before releasing the project publicly.

## 9. Testing

### Unit tests

- Framework: Vitest (planned)
- Scope: Zod validations (`src/lib/validation/`), API helpers (`src/lib/api-helpers.ts`), data transformations and utilities (`src/lib/utils.ts`), and React hooks.
- Targets: ≥80% coverage for validations and utils; higher for critical business rules.
- Run (once configured): `npx vitest`

### End-to-end (E2E) tests

- Framework: Playwright (planned)
- Scope: critical user journeys (Auth, Create Plan, Start/Complete/Abandon Session, basic Calendar/Profile flows).
- Stability practices: stable `data-testid` selectors, global auth setup with storage state, retries and tracing on failures.
- Run (once configured): `npx playwright install --with-deps` then `npx playwright test`

For detailed scenarios, environments, and quality gates, see the Test Plan: [docs/plan-testow.md](./docs/plan-testow.md).

## 10. Deployments & Releases

The application is deployed to Cloudflare Pages. The deployment process involves:

1. **Branch Protection:**
   - All changes must be made via pull requests.
   - Pull requests must pass all CI checks (linting, tests, etc.).
   - The `main` branch is protected and can only be updated via merge requests.

2. **CI/CD Pipeline:**
   - GitHub Actions runs on every push to the `main` branch.
   - It builds the project, runs tests, and deploys to Cloudflare Pages.
   - The deployment URL is available in the GitHub Actions workflow logs.

3. **Environment Variables:**
   - Production environment variables are managed via Cloudflare Pages.
   - `.env` files are not committed to the repository.
   - Sensitive data (e.g., API keys, database URLs) are kept in Cloudflare Pages secrets.

4. **Monitoring & Logging:**
   - Cloudflare Pages provides detailed deployment logs and error tracking.
   - Application logs are streamed to Cloudflare's dashboard.
   - Error alerts are configured via Cloudflare Pages.

5. **Rollback Process:**
   - If a deployment fails, Cloudflare Pages automatically rolls back to the previous successful deployment.
   - Manual intervention is required for major issues.
