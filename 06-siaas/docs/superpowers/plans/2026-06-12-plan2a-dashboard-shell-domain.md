# Plan 2A: Dashboard + App Shell + Backend Domain

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend domain entities + repositories + student dashboard API, then the frontend app shell (sidebar + layout) and a live dashboard page pulling real data from the API.

**Architecture:** JPA entities map to the existing PostgreSQL schema (init.sql + seed.sql already applied). A `StudentService` computes CGPA, SGPA, attendance %, weak subjects from live `marks` + `attendance` tables. The React frontend wraps all student routes in a `DashboardLayout` with a sidebar, and the `/dashboard` page fetches data via React Query.

**Tech Stack:** Spring Boot 3 / JPA / JPQL, React 18 / TypeScript / Tailwind, @tanstack/react-query v5, lucide-react, Zustand (already installed)

---

## File Map

**Backend — create:**
- `backend/src/main/java/com/siaas/academic/Department.java`
- `backend/src/main/java/com/siaas/academic/Semester.java`
- `backend/src/main/java/com/siaas/academic/Subject.java`
- `backend/src/main/java/com/siaas/student/Student.java`
- `backend/src/main/java/com/siaas/academic/Marks.java`
- `backend/src/main/java/com/siaas/attendance/Attendance.java`
- `backend/src/main/java/com/siaas/student/StudentRepository.java`
- `backend/src/main/java/com/siaas/academic/MarksRepository.java`
- `backend/src/main/java/com/siaas/attendance/AttendanceRepository.java`
- `backend/src/main/java/com/siaas/student/dto/DashboardResponse.java`
- `backend/src/main/java/com/siaas/student/dto/StudentProfileResponse.java`
- `backend/src/main/java/com/siaas/student/StudentService.java`
- `backend/src/main/java/com/siaas/student/StudentController.java`
- `backend/src/test/java/com/siaas/student/StudentControllerTest.java`

**Frontend — create:**
- `frontend/src/types/dashboard.ts`
- `frontend/src/api/dashboard.ts`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/DashboardLayout.tsx`
- `frontend/src/pages/DashboardPage.tsx`

**Frontend — modify:**
- `frontend/src/main.tsx` (add QueryClientProvider)
- `frontend/src/App.tsx` (wrap student routes with DashboardLayout, real DashboardPage)

---

## Task 1: Domain Entities — Department, Semester, Subject, Student

**Schema reference (init.sql):**
- `departments(id UUID, name VARCHAR, code VARCHAR)`
- `semesters(id UUID, name VARCHAR, start_date DATE, end_date DATE, is_active BOOLEAN)`
- `subjects(id UUID, department_id UUID, code VARCHAR, name VARCHAR, semester_number INT, credits INT)`
- `students(id UUID, user_id UUID, department_id UUID, roll_number VARCHAR, full_name VARCHAR, phone VARCHAR, semester INT, section VARCHAR, admission_year INT)`

**Files:**
- Create: `backend/src/main/java/com/siaas/academic/Department.java`
- Create: `backend/src/main/java/com/siaas/academic/Semester.java`
- Create: `backend/src/main/java/com/siaas/academic/Subject.java`
- Create: `backend/src/main/java/com/siaas/student/Student.java`

- [ ] **Step 1: Create Department entity**

```java
// backend/src/main/java/com/siaas/academic/Department.java
package com.siaas.academic;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code;
}
```

- [ ] **Step 2: Create Semester entity**

> IMPORTANT: Name the boolean field `active` (not `isActive`). Lombok @Getter on `boolean isActive` generates `isIsActive()` — a bug. Use `active` + `@Column(name = "is_active")`.

```java
// backend/src/main/java/com/siaas/academic/Semester.java
package com.siaas.academic;

import jakarta.persistence.*;
import lombok.Getter;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "semesters")
@Getter
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private boolean active;
}
```

- [ ] **Step 3: Create Subject entity**

```java
// backend/src/main/java/com/siaas/academic/Subject.java
package com.siaas.academic;

import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;

@Entity
@Table(name = "subjects")
@Getter
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "semester_number", nullable = false)
    private int semesterNumber;

    @Column(nullable = false)
    private int credits;
}
```

- [ ] **Step 4: Create Student entity**

```java
// backend/src/main/java/com/siaas/student/Student.java
package com.siaas.student;

