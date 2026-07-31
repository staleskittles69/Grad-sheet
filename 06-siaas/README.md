# Student Intelligence & Academic Analytics System (SIAAS)

A full-stack academic management platform built as a semester project — designed to look and run like a real production SaaS product (Docker Compose stack, reverse proxy, JWT auth, RBAC) while staying simple enough to demo from a laptop.

This document covers not just what the system does, but **why it's built the way it is** — the tradeoffs behind auth, persistence, API shape, and the dev environment, so a future contributor (including future-you) doesn't have to reverse-engineer the reasoning from the code.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, ShadCN UI |
| State | Zustand (auth/UI state), Axios (API calls) |
| Backend | Spring Boot 3.2, Java 17, Maven |
| Auth | Spring Security, JWT (HttpOnly cookies), rotating refresh tokens |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (provisioned, not yet wired into any service) |
| Proxy | Nginx |
| DevOps | Docker, Docker Compose |

---

## Architecture

```
Browser
  ↓  http://localhost  (single origin)
Nginx (:80)
  ├─ /api/*  → Spring Boot (:8080)
  └─ /*      → Vite dev server (:5173)
       ↓                ↓
   PostgreSQL        Redis
   (:5432)           (:6379)
```

**Why put nginx in front of two dev servers instead of hitting them directly?**
Because the frontend and backend need to *appear* same-origin to the browser. The React app's Axios client calls a relative path (`/api/v1/...`), not an absolute URL — so whatever origin served the page also serves the API, and the browser never treats the request as cross-origin. This sidesteps an entire class of CORS/cookie problems (SameSite cookies, preflight requests, `Access-Control-Allow-*` headers) that would otherwise exist between `:5173` and `:8080`. It also matches how the app will actually be deployed later — one public URL in front of two services — so local dev behaves the same as production instead of diverging from it.

Nginx does exactly two jobs: route `/api/*` and `/swagger-ui/*` to Spring Boot, and everything else to Vite. See `docker/nginx.conf`.

---

## Key Design Decisions

### Authentication: JWT in HttpOnly cookies, not localStorage + rotating refresh tokens

**Decision:** On login, the backend issues two cookies — a short-lived `access_token` (15 min JWT) and a long-lived `refresh_token` (7-day opaque random UUID) — both `HttpOnly`, `Path=/`, `SameSite=Lax`. See `AuthService.issueTokens()`.

**Why HttpOnly cookies over localStorage:** A JWT in localStorage is readable by any JavaScript on the page, so a single XSS bug anywhere in the app (a third-party npm package, a rendering bug, anything) hands an attacker the token directly. `HttpOnly` cookies are invisible to JS entirely — the browser attaches them automatically, and `axios` just needs `withCredentials: true` (see `frontend/src/api/client.ts`). The tradeoff is manual CSRF consideration, which is why cookies are `SameSite=Lax` rather than `None`.

**Why the refresh token is a random UUID, not a JWT:** It's stored server-side by its *hash*, not its raw value (`RefreshTokenService.sha256()` before insert). If the `refresh_tokens` table ever leaked, an attacker gets hashes they can't turn back into usable tokens — the same principle as password hashing, applied to session tokens. Compare this to the access token, which is a stateless signed JWT: cheap to verify on every request (no DB hit), but that statelessness is exactly why it's kept short-lived (15 min) — there's no server-side revocation list for it, so the blast radius of a leaked access token is capped by its expiry.

**Why rotation on every refresh:** `RefreshTokenService.validateAndRevoke()` marks the old refresh token `revoked = true` in the same transaction that issues a new one. If a refresh token is ever stolen and used by both the attacker and the legitimate user, the second use fails outright (already revoked) — that failure is itself the signal that theft occurred, rather than the two parties silently sharing a session indefinitely.

