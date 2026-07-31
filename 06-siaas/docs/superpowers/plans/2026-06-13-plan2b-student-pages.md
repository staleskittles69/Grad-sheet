# Plan 2B: Remaining Student Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all remaining student pages — Academics, Attendance, Analytics, CGPA Planner, Recommendations, and Profile — replacing the current placeholders.

**Architecture:** One new backend endpoint (`/academics`) returns all-semester marks grouped by semester. All other new pages are frontend-only and reuse the existing `['dashboard']` React Query cache (no extra API calls). `recharts` is already installed at `^2.12.4`.

**Tech Stack:** Spring Boot 3 / JPA, React 18 / TypeScript / Tailwind, @tanstack/react-query v5, recharts ^2.12.4, lucide-react, Zustand (auth)

---

## Seed data reference (for test assertions)

Student: `student@siaas.dev / Student@123`, name "Rahul Singh", roll "CS21B001", semester 6, section "B".

Semester: `"Semester 6 — 2026"` (em-dash, not hyphen).

Marks (6 subjects):

| Code  | Name                           | Credits | Int | Ext | Lab | Assgn | Total | Grade | GP  |
|-------|--------------------------------|---------|-----|-----|-----|-------|-------|-------|-----|
| CS601 | Data Structures & Algorithms   | 4       | 22  | 58  | 7   | 4     | 91    | O     | 10  |
| CS602 | Operating Systems              | 4       | 20  | 42  | 5   | 5     | 72    | B+    | 7   |
| CS603 | Database Management Systems    | 4       | 14  | 33  | 8   | 7     | 62    | C     | 5   |
| CS604 | Computer Networks              | 3       | 21  | 52  | 7   | 5     | 85    | A+    | 9   |
| CS605 | Theory of Computation          | 3       | 16  | 38  | 6   | 5     | 65    | C     | 5   |
| CS606 | Software Engineering           | 3       | 19  | 46  | 7   | 6     | 78    | B+    | 7   |

SGPA = (10×4 + 7×4 + 5×4 + 9×3 + 5×3 + 7×3) / 21 = 151/21 ≈ 7.19

---

## File Map

**Backend — create:**
- `backend/src/main/java/com/siaas/student/dto/AcademicsResponse.java`

**Backend — modify:**
- `backend/src/main/java/com/siaas/student/StudentService.java` (add `getAcademics()`)
- `backend/src/main/java/com/siaas/student/StudentController.java` (add `GET /academics`)
- `backend/src/test/java/com/siaas/student/StudentControllerTest.java` (add 2 tests)

**Frontend — create:**
- `frontend/src/types/academics.ts`
- `frontend/src/types/profile.ts`
- `frontend/src/api/academics.ts`
- `frontend/src/api/profile.ts`
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/pages/AcademicsPage.tsx`
- `frontend/src/pages/AttendancePage.tsx`
- `frontend/src/pages/AnalyticsPage.tsx`
- `frontend/src/pages/CGPAPlannerPage.tsx`
- `frontend/src/pages/RecommendationsPage.tsx`

**Frontend — modify:**
- `frontend/src/App.tsx` (replace placeholder routes with real pages)

---

## Task 1: Academics Backend (DTO + Service + Controller + Tests)

**Files:**
- Create: `backend/src/main/java/com/siaas/student/dto/AcademicsResponse.java`
- Modify: `backend/src/main/java/com/siaas/student/StudentService.java`
- Modify: `backend/src/main/java/com/siaas/student/StudentController.java`
- Modify: `backend/src/test/java/com/siaas/student/StudentControllerTest.java`

- [ ] **Step 1: Write the failing tests first**

Add these two tests to the existing `StudentControllerTest.java`. The file currently has 4 tests; append these:

```java
@Test
void academics_withoutAuth_returns401() throws Exception {
    mvc.perform(get("/api/v1/student/academics"))
        .andExpect(status().isUnauthorized());
}