import com.siaas.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;

@Entity
@Table(name = "students")
@Getter
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true)
    private String rollNumber;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private int semester;

    @Column(length = 10)
    private String section;

    @Column(name = "admission_year", nullable = false)
    private int admissionYear;
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/siaas/academic/Department.java \
        backend/src/main/java/com/siaas/academic/Semester.java \
        backend/src/main/java/com/siaas/academic/Subject.java \
        backend/src/main/java/com/siaas/student/Student.java
git commit -m "feat(domain): add Department, Semester, Subject, Student JPA entities"
```

---

## Task 2: Domain Entities — Marks, Attendance + All Repositories

**Schema reference (init.sql):**
- `marks(id, student_id, subject_id, semester_id, internal DECIMAL, external DECIMAL, lab DECIMAL, assignment DECIMAL, total DECIMAL, grade VARCHAR, grade_points DECIMAL)`
- `attendance(id, student_id, subject_id, marked_by, date DATE, status VARCHAR CHECK IN ('PRESENT','ABSENT','LEAVE'))`

**Files:**
- Create: `backend/src/main/java/com/siaas/academic/Marks.java`
- Create: `backend/src/main/java/com/siaas/attendance/Attendance.java`
- Create: `backend/src/main/java/com/siaas/student/StudentRepository.java`
- Create: `backend/src/main/java/com/siaas/academic/MarksRepository.java`
- Create: `backend/src/main/java/com/siaas/attendance/AttendanceRepository.java`

- [ ] **Step 1: Create Marks entity**

```java
// backend/src/main/java/com/siaas/academic/Marks.java
package com.siaas.academic;

import com.siaas.student.Student;
import jakarta.persistence.*;
import lombok.Getter;
import java.util.UUID;

@Entity
@Table(name = "marks")
@Getter
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false)
    private double internal;

    @Column(nullable = false)
    private double external;

    @Column(nullable = false)
    private double lab;

    @Column(nullable = false)
    private double assignment;

    @Column(nullable = false)
    private double total;

    @Column(length = 5)
    private String grade;

    @Column(name = "grade_points")
    private double gradePoints;
}
```

- [ ] **Step 2: Create Attendance entity**

```java
// backend/src/main/java/com/siaas/attendance/Attendance.java
package com.siaas.attendance;

import com.siaas.academic.Subject;
import com.siaas.student.Student;
import jakarta.persistence.*;
import lombok.Getter;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "attendance")
@Getter
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 10)
    private String status;
}
```

- [ ] **Step 3: Create StudentRepository**

```java
// backend/src/main/java/com/siaas/student/StudentRepository.java
package com.siaas.student;

import com.siaas.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByUser(User user);
}
```

- [ ] **Step 4: Create MarksRepository**

```java
// backend/src/main/java/com/siaas/academic/MarksRepository.java
package com.siaas.academic;

import com.siaas.student.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MarksRepository extends JpaRepository<Marks, UUID> {

    // Fetches marks for the active semester, eagerly loading subject + semester
    @Query("""
        SELECT m FROM Marks m
        JOIN FETCH m.subject
        JOIN FETCH m.semester
        WHERE m.student = :student AND m.semester.active = true
        """)
    List<Marks> findCurrentByStudent(@Param("student") Student student);

    // Fetches all marks (all semesters) for CGPA calculation
    @Query("""
        SELECT m FROM Marks m
        JOIN FETCH m.subject
        JOIN FETCH m.semester
        WHERE m.student = :student
        """)
    List<Marks> findAllByStudent(@Param("student") Student student);
}
```

- [ ] **Step 5: Create AttendanceRepository**

> Two separate queries are used instead of CASE-in-SUM to stay safe with JPQL dialect differences.

```java
// backend/src/main/java/com/siaas/attendance/AttendanceRepository.java
package com.siaas.attendance;