**Why registration always creates a STUDENT, never FACULTY/ADMIN:** Look at `AuthService.register()` — `Role.STUDENT` is hardcoded, not taken from the request body. The public `/auth/register` endpoint has to exist for self-service student signup, but if role were client-supplied, anyone could `POST` `"role": "ADMIN"` and grant themselves full system access. Faculty and Admin accounts are provisioned only through the Admin panel (`AdminController`) or the startup seeder — i.e., only by someone who already has elevated privilege.

**Known local-dev gap:** the cookies are *not* marked `Secure`, because local Docker Compose serves everything over plain HTTP (`http://localhost`), and browsers silently drop `Secure` cookies on non-HTTPS origins. This is fine for a laptop demo but must be added back (`Secure`, and probably `SameSite=Strict`) before any real deployment behind HTTPS.

### Identity model: one `users` table, thin per-role profile tables

**Decision:** Auth identity (`users`: email, password hash, role, active/verified flags) lives in one table. `students` and `faculty` are separate tables that `FK → users.id`, holding only role-specific data (roll number, semester, department vs. designation, employee ID).

**Why split it this way instead of one big `users` table with nullable role-specific columns:** Every write to marks, attendance, or profile data hangs off `student_id`/`faculty_id`, not `user_id` — so the domain tables don't need to care about auth at all, and the auth tables don't accumulate a growing pile of nullable columns as more roles get added. `Role` on `users` answers "what can this person do"; the profile tables answer "who are they academically." Admin has neither profile row — they're pure `users` + role.

### Primary keys: UUIDs everywhere, never auto-increment integers

Sequential integer IDs leak information (`/students/42` implies `41` exists, and roughly how many students there are) and make it trivial to enumerate every record by incrementing a URL. UUIDs generated via `uuid_generate_v4()` cost a little more index space but close that off entirely, and they let the seeder (`DataInitializer`) hardcode deterministic IDs for demo data (`DEPT_ID`, `SUBJ_DSA`, etc.) that stay stable across container rebuilds — impossible to do cleanly with auto-increment.

### Backend persistence: JPA for domain logic, raw `JdbcTemplate` for simple inserts

**What you'll see:** Most of the backend uses Spring Data JPA repositories (`StudentRepository`, `MarksRepository`, etc.). But `AuthService.register()` and parts of `AdminService` reach for `JdbcTemplate` directly to insert a `students` row.

**Why not JPA everywhere:** Registration needs to insert one denormalized row (student profile) as a side effect of creating a user — there's no real domain behavior around it (no business rules, no relationships to navigate), so a full JPA entity + repository + mapper for a single `INSERT` would be pure ceremony. `JdbcTemplate` is used where persistence is genuinely just persistence; JPA is used where there's actual object behavior worth modeling.

**A real bug this caused, and the fix:** Early on, `AdminService` was creating a `User` and its dependent `Student`/`Faculty` row in the same transaction using `save()`, which just queues the `INSERT` — it doesn't necessarily flush before the dependent row's `INSERT` runs, and Postgres was rejecting the foreign key (`user_id` didn't exist yet from the DB's point of view). The fix was switching to `saveAndFlush()` on the parent (`AdminController.java` — see the two `saveAndFlush` calls), forcing the `INSERT` to hit the database before the dependent insert fires. This is the kind of bug that only shows up under FK constraints, not in an in-memory test — worth remembering if a similar parent/child creation pattern gets added elsewhere.

### API conventions

- **`/api/v1/` prefix on everything** — so a breaking v2 can be introduced later without an in-place migration of every existing client.
- **Every response wrapped in `ApiResponse<T>`** (`{ success, message, data, error, timestamp }`) — the frontend has exactly one shape to parse regardless of endpoint, instead of some endpoints returning bare arrays and others returning objects.
- **DTOs in, DTOs out — entities never cross the controller boundary.** `AdminController` takes `StudentRequest`, returns `StudentSummaryResponse`; the JPA `Student` entity is never serialized directly. This means adding a column to an entity can't accidentally leak it to the API — it has to be deliberately added to a DTO first.
- **`GlobalExceptionHandler` maps exceptions to HTTP status, and logs unhandled ones.** Domain exceptions (`ResourceNotFoundException` → 404, `ConflictException` → 409, `BadCredentialsException` → 401) give the frontend a predictable status to branch on. The catch-all `Exception` handler returns a generic "An unexpected error occurred" message with no stack trace to the client — but logs the real exception server-side (`log.error("Unhandled exception", ex)`), so debugging info isn't lost, just kept off the wire.

