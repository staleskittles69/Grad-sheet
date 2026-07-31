package com.siaas.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder;

    private static final String DEPT_ID   = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    private static final String SEM_ID    = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
    private static final String SUBJ_DSA  = "c3d4e5f6-a7b8-9012-cdef-123456789012";
    private static final String SUBJ_OS   = "d4e5f6a7-b8c9-0123-defa-234567890123";
    private static final String SUBJ_DBMS = "e5f6a7b8-c9d0-1234-efab-345678901234";
    private static final String SUBJ_CN   = "f6a7b8c9-d0e1-2345-fabc-456789012345";
    private static final String SUBJ_TOC  = "a7b8c9d0-e1f2-3456-abcd-567890123456";
    private static final String SUBJ_SE   = "b8c9d0e1-f2a3-4567-bcde-678901234567";

    @Override
    @Transactional
    public void run(String... args) {
        if (alreadySeeded()) {
            log.info("Demo data already seeded — skipping.");
            return;
        }

        log.info("Seeding demo accounts and mock data...");

        String adminId   = seedUser("admin@siaas.dev",   "Admin@123",   "ADMIN");
        String facultyId = seedUser("faculty@siaas.dev", "Faculty@123", "FACULTY");
        String studentId = seedUser("student@siaas.dev", "Student@123", "STUDENT");

        String facultyProfileId = seedFaculty(facultyId, "Dr. Priya Sharma", "FAC001");
        String studentProfileId = seedStudent(studentId, "Rahul Singh", "CS21B001");

        seedMarks(studentProfileId);
        seedAttendance(studentProfileId, facultyProfileId);
        seedFacultySubjects(facultyProfileId);

        log.info("Demo data seeded successfully.");
        log.info("  admin@siaas.dev   / Admin@123");
        log.info("  faculty@siaas.dev / Faculty@123");
        log.info("  student@siaas.dev / Student@123");
    }

    private boolean alreadySeeded() {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = 'admin@siaas.dev'", Integer.class);
        return count != null && count > 0;
    }

    private String seedUser(String email, String password, String role) {
        String id = UUID.randomUUID().toString();
        String hash = passwordEncoder.encode(password);
        jdbc.update(
                "INSERT INTO users (id, email, password_hash, role, is_verified) VALUES (?::uuid, ?, ?, ?, true)",
                id, email, hash, role);
        return id;
    }

    private String seedFaculty(String userId, String name, String employeeId) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO faculty (id, user_id, department_id, full_name, designation, employee_id) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?)",
                id, userId, DEPT_ID, name, "Assistant Professor", employeeId);
        return id;
    }

    private String seedStudent(String userId, String name, String rollNumber) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO students (id, user_id, department_id, roll_number, full_name, semester, section, admission_year) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, 6, 'B', 2021)",
                id, userId, DEPT_ID, rollNumber, name);
        return id;
    }

    private void seedMarks(String studentId) {
        Object[][] subjectMarks = {
            {SUBJ_DSA,  22, 58,  7,  4, 91, "O",  10.0},
            {SUBJ_OS,   20, 42,  5,  5, 72, "B+",  7.0},
            {SUBJ_DBMS, 14, 33,  8,  7, 62, "C",   5.0},
            {SUBJ_CN,   21, 52,  7,  5, 85, "A+",  9.0},
            {SUBJ_TOC,  16, 38,  6,  5, 65, "C",   5.0},
            {SUBJ_SE,   19, 46,  7,  6, 78, "B+",  7.0}
        };
        for (Object[] m : subjectMarks) {
            jdbc.update(
                "INSERT INTO marks (id, student_id, subject_id, semester_id, internal, external, lab, assignment, total, grade, grade_points) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID().toString(), studentId, m[0], SEM_ID,
                m[1], m[2], m[3], m[4], m[5], m[6], m[7]);
        }
    }

    private void seedAttendance(String studentId, String facultyId) {
        Object[][] attendanceCounts = {
            {SUBJ_DSA,  24, 2},
            {SUBJ_OS,   22, 4},
            {SUBJ_DBMS, 16, 10},
            {SUBJ_CN,   21, 5},
            {SUBJ_TOC,  18, 8},
            {SUBJ_SE,   20, 6}
        };
        LocalDate startDate = LocalDate.of(2026, 1, 6);
        for (Object[] a : attendanceCounts) {
            String subjectId = (String) a[0];
            int present = (int) a[1];
            int absent  = (int) a[2];
            LocalDate date = startDate;
            for (int i = 0; i < present; i++) {
                date = nextWeekday(date);
                jdbc.update(
                    "INSERT INTO attendance (id, student_id, subject_id, marked_by, date, status) " +
                    "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, 'PRESENT') " +
                    "ON CONFLICT DO NOTHING",
                    UUID.randomUUID().toString(), studentId, subjectId, facultyId, date);
                date = date.plusDays(1);
            }
            for (int i = 0; i < absent; i++) {
                date = nextWeekday(date);
                jdbc.update(
                    "INSERT INTO attendance (id, student_id, subject_id, marked_by, date, status) " +
                    "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, 'ABSENT') " +
                    "ON CONFLICT DO NOTHING",
                    UUID.randomUUID().toString(), studentId, subjectId, facultyId, date);
                date = date.plusDays(1);
            }
        }
    }

    private void seedFacultySubjects(String facultyId) {
        String[] subjectIds = { SUBJ_DSA, SUBJ_OS, SUBJ_DBMS, SUBJ_CN, SUBJ_TOC, SUBJ_SE };
        for (String subjectId : subjectIds) {
            jdbc.update(
                "INSERT INTO faculty_subjects (id, faculty_id, subject_id) VALUES (?::uuid, ?::uuid, ?::uuid)",
                UUID.randomUUID().toString(), facultyId, subjectId);
        }
    }

    private LocalDate nextWeekday(LocalDate date) {
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }
        return date;
    }
}