import com.siaas.student.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    // Returns [subjectId, presentCount] per subject
    @Query("""
        SELECT a.subject.id, COUNT(a)
        FROM Attendance a
        WHERE a.student = :student AND a.status = 'PRESENT'
        GROUP BY a.subject.id
        """)
    List<Object[]> getPresentCountBySubject(@Param("student") Student student);

    // Returns [subjectId, totalCount] per subject
    @Query("""
        SELECT a.subject.id, COUNT(a)
        FROM Attendance a
        WHERE a.student = :student
        GROUP BY a.subject.id
        """)
    List<Object[]> getTotalCountBySubject(@Param("student") Student student);
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/siaas/academic/Marks.java \
        backend/src/main/java/com/siaas/attendance/Attendance.java \
        backend/src/main/java/com/siaas/student/StudentRepository.java \
        backend/src/main/java/com/siaas/academic/MarksRepository.java \
        backend/src/main/java/com/siaas/attendance/AttendanceRepository.java
git commit -m "feat(domain): add Marks, Attendance entities and all repositories"
```

---

## Task 3: Dashboard DTOs + StudentService

**Files:**
- Create: `backend/src/main/java/com/siaas/student/dto/DashboardResponse.java`
- Create: `backend/src/main/java/com/siaas/student/dto/StudentProfileResponse.java`
- Create: `backend/src/main/java/com/siaas/student/StudentService.java`

**Expected dashboard data for test student (student@siaas.dev):**
- 6 subjects seeded: DSA(4cr), OS(4cr), DBMS(4cr), CN(3cr), TOC(3cr), SE(3cr) = 21 total credits
- Grade points seeded: DSA=10, OS=7, DBMS=5, CN=9, TOC=5, SE=7
- CGPA = (10×4 + 7×4 + 5×4 + 9×3 + 5×3 + 7×3) / 21 = 151/21 ≈ 7.19
- Attendance: DBMS=61.5%, TOC=69.2% are below 75% → 2 weak subjects

- [ ] **Step 1: Create DashboardResponse record**

```java
// backend/src/main/java/com/siaas/student/dto/DashboardResponse.java
package com.siaas.student.dto;

import java.util.List;

public record DashboardResponse(
    double cgpa,
    double sgpa,
    double attendancePercent,
    double avgScore,
    int weakSubjectsCount,
    String activeSemesterName,
    List<SubjectStats> subjects
) {
    public record SubjectStats(
        String code,
        String name,
        int credits,
        double total,
        String grade,
        double gradePoints,
        double attendancePercent,
        boolean isWeak
    ) {}
}
```

- [ ] **Step 2: Create StudentProfileResponse record**

```java
// backend/src/main/java/com/siaas/student/dto/StudentProfileResponse.java
package com.siaas.student.dto;

public record StudentProfileResponse(
    String fullName,
    String email,
    String rollNumber,
    int semester,
    String section
) {}
```

- [ ] **Step 3: Create StudentService**

```java
// backend/src/main/java/com/siaas/student/StudentService.java
package com.siaas.student;