### Docker Compose: health-check-gated startup order

**Decision:** `backend` has `depends_on: { postgres: condition: service_healthy, redis: condition: service_healthy }`, not a plain `depends_on: [postgres, redis]`.

**Why:** Plain `depends_on` only waits for the container to *start*, not for Postgres to actually be accepting connections — Spring Boot would race Postgres's own startup and crash-loop on the first few connection attempts. The healthchecks (`pg_isready`, `redis-cli ping`) give Compose a real readiness signal to gate on, so `backend` only starts once its dependencies can actually serve requests. `nginx` in turn depends on `backend` and `frontend` (started, not healthy — neither publishes a healthcheck currently) so it doesn't proxy into a 502 immediately, though it will retry successfully within a second or two either way given nginx's own connection retry behavior.

### Seed data: idempotent, deterministic, separate from schema migrations

`db/init.sql` only creates schema (tables, indexes, constraints). `db/seed.sql` inserts static reference data (department, semester, subject catalog) that's genuinely part of "what this deployment looks like," not demo content. The three demo **accounts**, by contrast, are seeded by `DataInitializer.java` at Spring Boot startup, not by SQL — because they need BCrypt-hashed passwords, and hashing needs the app's actual `BCryptPasswordEncoder` bean, not something you can precompute into a `.sql` file without hardcoding a hash. `DataInitializer` checks `alreadySeeded()` (does `admin@siaas.dev` already exist?) before inserting anything, so restarting the stack — or recreating just the `backend` container against an existing `postgres` volume — never duplicates or resets demo data.

### Testing: real `SecurityConfig` imported per controller test, not disabled

Early integration tests hit a wall where `AdminControllerTest`/`HealthControllerTest`/`AuthControllerTest` all returned 403 on endpoints that should have been reachable — because `@WebMvcTest` slices don't load the app's actual `SecurityConfig` bean by default, so Spring Security fell back to its own locked-down default (deny everything). The fix wasn't to disable security in tests (which would stop testing the real authorization rules at all) but to explicitly `@Import(SecurityConfig.class)` into each controller test — so tests exercise the actual permit/deny rules that run in production, cookie-based auth included (tests build requests with real `Cookie` objects rather than raw header strings, matching how the browser actually authenticates).

---

## Database Schema

18 tables across 6 domains, defined in `db/init.sql`:

| Domain | Tables |
|---|---|
| Identity & Auth | `users`, `refresh_tokens`, `departments` |
| People | `students`, `faculty`, `files` |
| Academics | `semesters`, `subjects`, `marks`, `assignments` |
| Attendance | `attendance` |
| Analytics (schema exists, engines not yet built — see Project Status) | `risk_scores`, `recommendations`, `reports` |
| System | `notifications`, `audit_logs` |

Notable column choices:
- `marks.total`, `.grade`, `.grade_points` are computed once and **stored**, not recalculated on every read — they change only when a mark is entered/edited, so recomputing on every dashboard load would be wasted work.
- `risk_scores.factors` and `audit_logs.old_value`/`new_value` are `JSONB` — the shape of "what factors drove this risk score" or "what changed in this edit" varies per row and doesn't need its own relational structure; JSONB keeps it queryable without a rigid schema.
- `files` abstracts storage as `stored_path` + metadata, not a BLOB — so local disk storage can be swapped for S3/Cloudinary later by changing the storage service, without touching any table that references a file.