@Test
void academics_withStudentAuth_returns200WithSemesters() throws Exception {
    String loginBody = """
        {"email":"student@siaas.dev","password":"Student@123"}
        """;
    MvcResult loginResult = mvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(loginBody))
        .andExpect(status().isOk())
        .andReturn();

    String cookie = loginResult.getResponse().getHeader("Set-Cookie");

    mvc.perform(get("/api/v1/student/academics")
            .header("Cookie", cookie))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.semesters").isArray())
        .andExpect(jsonPath("$.data.semesters.length()").value(1))
        .andExpect(jsonPath("$.data.semesters[0].semesterName").value("Semester 6 — 2026"))
        .andExpect(jsonPath("$.data.semesters[0].subjects.length()").value(6));
}
```

> Note: `—` is the em-dash character — matches the seed value `"Semester 6 — 2026"`.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd backend
./mvnw test -pl . -Dtest=StudentControllerTest#academics_withStudentAuth_returns200WithSemesters -q 2>&1 | tail -10
```

Expected: `NoSuchBeanDefinitionException` or 404 because the endpoint doesn't exist yet.

- [ ] **Step 3: Create AcademicsResponse DTO**

```java
// backend/src/main/java/com/siaas/student/dto/AcademicsResponse.java
package com.siaas.student.dto;

import java.util.List;

public record AcademicsResponse(List<SemesterRecord> semesters) {

    public record SemesterRecord(
        String semesterName,
        double sgpa,
        List<SubjectResult> subjects
    ) {}

    public record SubjectResult(
        String code,
        String name,
        int credits,
        double internal,
        double external,
        double lab,
        double assignment,
        double total,
        String grade,
        double gradePoints
    ) {}
}
```

- [ ] **Step 4: Add `getAcademics()` to StudentService**

Add the following import at the top of `StudentService.java` (alongside existing imports):

```java
import com.siaas.student.dto.AcademicsResponse;
import java.util.LinkedHashMap;
```

Add this method inside the `StudentService` class (after `getDashboard`):

```java
public AcademicsResponse getAcademics(User user) {
    Student student = getStudentOrThrow(user);
    List<Marks> allMarks = marksRepository.findAllByStudent(student);

    Map<String, List<Marks>> bySemester = new LinkedHashMap<>();
    for (Marks m : allMarks) {
        bySemester.computeIfAbsent(m.getSemester().getName(), k -> new ArrayList<>()).add(m);
    }

    List<AcademicsResponse.SemesterRecord> semesters = new ArrayList<>();
    for (Map.Entry<String, List<Marks>> entry : bySemester.entrySet()) {
        List<Marks> marks = entry.getValue();
        double sgpa = computeWeightedGpa(marks);

        List<AcademicsResponse.SubjectResult> subjects = marks.stream()
            .map(m -> new AcademicsResponse.SubjectResult(
                m.getSubject().getCode(),
                m.getSubject().getName(),
                m.getSubject().getCredits(),
                m.getInternal(),
                m.getExternal(),
                m.getLab(),
                m.getAssignment(),
                m.getTotal(),
                m.getGrade(),
                m.getGradePoints()
            ))
            .toList();

        semesters.add(new AcademicsResponse.SemesterRecord(entry.getKey(), sgpa, subjects));
    }

    return new AcademicsResponse(semesters);
}
```

- [ ] **Step 5: Add `/academics` endpoint to StudentController**

Add import and method to `StudentController.java`:

```java
import com.siaas.student.dto.AcademicsResponse;
```

Add inside the class after the `/dashboard` method:

```java
@GetMapping("/academics")
public ResponseEntity<ApiResponse<AcademicsResponse>> academics(
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(ApiResponse.ok(studentService.getAcademics(user)));
}
```

- [ ] **Step 6: Run all 6 tests — expect PASS**

```bash
./mvnw test -pl . -Dtest=StudentControllerTest -q 2>&1 | tail -10
```

Expected:
```
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- [ ] **Step 7: Run full backend suite**

```bash
./mvnw test -q 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/siaas/student/dto/AcademicsResponse.java \
        backend/src/main/java/com/siaas/student/StudentService.java \
        backend/src/main/java/com/siaas/student/StudentController.java \
        backend/src/test/java/com/siaas/student/StudentControllerTest.java
