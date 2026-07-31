# SIAAS — System Design Specification

**Date:** 2026-06-11  
**Project:** Student Intelligence & Academic Analytics System  
**Type:** Semester project — demo for university teachers  
**Status:** Approved for implementation

---

## 1. Project Context

SIAAS is a full-stack academic analytics platform built as a semester project. It is designed to look and feel like a production SaaS product while remaining straightforward to run locally and share with teachers via free hosting.

**Constraints:**
- Runs on a single developer laptop (Windows 11)
- Frontend deployed to Vercel (free)
- Backend deployed to Railway (free tier)
- All data is mock/seeded — no real students
- No external email service — password reset is mocked (token logged to console)
- No Python ML service — predictions and risk scores computed in Spring Boot using weighted formulas

---

## 2. Architecture

### Runtime

```
Browser
  ↓
React (Vite :5173)  —  Zustand + React Query + ShadCN
  ↓
Nginx (:80)  —  reverse proxy in production, serves React static build
  ↓
Spring Boot (:8080)  —  REST API + analytics engine
  ↓              ↓
PostgreSQL      Redis
(:5432)         (:6379)
```

### Monorepo Layout

```
siaas/
├── frontend/
├── backend/
├── db/
│   ├── init.sql       # schema
│   └── seed.sql       # mock data + demo accounts
├── docker/
│   └── nginx.conf
├── docs/
│   └── superpowers/specs/
├── docker-compose.yml
├── .env.example
└── README.md
```

### Key Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| JWT storage | HttpOnly secure cookies | Prevents XSS token theft vs localStorage |
| ML predictions | Spring Boot formulas | No Python service complexity |
| API versioning | `/api/v1/` prefix | Forward compatibility |
| Response shape | `ApiResponse<T>` wrapper | Consistent frontend handling |
| Entity exposure | DTOs only, never entities | No accidental field leaks |
| Primary keys | UUIDs everywhere | No sequential ID exposure |

---

## 3. User Roles

| Role | Frontend | Backend |
|---|---|---|
| Student | Full dashboard, analytics, reports (read-only) | Read access to own data |
| Faculty | Marks entry, attendance marking, analytics view | Write access to marks + attendance |
| Administrator | Full CRUD — students, faculty, subjects, audit logs | Full system access |

---

## 4. UI Design

- **Style:** Glassmorphism — frosted glass cards, deep purple/indigo palette, blurred backgrounds
- **Modes:** Dark (default) + Light toggle
- **Layout:** Collapsible sidebar + topbar + main content area
- **Responsive:** Mobile, tablet, desktop
- **Library:** ShadCN UI components + Tailwind CSS utility classes
- **Animation:** Framer Motion for card entrances and page transitions
- **Charts:** Recharts (bar, pie, area, line, radar, heatmap)

### Dashboard Stat Cards (Student view — 6 cards)

1. CGPA
2. SGPA
3. Attendance %
4. Predicted Score
5. Assignments completed
6. Weak subjects count

> Class Rank and Risk Level removed from dashboard cards per design review.

### Pages

| Route | Page | Role |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Main dashboard | Student |
| `/profile` | Student profile | Student |
| `/academics` | Marks & grades | Student |
| `/academics/score-booster` | Score Booster | Student |
| `/attendance` | Attendance tracker | Student |
| `/analytics` | Full analytics | Student |
| `/planner` | CGPA planner | Student |
| `/recommendations` | Study recommendations | Student |
| `/reports` | Download PDF report | Student |
| `/notifications` | Notification centre | Student |
| `/faculty/*` | Faculty panel | Faculty |
| `/admin/*` | Admin panel | Admin |

### Score Booster Page (new)

Shows every subject sorted **weakest → strongest** (descending by marks needed).

For each subject displays:
- Current score and percentage
- Progress bar from 0 to 100 with 90% target marker
- Marks still needed to reach 90%
- Status chip: Critical / High effort / Moderate / Doable / Almost there / Done

Formula: `marksNeeded = max(0, 90 - currentTotal)`, sorted descending.

---

## 5. Modules

