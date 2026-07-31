# SIAAS Admin Panel — Design Spec

**Date:** 2026-06-13  
**Status:** Approved  
**Scope:** Admin Panel (Plan 3A) — precedes Faculty Portal (Plan 3B)

---

## Goal

Give the admin role a full management UI at `/admin/*` to control the entire SIAAS system: user accounts (students and faculty), academic structure (departments, semesters, subjects), faculty-subject assignments, and mark/attendance overrides.

---

## Architecture

**Frontend:** New `AdminLayout` + pages inside the existing React app. Lives under `/admin/*`, already protected by `<ProtectedRoute allowedRoles={['ADMIN']}>` in `App.tsx`. Uses the same dark glassmorphism design system (violet accents, `rounded-2xl` cards, white/slate palette) as the student portal.

**Backend:** New `AdminController` at `/api/v1/admin/*`, secured with `@PreAuthorize("hasRole('ADMIN')")`. Uses existing JPA repositories where possible; adds new ones for admin-specific queries.

**DB change:** One new table — `faculty_subjects` — to record which faculty member teaches which subject. All other tables (`users`, `students`, `faculty`, `departments`, `semesters`, `subjects`, `marks`, `attendance`) already exist.

---

## New DB Table

```sql
CREATE TABLE faculty_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id   UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id   UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (faculty_id, subject_id)
);
```

Added to the Docker init SQL and seeded in `DataInitializer` (assign all 6 seed subjects to the seed faculty).

---

## Screens

### 1. Admin Dashboard `/admin/dashboard`
- **4 stat cards:** Total students, total faculty, active subjects (current semester), departments
- **Recent students panel:** Latest 5 students with roll number + semester, "View all →" link
- **Faculty assignments panel:** Latest 5 faculty with their assigned subject codes, "View all →" link

### 2. Students `/admin/students`
- Searchable table (search by name or roll number)
- Columns: Full name, Roll number, Semester, Section, Department, Status (active/inactive), Actions
- **Add Student** button → slide-over form: email, password, full name, roll number, semester, section, department (dropdown), admission year
- **Edit** per row → same form pre-filled
- **Deactivate/Activate** toggle (sets `is_active` on `users` table — does not delete)

### 3. Faculty `/admin/faculty`
- Searchable table (search by name or employee ID)
- Columns: Full name, Employee ID, Designation, Department, Assigned Subjects, Status, Actions
- **Add Faculty** button → form: email, password, full name, employee ID, designation, department (dropdown), subjects (multi-select checkboxes from active subjects)
- **Edit** per row → same form pre-filled; subject assignment updates `faculty_subjects`
- **Deactivate/Activate** toggle

### 4. Departments `/admin/departments`
- Simple list table: Name, Code, Actions
- Add / Edit / Delete (delete blocked if students or faculty are linked — show error)

### 5. Semesters `/admin/semesters`
- List table: Name (e.g. "Semester 6 — 2026"), Year, Semester number, Actions
- Add / Edit / Delete (delete blocked if marks exist for that semester)

### 6. Subjects `/admin/subjects`
- List table: Name, Code, Department, Credits, Actions
- Add / Edit / Delete (delete blocked if marks or attendance reference the subject)

### 7. Mark Override `/admin/marks`
- **Step 1:** Search student by name or roll number
- **Step 2:** Semester dropdown → table of all subject marks for that student
- **Columns:** Subject, Internal, External, Lab, Assignment, Total (auto), Grade (auto), Edit
- Clicking **Edit** makes that row's input fields editable inline
- **Save** PATCHes the marks record; backend recalculates `total` (internal + external + lab + assignment) and re-derives `grade` + `grade_points` from the grading scale
- **Cancel** restores original values

### 8. Attendance Override `/admin/attendance`
- **Step 1:** Search student by name or roll number
- **Step 2:** Subject dropdown → list of all attendance records for that student in that subject
- Each row: Date, Status (PRESENT/ABSENT toggle), Save
- Admin can flip individual records from PRESENT ↔ ABSENT

---

## Backend Endpoints