git commit -m "feat(student): add /academics endpoint with all-semester marks grouped by semester"
```

---

## Task 2: Frontend Types & API Functions

**Files:**
- Create: `frontend/src/types/academics.ts`
- Create: `frontend/src/types/profile.ts`
- Create: `frontend/src/api/academics.ts`
- Create: `frontend/src/api/profile.ts`

- [ ] **Step 1: Create academics TypeScript types**

```typescript
// frontend/src/types/academics.ts
export interface SubjectResult {
  code: string
  name: string
  credits: number
  internal: number
  external: number
  lab: number
  assignment: number
  total: number
  grade: string
  gradePoints: number
}

export interface SemesterRecord {
  semesterName: string
  sgpa: number
  subjects: SubjectResult[]
}

export interface AcademicsData {
  semesters: SemesterRecord[]
}
```

- [ ] **Step 2: Create profile TypeScript types**

```typescript
// frontend/src/types/profile.ts
export interface ProfileData {
  fullName: string
  email: string
  rollNumber: string
  semester: number
  section: string
}
```

- [ ] **Step 3: Create academics API function**

Pattern matches existing `api/dashboard.ts`.

```typescript
// frontend/src/api/academics.ts
import client from './client'
import type { ApiResponse } from '../types/auth'
import type { AcademicsData } from '../types/academics'

export const getAcademics = () =>
  client.get<ApiResponse<AcademicsData>>('/student/academics').then((r) => r.data.data!)
```

- [ ] **Step 4: Create profile API function**

```typescript
// frontend/src/api/profile.ts
import client from './client'
import type { ApiResponse } from '../types/auth'
import type { ProfileData } from '../types/profile'

export const getProfile = () =>
  client.get<ApiResponse<ProfileData>>('/student/profile').then((r) => r.data.data!)
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/academics.ts \
        frontend/src/types/profile.ts \
        frontend/src/api/academics.ts \
        frontend/src/api/profile.ts
git commit -m "feat(frontend): add academics/profile TypeScript types and API functions"
```

---

## Task 3: ProfilePage

**Files:**
- Create: `frontend/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create ProfilePage**

```tsx
// frontend/src/pages/ProfilePage.tsx
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../api/profile'

export default function ProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading profile…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load profile.</p>
      </div>
    )
  }

  const initials = data.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-6 mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-violet-300">{initials}</span>
        </div>
        <div>
          <p className="text-xl font-semibold text-white">{data.fullName}</p>
          <p className="text-slate-400 text-sm mt-0.5">{data.email}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Roll Number',  value: data.rollNumber },
          { label: 'Semester',     value: `Semester ${data.semester}` },
          { label: 'Section',      value: `Section ${data.section}` },
          { label: 'Department',   value: 'Computer Science & Engineering' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-white font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ProfilePage.tsx
git commit -m "feat(frontend): add ProfilePage with student info card"
```

---

## Task 4: AcademicsPage

**Files:**
- Create: `frontend/src/pages/AcademicsPage.tsx`

- [ ] **Step 1: Create AcademicsPage**

```tsx
// frontend/src/pages/AcademicsPage.tsx
import { useQuery } from '@tanstack/react-query'
import { getAcademics } from '../api/academics'
import type { SubjectResult } from '../types/academics'

function SubjectRow({ s }: { s: SubjectResult }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-6">
        <span className="text-xs font-mono text-slate-500">{s.code}</span>
        <p className="text-sm text-slate-200 mt-0.5">{s.name}</p>
      </td>
      <td className="py-3 px-4 text-center text-sm text-slate-400">{s.credits}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.internal}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.external}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.lab}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.assignment}</td>
      <td className="py-3 px-4 text-center text-sm font-semibold text-white">{s.total}</td>
      <td className="py-3 px-4 text-center text-sm font-medium text-slate-300">{s.grade}</td>
      <td className="py-3 px-6 text-center text-sm font-bold text-violet-300">{s.gradePoints.toFixed(1)}</td>
    </tr>
  )
}

export default function AcademicsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['academics'],
    queryFn: getAcademics,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading academics…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load academics data.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Academics</h1>

      <div className="space-y-8">
        {data.semesters.map((sem) => (
          <div
            key={sem.semesterName}
            className="rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Semester header */}
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">{sem.semesterName}</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                SGPA: {sem.sgpa.toFixed(2)}
              </span>
            </div>

            {/* Marks table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left py-3 px-6 text-xs text-slate-500 font-medium uppercase tracking-wider">Subject</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Cr.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Int.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Ext.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Lab</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Assgn.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Total</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Grade</th>
                    <th className="py-3 px-6 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((s) => (
                    <SubjectRow key={s.code} s={s} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AcademicsPage.tsx
git commit -m "feat(frontend): add AcademicsPage with per-semester marks table"
```