import com.siaas.academic.Marks;
import com.siaas.academic.MarksRepository;
import com.siaas.attendance.AttendanceRepository;
import com.siaas.common.ResourceNotFoundException;
import com.siaas.student.dto.DashboardResponse;
import com.siaas.student.dto.StudentProfileResponse;
import com.siaas.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final MarksRepository marksRepository;
    private final AttendanceRepository attendanceRepository;

    public Student getStudentOrThrow(User user) {
        return studentRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
    }

    public StudentProfileResponse getProfile(User user) {
        Student s = getStudentOrThrow(user);
        return new StudentProfileResponse(
            s.getFullName(),
            user.getEmail(),
            s.getRollNumber(),
            s.getSemester(),
            s.getSection()
        );
    }

    public DashboardResponse getDashboard(User user) {
        Student student = getStudentOrThrow(user);

        List<Marks> currentMarks = marksRepository.findCurrentByStudent(student);
        List<Marks> allMarks     = marksRepository.findAllByStudent(student);

        // Attendance maps: subjectId -> count
        Map<UUID, Long> presentMap = toMap(attendanceRepository.getPresentCountBySubject(student));
        Map<UUID, Long> totalMap   = toMap(attendanceRepository.getTotalCountBySubject(student));

        // Per-subject stats for current semester
        List<DashboardResponse.SubjectStats> subjects = new ArrayList<>();
        double sumScore = 0;
        String semesterName = "";

        for (Marks m : currentMarks) {
            UUID subjectId = m.getSubject().getId();
            long present = presentMap.getOrDefault(subjectId, 0L);
            long total   = totalMap.getOrDefault(subjectId, 0L);
            double attPct = total > 0 ? round1((double) present / total * 100) : 0.0;
            boolean isWeak = attPct < 75 || m.getTotal() < 50;

            subjects.add(new DashboardResponse.SubjectStats(
                m.getSubject().getCode(),
                m.getSubject().getName(),
                m.getSubject().getCredits(),
                m.getTotal(),
                m.getGrade(),
                m.getGradePoints(),
                attPct,
                isWeak
            ));
            sumScore += m.getTotal();
            semesterName = m.getSemester().getName();
        }

        double sgpa = computeWeightedGpa(currentMarks);
        double cgpa = computeWeightedGpa(allMarks);
        double avgScore = subjects.isEmpty() ? 0 : round1(sumScore / subjects.size());

        double totalPresent = presentMap.values().stream().mapToLong(Long::longValue).sum();
        double totalClasses = totalMap.values().stream().mapToLong(Long::longValue).sum();
        double overallAtt   = totalClasses > 0 ? round1(totalPresent / totalClasses * 100) : 0;

        long weakCount = subjects.stream().filter(DashboardResponse.SubjectStats::isWeak).count();

        return new DashboardResponse(
            cgpa, sgpa, overallAtt, avgScore,
            (int) weakCount, semesterName, subjects
        );
    }

    private double computeWeightedGpa(List<Marks> marksList) {
        double points = 0, credits = 0;
        for (Marks m : marksList) {
            int c = m.getSubject().getCredits();
            points  += m.getGradePoints() * c;
            credits += c;
        }
        return credits > 0 ? round2(points / credits) : 0;
    }

    private Map<UUID, Long> toMap(List<Object[]> rows) {
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/siaas/student/dto/ \
        backend/src/main/java/com/siaas/student/StudentService.java
git commit -m "feat(student): add DashboardResponse, StudentProfileResponse DTOs and StudentService"
```

---

## Task 4: StudentController + Integration Test

**Files:**
- Create: `backend/src/main/java/com/siaas/student/StudentController.java`
- Create: `backend/src/test/java/com/siaas/student/StudentControllerTest.java`

No SecurityConfig changes needed — `.anyRequest().authenticated()` already enforces auth on all non-public endpoints.

- [ ] **Step 1: Write the failing integration test**

```java
// backend/src/test/java/com/siaas/student/StudentControllerTest.java
package com.siaas.student;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StudentControllerTest {

    @Autowired MockMvc mvc;

    @Test
    void dashboard_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/v1/student/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void dashboard_withStudentAuth_returns200WithCgpa() throws Exception {
        // Login to get auth cookie
        String loginBody = """
            {"email":"student@siaas.dev","password":"Student@123"}
            """;
        MvcResult loginResult = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
            .andExpect(status().isOk())
            .andReturn();

        // Extract Set-Cookie header
        String cookie = loginResult.getResponse().getHeader("Set-Cookie");

        // Call dashboard with the session cookie
        mvc.perform(get("/api/v1/student/dashboard")
                .header("Cookie", cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.cgpa").isNumber())
            .andExpect(jsonPath("$.data.subjects").isArray())
            .andExpect(jsonPath("$.data.subjects.length()").value(6));
    }
}
```

- [ ] **Step 2: Run test — expect FAIL (StudentController not yet created)**

```bash
cd backend
./mvnw test -pl . -Dtest=StudentControllerTest -q 2>&1 | tail -20
```

Expected: compilation error or `NoSuchBeanDefinitionException` for `StudentController`.

- [ ] **Step 3: Create StudentController**

```java
// backend/src/main/java/com/siaas/student/StudentController.java
package com.siaas.student;

import com.siaas.common.ApiResponse;
import com.siaas.student.dto.DashboardResponse;
import com.siaas.student.dto.StudentProfileResponse;
import com.siaas.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> profile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getProfile(user)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getDashboard(user)));
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
./mvnw test -pl . -Dtest=StudentControllerTest -q 2>&1 | tail -20
```

Expected:
```
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- [ ] **Step 5: Run full backend test suite — confirm no regressions**

```bash
./mvnw test -q 2>&1 | tail -10
```

Expected: `BUILD SUCCESS` with 0 failures.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/siaas/student/StudentController.java \
        backend/src/test/java/com/siaas/student/StudentControllerTest.java
git commit -m "feat(student): add StudentController with /profile and /dashboard endpoints"
```

---

## Task 5: Frontend Types + API + QueryClient

**Files:**
- Create: `frontend/src/types/dashboard.ts`
- Create: `frontend/src/api/dashboard.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create dashboard TypeScript types**

```typescript
// frontend/src/types/dashboard.ts
export interface SubjectStats {
  code: string
  name: string
  credits: number
  total: number
  grade: string
  gradePoints: number
  attendancePercent: number
  isWeak: boolean
}

export interface DashboardData {
  cgpa: number
  sgpa: number
  attendancePercent: number
  avgScore: number
  weakSubjectsCount: number
  activeSemesterName: string
  subjects: SubjectStats[]
}
```

- [ ] **Step 2: Create dashboard API function**

Pattern is identical to auth.ts: `client.get<ApiResponse<T>>('/path').then(r => r.data.data!)`.

```typescript
// frontend/src/api/dashboard.ts
import client from './client'
import type { ApiResponse } from '../types/auth'
import type { DashboardData } from '../types/dashboard'

export const getDashboard = () =>
  client
    .get<ApiResponse<DashboardData>>('/student/dashboard')
    .then((r) => r.data.data!)
```

- [ ] **Step 3: Add QueryClientProvider to main.tsx**

```tsx
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (no errors).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/dashboard.ts \
        frontend/src/api/dashboard.ts \
        frontend/src/main.tsx
git commit -m "feat(frontend): add dashboard types, API function, and QueryClientProvider"
```

---

## Task 6: Sidebar + DashboardLayout

**Files:**
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/DashboardLayout.tsx`

The sidebar uses `lucide-react` (already installed). The `authStore.logout()` method calls the API and clears user state (already implemented in Plan 1).

- [ ] **Step 1: Create Sidebar component**

```tsx
// frontend/src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Calculator,
  Lightbulb,
  FileText,
  Bell,
  User,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',      Icon: LayoutDashboard },
  { to: '/academics',       label: 'Academics',       Icon: BookOpen },
  { to: '/attendance',      label: 'Attendance',      Icon: CalendarCheck },
  { to: '/analytics',       label: 'Analytics',       Icon: TrendingUp },
  { to: '/planner',         label: 'CGPA Planner',    Icon: Calculator },
  { to: '/recommendations', label: 'Recommendations', Icon: Lightbulb },
  { to: '/reports',         label: 'Reports',         Icon: FileText },
  { to: '/notifications',   label: 'Notifications',   Icon: Bell },
  { to: '/profile',         label: 'Profile',         Icon: User },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white/[0.03] border-r border-white/10">
      {/* Brand */}
      <div className="px-6 py-7">
        <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          SIAAS
        </span>
        <p className="text-slate-500 text-xs mt-0.5">Academic Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 mb-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create DashboardLayout component**

```tsx
// frontend/src/components/layout/DashboardLayout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0a1a] text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx \
        frontend/src/components/layout/DashboardLayout.tsx
git commit -m "feat(frontend): add Sidebar and DashboardLayout shell components"
```

---

## Task 7: DashboardPage

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`

The page fetches live data from `/api/v1/student/dashboard` via React Query and renders 5 stat cards + a subject table. The `useQuery` key is `['dashboard']`.

- [ ] **Step 1: Create DashboardPage**

```tsx
// frontend/src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import type { SubjectStats } from '../types/dashboard'

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? 'border-violet-500/30 bg-violet-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function SubjectRow({ s }: { s: SubjectStats }) {
  const attColor =
    s.attendancePercent < 75
      ? 'text-red-400'
      : s.attendancePercent < 85
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 pr-4">
        <span className="text-xs font-mono text-slate-500">{s.code}</span>
        <p className="text-sm text-slate-200 mt-0.5">{s.name}</p>
      </td>
      <td className="py-3 px-4 text-center text-sm text-white">{s.total.toFixed(1)}</td>
      <td className="py-3 px-4 text-center text-sm font-medium text-slate-300">{s.grade}</td>
      <td className="py-3 px-4 text-center text-sm font-bold text-violet-300">{s.gradePoints.toFixed(1)}</td>
      <td className={`py-3 pl-4 text-center text-sm font-medium ${attColor}`}>
        {s.attendancePercent.toFixed(1)}%
      </td>
      {s.isWeak && (
        <td className="py-3 pl-4">
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            Weak
          </span>
        </td>
      )}
      {!s.isWeak && <td />}
    </tr>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 text-sm">Loading dashboard…</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400 text-sm">Failed to load dashboard data.</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{data.activeSemesterName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="CGPA" value={data.cgpa.toFixed(2)} sub="Cumulative" accent />
        <StatCard label="SGPA" value={data.sgpa.toFixed(2)} sub="This semester" />
        <StatCard label="Attendance" value={`${data.attendancePercent}%`} sub="Overall" />
        <StatCard label="Avg Score" value={`${data.avgScore}%`} sub="Current semester" />
        <StatCard
          label="Weak Subjects"
          value={data.weakSubjectsCount}
          sub="Need attention"
          accent={data.weakSubjectsCount > 0}
        />
      </div>

      {/* Subject table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-300">Subject Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 pr-4 px-6 text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Subject
                </th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total
                </th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Grade
                </th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">
                  GP
                </th>
                <th className="py-3 pl-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Attendance
                </th>
                <th className="py-3 pl-4 text-xs text-slate-500 font-medium uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody className="px-6">
              {data.subjects.map((s) => (
                <SubjectRow key={s.code} s={s} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat(frontend): add DashboardPage with stat cards and subject performance table"
```

---

## Task 8: Wire App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

Replace all student `PlaceholderPage` wrappers with `DashboardLayout`, and swap `/dashboard`'s `PlaceholderPage` with the real `DashboardPage`.

- [ ] **Step 1: Read the current App.tsx before editing**

The current file is at `frontend/src/App.tsx`. Read it, then replace with the version below.

- [ ] **Step 2: Update App.tsx**

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
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

        {/* Student — all wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/academics"       element={<PlaceholderPage title="Academics" />} />
            <Route path="/attendance"      element={<PlaceholderPage title="Attendance" />} />
            <Route path="/analytics"       element={<PlaceholderPage title="Analytics" />} />
            <Route path="/planner"         element={<PlaceholderPage title="CGPA Planner" />} />
            <Route path="/recommendations" element={<PlaceholderPage title="Recommendations" />} />
            <Route path="/reports"         element={<PlaceholderPage title="Reports" />} />
            <Route path="/notifications"   element={<PlaceholderPage title="Notifications" />} />
            <Route path="/profile"         element={<PlaceholderPage title="Profile" />} />
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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 4: Start services and smoke-test in browser**

Start the stack (Docker Compose or backend + frontend separately):

```bash
# From siaas/ root:
docker compose up -d postgres
cd backend && ./mvnw spring-boot:run &
cd frontend && npm run dev
```

Navigate to `http://localhost:5173`, log in as `student@siaas.dev / Student@123`, and verify:
- Sidebar appears on the left with all nav links
- Dashboard shows 5 stat cards with real numbers (CGPA ≈ 7.19, Attendance ≈ 77.6%)
- Subject table lists all 6 subjects with grades, DBMS and TOC marked "Weak"
- Clicking sidebar links navigates to placeholder pages without breaking layout

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire DashboardLayout into student routes, activate DashboardPage"
```

---

## Self-Review

**Spec coverage:**
- Backend domain entities ✓
- Repositories with correct JPQL ✓
- CGPA/SGPA/attendance calculation ✓
- `/api/v1/student/dashboard` and `/profile` endpoints ✓
- Auth enforcement (anyRequest().authenticated()) ✓
- App shell with sidebar ✓
- DashboardPage with real data ✓
- React Query setup ✓

**No placeholders:** All steps have complete code. No TBD/TODO.

**Type consistency:**
- `DashboardResponse.SubjectStats::isWeak` referenced in `StudentService` filter — Java records generate `isWeak()` accessor for boolean `isWeak` field ✓
- `ApiResponse.ok(data)` matches existing `ApiResponse` class (Task 4 controller) ✓
- Frontend `getDashboard()` returns `DashboardData` matching `DashboardResponse` JSON shape ✓
- `useAuthStore((s) => s.logout)` selector matches `AuthState.logout: () => Promise<void>` ✓