All under `/api/v1/admin/`, all require `ROLE_ADMIN`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/stats` | Dashboard stat counts |
| GET/POST | `/admin/students` | List (with search) / create |
| GET/PUT/PATCH | `/admin/students/{id}` | Get / update / toggle active |
| GET/POST | `/admin/faculty` | List (with search) / create |
| GET/PUT/PATCH | `/admin/faculty/{id}` | Get / update / toggle active |
| GET/PUT | `/admin/faculty/{id}/subjects` | Get assigned subjects / replace all |
| GET/POST | `/admin/departments` | List / create |
| GET/PUT/DELETE | `/admin/departments/{id}` | Get / update / delete |
| GET/POST | `/admin/semesters` | List / create |
| GET/PUT/DELETE | `/admin/semesters/{id}` | Get / update / delete |
| GET/POST | `/admin/subjects` | List / create |
| GET/PUT/DELETE | `/admin/subjects/{id}` | Get / update / delete |
| GET | `/admin/marks?studentId=&semesterId=` | Marks for override page |
| PATCH | `/admin/marks/{id}` | Update mark fields, recalculate total/grade |
| GET | `/admin/attendance?studentId=&subjectId=` | Attendance for override page |
| PATCH | `/admin/attendance/{id}` | Flip PRESENT ↔ ABSENT |

---

## Grading Scale (for mark recalculation)

Derived from existing seed data (DSA=91→O, CN=85→A+, SE=78→B+, OS=72→B+, TOC=65→C, DBMS=62→C):

| Total | Grade | Points |
|-------|-------|--------|
| 90–100 | O | 10.0 |
| 80–89 | A+ | 9.0 |
| 70–79 | B+ | 7.0 |
| 60–69 | C | 5.0 |
| 50–59 | B | 6.0 |
| 40–49 | D | 4.0 |
| < 40 | F | 0.0 |

Backend `AdminService.recalculate(total)` implements this as a chain of if/else returning grade + grade_points.

---

## Frontend File Map

| File | Purpose |
|------|---------|
| `frontend/src/components/layout/AdminLayout.tsx` | Sidebar + `<Outlet />` wrapper for admin routes |
| `frontend/src/components/layout/AdminSidebar.tsx` | Three-group nav: Accounts / Academic Setup / Overrides |
| `frontend/src/pages/admin/AdminDashboardPage.tsx` | Stats + recent panels |
| `frontend/src/pages/admin/StudentsPage.tsx` | Student list + add/edit slide-over |
| `frontend/src/pages/admin/FacultyPage.tsx` | Faculty list + add/edit + subject assignment |
| `frontend/src/pages/admin/DepartmentsPage.tsx` | Department CRUD |
| `frontend/src/pages/admin/SemestersPage.tsx` | Semester CRUD |
| `frontend/src/pages/admin/SubjectsPage.tsx` | Subject CRUD |
| `frontend/src/pages/admin/MarksOverridePage.tsx` | Mark override flow |
| `frontend/src/pages/admin/AttendanceOverridePage.tsx` | Attendance override flow |
| `frontend/src/types/admin.ts` | TypeScript interfaces for all admin entities |
| `frontend/src/api/admin.ts` | API functions for all admin endpoints |

Routes added to `App.tsx` under the existing `<ProtectedRoute allowedRoles={['ADMIN']}>` block.

---

## Backend File Map

| File | Purpose |
|------|---------|
| `backend/.../admin/AdminController.java` | All admin REST endpoints |
| `backend/.../admin/AdminService.java` | Business logic, grading scale recalculation |
| `backend/.../admin/dto/*.java` | Request/response DTOs (StudentRequest, FacultyRequest, etc.) |
| `backend/.../academic/FacultySubject.java` | JPA entity for `faculty_subjects` table |
| `backend/.../academic/FacultySubjectRepository.java` | JPA repo |
| `backend/src/test/.../admin/AdminControllerTest.java` | MockMvc tests for all endpoints |

---

## Security

- All `/api/v1/admin/**` paths protected by `@PreAuthorize("hasRole('ADMIN')")` at method level
- Already permitted through Spring Security filter chain (authenticated → method security handles role check)
- No admin endpoint is exposed to STUDENT or FACULTY roles

---

## Out of Scope (this plan)

- Bulk CSV import of students/faculty
- Notification sending from admin panel
- Report/PDF generation
- Audit log of admin actions
- Faculty Portal (Plan 3B — follows this)