### Module 1 — Authentication
- Registration with email + password
- Login → JWT issued in HttpOnly, Secure, SameSite=Strict cookie
- Refresh token rotation (7-day expiry, rotated on each use)
- Logout clears cookie and invalidates refresh token
- Forgot password → token logged to console (mock)
- RBAC: `@PreAuthorize` annotations on all protected endpoints

### Module 2 — Student Profiles
- Fields: roll number, full name, email, phone, department, branch, semester, section, admission year
- Profile photo stored via `files` table (local disk, swappable to S3)
- Students edit own profile; Admin edits any

### Module 3 — Academic Records
- Subjects: code, name, department, semester number, credits
- Marks per student per subject per semester: internal, external, lab, assignment, total (computed), grade, grade points
- SGPA: weighted average of grade points × credits for current semester
- CGPA: average SGPA across all semesters
- Faculty creates/edits marks; students read-only

### Module 4 — Attendance Management
- Record: student + subject + date + status (Present / Absent / Leave) + marked_by faculty
- Aggregations: percentage per subject, monthly trend, overall
- Forecaster: given current counts, computes classes needed to reach 75 / 80 / 85 / 90%
  - Formula: `classesNeeded = ceil((target × totalClasses - presentClasses) / (1 - target))`

### Module 5 — Performance Analytics
Charts available:
- Subject-wise marks bar chart
- Attendance split pie chart
- CGPA trend line chart (semester over semester)
- Semester comparison area chart
- Academic heatmap (subject × performance bucket → green/yellow/orange/red)
- Radar chart (multi-subject comparison)

### Module 6 — Risk Detection Engine
Risk score 0–100 computed in `RiskDetector.java`:

```
score = 0
if attendance < 75%      → +35
else if attendance < 80% → +20
if avgInternal < 40%     → +25
else if avgInternal < 55%→ +15
if assignmentCompletion < 60% → +20
else if < 80%            → +10
if gradeDropping (SGPA trend negative) → +20
score = min(100, score)
```

Classification: 0–30 = LOW, 31–60 = MEDIUM, 61–100 = HIGH  
Factors stored as JSONB in `risk_scores` table.  
Recalculated daily at 2:00 AM via `@Scheduled`.

### Module 7 — Rank Prediction Engine
Weighted score per student:
- 60% × normalised GPA
- 20% × attendance percentage
- 20% × assignment completion rate

Rank = position in sorted weighted score list.

Output: Best case / Expected / Worst case rank  
(best = optimistic projection, worst = conservative, expected = current)

### Module 8 — CGPA Planner
Input: current CGPA, target CGPA, remaining semesters  
Formula: `requiredSGPA = (target × totalSemesters - currentCGPA × completedSemesters) / remainingSemesters`  
Output: required SGPA per remaining semester + roadmap table

### Module 9 — Recommendation Engine
`RecommendationEngine.java` generates recommendations per student per subject:
- If marks < 50% → "Focus on [weak topic]. Practice [specific problem type]."
- If attendance < 75% → "Attend all remaining [subject] classes to meet the minimum threshold."
- If assignments incomplete → "Complete pending assignments to improve internal score."
- If improving → positive reinforcement message
Stored in `recommendations` table, surfaced on dashboard and recommendation page.

### Module 10 — Score Booster (new page)
Backend: `GET /api/v1/analytics/score-booster/{studentId}`  
Returns subjects sorted by `marksNeeded` descending.  
Each item: subjectName, subjectCode, currentTotal, marksNeeded, percentage, status label.

### Module 11 — PDF Report Generation
Library: iText (Java)  
Content: student info, marks table, attendance summary, CGPA trend chart (embedded), risk analysis, recommendations  
Stored as file in `files` table, linked from `reports` table  
Download: `GET /api/v1/reports/{id}/download` streams the file

### Module 12 — Notifications
In-app only (no email).  
Events: marks updated, attendance below threshold, risk level changed, report generated  
Bell icon in topbar shows unread count  
`GET /api/v1/notifications` returns paginated list