---

## Task 5: AttendancePage

Reuses the `['dashboard']` React Query cache — no new API call needed.

**Files:**
- Create: `frontend/src/pages/AttendancePage.tsx`

- [ ] **Step 1: Create AttendancePage**

```tsx
// frontend/src/pages/AttendancePage.tsx
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'

function AttendanceCard({
  code,
  name,
  attendancePercent,
}: {
  code: string
  name: string
  attendancePercent: number
}) {
  const barColor =
    attendancePercent < 75 ? 'bg-red-500' :
    attendancePercent < 85 ? 'bg-yellow-500' : 'bg-green-500'

  const textColor =
    attendancePercent < 75 ? 'text-red-400' :
    attendancePercent < 85 ? 'text-yellow-400' : 'text-green-400'

  const borderColor =
    attendancePercent < 75 ? 'border-red-500/20' : 'border-white/10'

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white/[0.03] p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-mono text-slate-500">{code}</span>
          <p className="text-sm text-slate-200 mt-0.5">{name}</p>
        </div>
        <span className={`text-2xl font-bold ${textColor}`}>
          {attendancePercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(attendancePercent, 100)}%` }}
        />
      </div>
      {attendancePercent < 75 && (
        <p className="text-xs text-red-400 mt-2">Below the 75% minimum threshold</p>
      )}
    </div>
  )
}

export default function AttendancePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading attendance…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load attendance data.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">{data.activeSemesterName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{data.attendancePercent.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Overall</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.subjects.map((s) => (
          <AttendanceCard
            key={s.code}
            code={s.code}
            name={s.name}
            attendancePercent={s.attendancePercent}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AttendancePage.tsx