---

## API Surface (currently implemented)

Base path: `/api/v1/`. Every response uses the `ApiResponse<T>` wrapper described above.

| Group | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `GET /auth/me` | Public / Auth |
| Student (self-service, read-only) | `GET /student/profile`, `/student/dashboard`, `/student/academics` | Student |
| Admin | Full CRUD on `/admin/students`, `/admin/faculty`, `/admin/departments`, `/admin/semesters`, `/admin/subjects`; read-only `/admin/marks`, `/admin/attendance`; `/admin/stats` | Admin |
| Health | `GET /health` | Public |

Swagger/OpenAPI docs: `http://localhost:8080/swagger-ui.html` (or `http://localhost/swagger-ui/index.html` through nginx).

**Not yet implemented as backend endpoints**, despite existing as frontend pages or original design-spec sections: analytics dashboard, risk detection, rank prediction, CGPA planner, recommendations engine, PDF reports, notifications, faculty-facing marks/attendance entry. See **Project Status** below — this README describes the system as it actually runs today, not the full original spec.

---

## Security

- JWT in `HttpOnly` cookies, `SameSite=Lax` (not yet `Secure` — see Auth section above for why, and what's needed before real deployment)
- Refresh tokens stored as SHA-256 hashes, rotated (revoked + reissued) on every use
- BCrypt password hashing, strength 12
- Public registration is hardcoded to the `STUDENT` role — no client-controlled privilege escalation path
- `GlobalExceptionHandler` — no stack traces ever reach the client; unhandled exceptions are logged server-side instead
- `@Valid` on all request DTOs
- Role checks enforced via Spring Security's `authorizeHttpRequests` matchers in `SecurityConfig`

---

## Project Status

**Actually built and working:**
- Full Docker Compose stack (Postgres, Redis, Spring Boot, Vite, Nginx) with health-check-gated startup
- Complete 18-table schema + deterministic seed data
- Auth: register (student self-service), login, logout, refresh rotation, `/me`
- Admin panel backend: full CRUD for students, faculty, departments, semesters, subjects; read access to marks/attendance; system stats
- Student self-service: profile, dashboard, academics (read-only)
- Frontend: login/register (with one-click demo-account buttons), dashboard, profile, academics, attendance, admin panel pages, protected routing by role

**Designed (schema + spec exist) but not yet implemented:**
- Risk detection, rank prediction, CGPA planner, recommendation engine, score booster — these have frontend pages and/or DB tables (`risk_scores`, `recommendations`) but no backend service computing real values yet
- Faculty panel backend (marks entry, attendance marking) — `Faculty` entity and repository exist, no controller
- PDF report generation, in-app notifications, audit log writing (the `audit_logs` table and AOP-based logging described in the original design spec is not implemented — only exception logging exists today)
- Redis is provisioned and healthy in the stack but nothing currently reads or writes through it

If you're picking this project back up, the original design intent (including formulas for risk scoring, rank prediction, and the attendance forecaster) is preserved in `docs/superpowers/specs/2026-06-11-siaas-design.md` — that document is more aspirational than descriptive of current code, but it's the right starting point for implementing any of the above.

---

## Running Locally

**Prerequisites:** Docker Desktop running. Nothing else — the frontend and backend both build inside containers.

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| App (via nginx) | http://localhost |
| Backend API directly | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

**Demo accounts** (seeded automatically on first backend startup):

| Role | Email | Password |
|---|---|---|
| Admin | admin@siaas.dev | Admin@123 |
| Faculty | faculty@siaas.dev | Faculty@123 |
| Student | student@siaas.dev | Student@123 |

The login page also has one-click buttons for each demo account.

**If the stack is already running and you only changed `.env`:** the affected service needs a restart to pick up the new values — `docker compose up -d <service>` (Compose detects the config hash changed and recreates just that container; named volumes like `pgdata` persist across recreation, so no data is lost).