### Module 13 — Audit Logging
Every write operation (marks, attendance, user changes) logs to `audit_logs`:
- user_id, action, entity_type, entity_id, old_value (JSONB), new_value (JSONB), ip_address, timestamp
- Implemented as Spring AOP `@Around` advice on all service write methods
- Visible in Admin panel

### Module 14 — Admin Panel
Full CRUD:
- Students (create, view, edit, delete)
- Faculty (create, view, edit, delete)
- Subjects (create, view, edit, delete)
- Semesters (create, set active)
- System-wide analytics overview
- Audit log viewer with filters

### Module 15 — Faculty Panel
- Enter / edit marks per student per subject
- Mark attendance per class session
- View analytics for their subjects
- View student risk scores

### Module 16 — Future AI Placeholder
`AiService.java` interface with stub implementations:
```java
interface AiService {
    String generateStudyPlan(Student student);
    String answerQuestion(String question, Student context);
    List<String> getInsights(Student student);
}
```
`StubAiService` returns hardcoded strings in dev.  
Swap for `OpenAiService`, `GeminiService`, or `ClaudeService` by changing Spring bean — no other code changes.

---

## 6. Database Schema

18 tables:

| Domain | Tables |
|---|---|
| Identity & Auth | `users`, `refresh_tokens`, `departments` |
| People | `students`, `faculty`, `files` |
| Academics | `semesters`, `subjects`, `marks`, `assignments` |
| Attendance | `attendance` |
| Analytics | `risk_scores`, `recommendations`, `reports` |
| System | `notifications`, `audit_logs` |

Key decisions:
- UUID PKs everywhere
- `risk_scores.factors` → JSONB (flexible risk factor storage)
- `audit_logs.old_value` / `new_value` → JSONB
- `marks.total`, `marks.grade`, `marks.grade_points` → computed and stored
- `files` table abstracts storage path (swap local → S3 without schema change)

---

## 7. API Design

Base path: `/api/v1/`  
Auth: JWT in HttpOnly cookie (sent automatically by browser)  
Response wrapper:
```json
{ "success": true, "data": {}, "message": "OK", "timestamp": "..." }
```

### Endpoints

| Method | Path | Access |
|---|---|---|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| POST | /auth/refresh | Public |
| POST | /auth/logout | Auth |
| POST | /auth/forgot-password | Public |
| GET | /students/me | Student |
| GET | /students/{id} | Faculty+ |
| GET | /students | Admin |
| PUT | /students/{id} | Admin |
| GET | /marks/student/{id} | Auth |
| POST | /marks | Faculty+ |
| PUT | /marks/{id} | Faculty+ |
| GET | /subjects | Auth |
| POST | /subjects | Admin |
| PUT | /subjects/{id} | Admin |
| DELETE | /subjects/{id} | Admin |
| GET | /attendance/student/{id} | Auth |
| POST | /attendance/mark | Faculty+ |
| GET | /attendance/forecast/{id} | Auth |
| GET | /analytics/dashboard/{id} | Auth |
| GET | /analytics/risk/{id} | Auth |
| GET | /analytics/rank/{id} | Auth |
| GET | /analytics/recommendations/{id} | Auth |
| GET | /analytics/score-booster/{id} | Auth |
| GET | /planner/cgpa | Auth |
| POST | /reports/generate/{studentId} | Auth |
| GET | /reports/{id}/download | Auth |
| GET | /notifications | Auth |
| PUT | /notifications/{id}/read | Auth |
| GET | /admin/audit-logs | Admin |
| GET | /admin/stats | Admin |
| GET | /admin/students | Admin |
| POST | /admin/students | Admin |
| DELETE | /admin/students/{id} | Admin |
| GET | /admin/faculty | Admin |
| POST | /admin/faculty | Admin |
| DELETE | /admin/faculty/{id} | Admin |

Swagger/OpenAPI docs: `GET /swagger-ui.html`

---

## 8. Backend Structure