git commit -m "feat(frontend): add AttendancePage with per-subject progress bars"
```

---

## Task 6: AnalyticsPage

Reuses `['dashboard']` cache. Uses `recharts` (already installed at `^2.12.4`).

**Files:**
- Create: `frontend/src/pages/AnalyticsPage.tsx`

- [ ] **Step 1: Create AnalyticsPage**

```tsx
// frontend/src/pages/AnalyticsPage.tsx
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const SUBJECT_COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#f87171']

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading analytics…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load analytics data.</p>
      </div>
    )
  }

  const gradeData = data.subjects.map((s) => ({ name: s.code, value: s.gradePoints }))
  const attendanceData = data.subjects.map((s) => ({ name: s.code, value: s.attendancePercent }))

  const tooltipStyle = {
    background: '#1e1b2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f1f5f9',
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>

      <div className="space-y-6">
        {/* Grade Points Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-6">Grade Points by Subject</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" name="Grade Points" radius={[4, 4, 0, 0]}>
                {gradeData.map((_, i) => (
                  <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-6">Attendance % by Subject</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Attendance']}
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" name="Attendance" radius={[4, 4, 0, 0]}>
                {attendanceData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.value < 75 ? '#f87171' :
                      entry.value < 85 ? '#fbbf24' : '#34d399'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AnalyticsPage.tsx
git commit -m "feat(frontend): add AnalyticsPage with recharts grade and attendance bar charts"
```

---

## Task 7: CGPAPlannerPage

Pure frontend. Reuses `['dashboard']` cache. Lets the student change hypothetical grades and see the recalculated SGPA live.

**Files:**
- Create: `frontend/src/pages/CGPAPlannerPage.tsx`

- [ ] **Step 1: Create CGPAPlannerPage**

```tsx
// frontend/src/pages/CGPAPlannerPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'

const GRADES = [
  { label: 'O  — 10',  points: 10 },
  { label: 'A+ — 9',   points: 9  },
  { label: 'A  — 8',   points: 8  },
  { label: 'B+ — 7',   points: 7  },
  { label: 'B  — 6',   points: 6  },
  { label: 'C  — 5',   points: 5  },
  { label: 'P  — 4',   points: 4  },
  { label: 'F  — 0',   points: 0  },
]

function computeSgpa(subjects: { credits: number; gradePoints: number }[]): number {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0)
  if (totalCredits === 0) return 0
  const totalPoints = subjects.reduce((sum, s) => sum + s.gradePoints * s.credits, 0)
  return Math.round((totalPoints / totalCredits) * 100) / 100
}

export default function CGPAPlannerPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const [overrides, setOverrides] = useState<Record<string, number>>({})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading planner…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load data.</p>
      </div>
    )
  }

  const hypotheticalSubjects = data.subjects.map((s) => ({
    credits: s.credits,
    gradePoints: overrides[s.code] ?? s.gradePoints,
  }))

  const projectedSgpa = computeSgpa(hypotheticalSubjects)
  const delta = projectedSgpa - data.sgpa
  const hasChanges = Object.keys(overrides).length > 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">CGPA Planner</h1>
      <p className="text-slate-500 text-sm mb-8">
        Adjust grades below to see how your SGPA would change this semester
      </p>

      {/* SGPA comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current SGPA</p>
          <p className="text-3xl font-bold text-white">{data.sgpa.toFixed(2)}</p>
        </div>
        <div
          className={`rounded-2xl border p-6 ${
            delta > 0
              ? 'border-green-500/30 bg-green-500/10'
              : delta < 0
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Projected SGPA</p>
          <p
            className={`text-3xl font-bold ${
              delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {projectedSgpa.toFixed(2)}
          </p>
          {hasChanges && delta !== 0 && (
            <p
              className={`text-xs mt-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {delta > 0 ? '+' : ''}{delta.toFixed(2)} from current
            </p>
          )}
        </div>
      </div>

      {/* Subject grade selectors */}
      <div className="space-y-3">
        {data.subjects.map((s) => {
          const selectedPoints = overrides[s.code] ?? s.gradePoints
          const changed = overrides[s.code] !== undefined && overrides[s.code] !== s.gradePoints
          return (
            <div
              key={s.code}
              className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
                changed ? 'border-violet-500/30 bg-violet-500/[0.05]' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.code} · {s.credits} cr. · current: {s.grade} ({s.gradePoints})
                </p>
              </div>
              <select
                value={selectedPoints}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [s.code]: Number(e.target.value) }))
                }
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 shrink-0"
              >
                {GRADES.map((g) => (
                  <option key={g.label} value={g.points} className="bg-[#0a0a1a]">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <button
          onClick={() => setOverrides({})}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Reset to current grades
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/CGPAPlannerPage.tsx
git commit -m "feat(frontend): add CGPAPlannerPage with live what-if SGPA calculator"
```

---

## Task 8: RecommendationsPage

Pure frontend. Reuses `['dashboard']` cache. Applies rule-based recommendations.

Rules:
- Attendance < 75% per subject → warning
- Total < 60 per subject → info (focus on improving)
- CGPA ≥ 8.5 → success (excellent standing)
- No issues found → success (all clear)

**Files:**
- Create: `frontend/src/pages/RecommendationsPage.tsx`

- [ ] **Step 1: Create RecommendationsPage**

```tsx
// frontend/src/pages/RecommendationsPage.tsx
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import type { DashboardData } from '../types/dashboard'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type RecType = 'warning' | 'info' | 'success'

interface Recommendation {
  type: RecType
  title: string
  body: string
}

const ICONS: Record<RecType, ReactNode> = {
  warning: <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />,
  info:    <Info          size={18} className="text-blue-400 shrink-0 mt-0.5" />,
  success: <CheckCircle  size={18} className="text-green-400 shrink-0 mt-0.5" />,
}

const CARD_STYLES: Record<RecType, string> = {
  warning: 'border-red-500/30 bg-red-500/[0.07]',
  info:    'border-blue-500/30 bg-blue-500/[0.07]',
  success: 'border-green-500/30 bg-green-500/[0.07]',
}

function buildRecommendations(data: DashboardData): Recommendation[] {
  const recs: Recommendation[] = []

  for (const s of data.subjects) {
    if (s.attendancePercent < 75) {
      recs.push({
        type: 'warning',
        title: `Critical attendance: ${s.name}`,
        body: `Your attendance is ${s.attendancePercent.toFixed(1)}%. Falling below 75% risks debarment from exams.`,
      })
    }
    if (s.total < 60) {
      recs.push({
        type: 'info',
        title: `Low score: ${s.name}`,
        body: `Current total is ${s.total.toFixed(1)}. Focus on internal assessments to improve your grade.`,
      })
    }
  }

  if (data.cgpa >= 8.5) {
    recs.push({
      type: 'success',
      title: 'Excellent academic standing',
      body: `CGPA of ${data.cgpa.toFixed(2)} is outstanding. Maintain this consistency for strong final results.`,
    })
  }

  if (recs.length === 0) {
    recs.push({
      type: 'success',
      title: 'All clear!',
      body: 'No immediate concerns detected. Keep up the consistent performance.',
    })
  }

  return recs
}

export default function RecommendationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading recommendations…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load data.</p>
      </div>
    )
  }

  const recs = buildRecommendations(data)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Recommendations</h1>
      <p className="text-slate-500 text-sm mb-8">
        Personalised insights based on your current performance
      </p>

      <div className="space-y-4">
        {recs.map((r, i) => (
          <div key={i} className={`rounded-2xl border p-5 flex gap-4 ${CARD_STYLES[r.type]}`}>
            {ICONS[r.type]}
            <div>
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-sm text-slate-400 mt-1">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/RecommendationsPage.tsx
git commit -m "feat(frontend): add RecommendationsPage with rule-based insights"
```

---

## Task 9: Wire App.tsx + Final Check

Replace the six remaining placeholder routes with real page components.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read current App.tsx**

Read `frontend/src/App.tsx` before editing (required by Edit tool).

- [ ] **Step 2: Replace App.tsx**

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import AcademicsPage from './pages/AcademicsPage'
import AttendancePage from './pages/AttendancePage'
import AnalyticsPage from './pages/AnalyticsPage'
import CGPAPlannerPage from './pages/CGPAPlannerPage'
import RecommendationsPage from './pages/RecommendationsPage'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-400 mt-2 text-sm">Coming soon</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/academics"       element={<AcademicsPage />} />
            <Route path="/attendance"      element={<AttendancePage />} />
            <Route path="/analytics"       element={<AnalyticsPage />} />
            <Route path="/planner"         element={<CGPAPlannerPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/reports"         element={<PlaceholderPage title="Reports" />} />
            <Route path="/notifications"   element={<PlaceholderPage title="Notifications" />} />
            <Route path="/profile"         element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Faculty */}
        <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
          <Route path="/faculty/*" element={<PlaceholderPage title="Faculty Panel" />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<PlaceholderPage title="Admin Panel" />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire all student pages — replace remaining placeholders"
```

---

## Self-Review

**Spec coverage:**
- Profile page — fetches `/student/profile`, shows fullName/email/rollNumber/semester/section ✓
- Academics page — fetches `/student/academics` (new endpoint), shows marks by semester ✓
- Attendance page — reuses dashboard cache, progress bars with colour thresholds ✓
- Analytics page — recharts bar charts for grade points + attendance ✓
- CGPA Planner — live SGPA calculator, no backend call ✓
- Recommendations — rule-based from dashboard data, warning/info/success cards ✓
- App.tsx wired — all 7 real pages registered, Reports + Notifications stay as placeholders ✓
- TypeScript compiles clean after every task ✓

**No placeholders:** All steps contain complete, runnable code.

**Type consistency:**
- `AcademicsData.semesters[].subjects[]` uses `SubjectResult` — same type imported in `AcademicsPage.tsx` ✓
- `ProfileData` shape matches `StudentProfileResponse` record fields ✓
- `DashboardData` (existing type) used in `AttendancePage`, `AnalyticsPage`, `CGPAPlannerPage`, `RecommendationsPage` ✓
- `CGPAPlannerPage.computeSgpa()` receives `{ credits: number; gradePoints: number }[]` — satisfied by mapping `data.subjects` ✓
- `buildRecommendations(data: DashboardData)` typed explicitly — no implicit `any` ✓
- recharts `Tooltip formatter` uses `(v) => [...]` with `Number(v)` cast — avoids `string | number` TypeScript error ✓