```
src/main/java/com/siaas/
├── auth/
├── students/
├── faculty/
├── academics/
│   ├── subjects/
│   ├── marks/
│   ├── semesters/
│   └── assignments/
├── attendance/
├── analytics/
│   ├── CgpaCalculator.java
│   ├── RiskDetector.java
│   ├── RankPredictor.java
│   ├── RecommendationEngine.java
│   ├── ScoreBoosterService.java
│   └── AttendanceForecaster.java
├── planner/
├── reports/
├── notifications/
├── audit/
├── admin/
├── faculty_panel/
├── storage/
├── scheduler/
├── ai/                    # future AI placeholder
├── security/
├── config/
├── exceptions/
└── common/
```

Every module: Controller → Service → Repository → DTO (MapStruct mapping)

---

## 9. Frontend Structure

```
src/
├── features/
│   ├── auth/              # login, register pages + auth store
│   ├── dashboard/         # main dashboard page
│   ├── profile/           # student profile
│   ├── academics/         # marks, score-booster
│   ├── attendance/        # attendance page + forecast
│   ├── analytics/         # charts, heatmap, radar
│   ├── planner/           # CGPA planner
│   ├── recommendations/   # recommendation cards
│   ├── reports/           # PDF download
│   ├── notifications/     # notification centre
│   ├── faculty/           # faculty panel
│   └── admin/             # admin panel
├── components/            # shared: Button, Card, Modal, Table, Chart wrappers
├── layouts/               # AppLayout (sidebar+topbar), AuthLayout
├── routes/                # React Router v6 config + ProtectedRoute
├── services/              # Axios instances + API call functions
├── store/                 # Zustand: authStore, uiStore
├── hooks/                 # useAuth, useStudent, useAnalytics
├── utils/                 # formatters, grade calculators
├── types/                 # TypeScript interfaces
└── assets/
```

---

## 10. Docker & Deployment

### Local (docker-compose up --build)

| Service | Image | Port |
|---|---|---|
| nginx | custom (routes traffic) | 80 |
| frontend | node:18-alpine (Vite build) | 5173 |
| backend | eclipse-temurin:17-alpine | 8080 |
| postgres | postgres:15-alpine | 5432 |
| redis | redis:7-alpine | 6379 |

Startup order: postgres + redis → backend → frontend → nginx  
Health checks on postgres and redis before backend starts.

### Free Cloud Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel — connect GitHub, set root to `frontend/` |
| Backend | Railway — Maven auto-detected, add Postgres + Redis plugins |
| PostgreSQL | Railway addon |
| Redis | Railway addon |

### Demo Accounts (auto-seeded)

| Role | Email | Password |
|---|---|---|
| Admin | admin@siaas.dev | Admin@123 |
| Faculty | faculty@siaas.dev | Faculty@123 |
| Student | student@siaas.dev | Student@123 |

---

## 11. Redis Strategy

| Key | Data | TTL |
|---|---|---|
| `dashboard:{studentId}` | Dashboard card values | 5 min |
| `analytics:{studentId}` | Full analytics response | 10 min |
| `rank:{semesterId}` | Sorted rank list | 15 min |
| `refresh:{tokenHash}` | Refresh token validity | 7 days |

Cache invalidated on marks or attendance write.

---

## 12. Background Jobs

| Job | Trigger |
|---|---|
| Risk score recalculation | `@Scheduled` — daily 02:00 |
| Rank recalculation | Event-driven — after marks update |
| Attendance summary | `@Scheduled` — daily 23:59 |
| Notification dispatch | `@Scheduled` — every 15 min |

---

## 13. Security

- JWT in HttpOnly + Secure + SameSite=Strict cookies
- Refresh token rotation on every use, revoked on logout
- BCrypt (strength 12) for password hashing
- `@PreAuthorize` role checks at service layer
- `GlobalExceptionHandler` — no stack traces in responses
- `@Valid` on all request DTOs
- AOP audit logging on all write operations
- Rate limiting via Nginx (`limit_req_zone`)

---

## 14. Out of Scope

- Real email delivery (mocked — token printed to console)
- Real ML model training (formulas used instead)
- File upload to cloud storage (local disk only)
- Real student data (all mock/seeded)
- Mobile app
- WebSocket real-time updates
