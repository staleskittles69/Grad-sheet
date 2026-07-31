package com.siaas.admin;

import com.siaas.academic.*;
import com.siaas.admin.dto.*;
import com.siaas.attendance.Attendance;
import com.siaas.attendance.AttendanceRepository;
import com.siaas.common.ConflictException;
import com.siaas.common.ResourceNotFoundException;
import com.siaas.faculty.Faculty;
import com.siaas.faculty.FacultyRepository;
import com.siaas.student.Student;
import com.siaas.student.StudentRepository;
import com.siaas.user.Role;
import com.siaas.user.User;
import com.siaas.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final MarksRepository marksRepository;
    private final AttendanceRepository attendanceRepository;
    private final FacultySubjectRepository facultySubjectRepository;
    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder;

    // ─── Dashboard ──────────────────────────────────────────────────────────

    public AdminStatsResponse getStats() {
        long totalStudents = studentRepository.count();
        long totalFaculty = facultyRepository.count();
        long activeSubjects = subjectRepository.count();
        long totalDepartments = departmentRepository.count();

        List<AdminStatsResponse.RecentStudent> recentStudents = studentRepository
            .findRecent(PageRequest.of(0, 5)).stream()
            .map(s -> new AdminStatsResponse.RecentStudent(s.getId(), s.getFullName(), s.getRollNumber(), s.getSemester()))
            .toList();

        List<AdminStatsResponse.RecentFaculty> recentFaculty = facultyRepository
            .findRecent(PageRequest.of(0, 5)).stream()
            .map(f -> new AdminStatsResponse.RecentFaculty(f.getId(), f.getFullName(),
                facultySubjectRepository.findSubjectsByFacultyId(f.getId()).stream().map(Subject::getCode).toList()))
            .toList();

        return new AdminStatsResponse(totalStudents, totalFaculty, activeSubjects, totalDepartments, recentStudents, recentFaculty);
    }

    // ─── Students ───────────────────────────────────────────────────────────

    public List<StudentSummaryResponse> listStudents(String q) {
        return studentRepository.search(blankToNull(q)).stream().map(this::toStudentResponse).toList();
    }

    public StudentSummaryResponse getStudent(UUID id) {
        return toStudentResponse(findStudentOrThrow(id));
    }

    public StudentSummaryResponse createStudent(StudentRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already registered");
        }
        if (req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        User user = userRepository.saveAndFlush(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .role(Role.STUDENT)
            .isVerified(true)
            .isActive(true)
            .build());

        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO students (id, user_id, department_id, roll_number, full_name, semester, section, admission_year) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            id, user.getId(), req.departmentId(), req.rollNumber(), req.fullName(),
            req.semester(), req.section(), req.admissionYear());

        return toStudentResponse(findStudentOrThrow(id));
    }

    public StudentSummaryResponse updateStudent(UUID id, StudentRequest req) {
        Student student = findStudentOrThrow(id);
        User user = student.getUser();

        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already registered");
        }
        user.setEmail(req.email());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        userRepository.save(user);

        jdbc.update(
            "UPDATE students SET department_id = ?, roll_number = ?, full_name = ?, semester = ?, " +
            "section = ?, admission_year = ?, updated_at = NOW() WHERE id = ?",
            req.departmentId(), req.rollNumber(), req.fullName(), req.semester(),
            req.section(), req.admissionYear(), id);

        return toStudentResponse(findStudentOrThrow(id));
    }

    public StudentSummaryResponse toggleStudentActive(UUID id) {
        Student student = findStudentOrThrow(id);
        User user = student.getUser();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return toStudentResponse(findStudentOrThrow(id));
    }

    private Student findStudentOrThrow(UUID id) {
        return studentRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new ResourceNotFoundException("Student", id.toString()));
    }

    private StudentSummaryResponse toStudentResponse(Student s) {
        Department d = s.getDepartment();
        return new StudentSummaryResponse(
            s.getId(), s.getFullName(), s.getUser().getEmail(), s.getRollNumber(),
            s.getSemester(), s.getSection(), d != null ? d.getId() : null, d != null ? d.getName() : null,
            s.getAdmissionYear(), s.getUser().isActive());
    }

    // ─── Faculty ────────────────────────────────────────────────────────────

    public List<FacultySummaryResponse> listFaculty(String q) {
        return facultyRepository.search(blankToNull(q)).stream().map(this::toFacultyResponse).toList();
    }

    public FacultySummaryResponse getFaculty(UUID id) {
        return toFacultyResponse(findFacultyOrThrow(id));
    }

    public FacultySummaryResponse createFaculty(FacultyRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already registered");
        }
        if (req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        User user = userRepository.saveAndFlush(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .role(Role.FACULTY)
            .isVerified(true)
            .isActive(true)
            .build());

        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO faculty (id, user_id, department_id, full_name, designation, employee_id) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
            id, user.getId(), req.departmentId(), req.fullName(), req.designation(), req.employeeId());

        assignSubjects(id, req.subjectIds());

        return toFacultyResponse(findFacultyOrThrow(id));
    }

    public FacultySummaryResponse updateFaculty(UUID id, FacultyRequest req) {
        Faculty faculty = findFacultyOrThrow(id);
        User user = faculty.getUser();

        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already registered");
        }
        user.setEmail(req.email());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        userRepository.save(user);

        jdbc.update(
            "UPDATE faculty SET department_id = ?, full_name = ?, designation = ?, employee_id = ? WHERE id = ?",
            req.departmentId(), req.fullName(), req.designation(), req.employeeId(), id);

        assignSubjects(id, req.subjectIds());

        return toFacultyResponse(findFacultyOrThrow(id));
    }

    public FacultySummaryResponse toggleFacultyActive(UUID id) {
        Faculty faculty = findFacultyOrThrow(id);
        User user = faculty.getUser();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return toFacultyResponse(findFacultyOrThrow(id));
    }

    public List<SubjectResponse> getFacultySubjects(UUID facultyId) {
        findFacultyOrThrow(facultyId);
        return facultySubjectRepository.findSubjectsByFacultyId(facultyId).stream().map(this::toSubjectResponse).toList();
    }

    public List<SubjectResponse> replaceFacultySubjects(UUID facultyId, List<UUID> subjectIds) {
        findFacultyOrThrow(facultyId);
        assignSubjects(facultyId, subjectIds);
        return getFacultySubjects(facultyId);
    }

    private void assignSubjects(UUID facultyId, List<UUID> subjectIds) {
        facultySubjectRepository.deleteByFaculty_Id(facultyId);
        if (subjectIds == null) return;
        for (UUID subjectId : subjectIds) {
            if (!subjectRepository.existsById(subjectId)) {
                throw new ResourceNotFoundException("Subject", subjectId.toString());
            }
            jdbc.update(
                "INSERT INTO faculty_subjects (id, faculty_id, subject_id) VALUES (?, ?, ?)",
                UUID.randomUUID(), facultyId, subjectId);
        }
    }

    private Faculty findFacultyOrThrow(UUID id) {
        return facultyRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new ResourceNotFoundException("Faculty", id.toString()));
    }

    private FacultySummaryResponse toFacultyResponse(Faculty f) {
        Department d = f.getDepartment();
        List<String> subjectCodes = facultySubjectRepository.findSubjectsByFacultyId(f.getId()).stream()
            .map(Subject::getCode).toList();
        return new FacultySummaryResponse(
            f.getId(), f.getFullName(), f.getUser().getEmail(), f.getEmployeeId(), f.getDesignation(),
            d != null ? d.getId() : null, d != null ? d.getName() : null, subjectCodes, f.getUser().isActive());
    }

    // ─── Departments ────────────────────────────────────────────────────────

    public List<DepartmentResponse> listDepartments() {
        return departmentRepository.findAllByOrderByNameAsc().stream().map(this::toDepartmentResponse).toList();
    }

    public DepartmentResponse getDepartment(UUID id) {
        return toDepartmentResponse(departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department", id.toString())));
    }

    public DepartmentResponse createDepartment(DepartmentRequest req) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO departments (id, name, code) VALUES (?, ?, ?)", id, req.name(), req.code());
        return new DepartmentResponse(id, req.name(), req.code());
    }

    public DepartmentResponse updateDepartment(UUID id, DepartmentRequest req) {
        departmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Department", id.toString()));
        jdbc.update("UPDATE departments SET name = ?, code = ? WHERE id = ?", req.name(), req.code(), id);
        return new DepartmentResponse(id, req.name(), req.code());
    }

    public void deleteDepartment(UUID id) {
        departmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Department", id.toString()));
        if (studentRepository.countByDepartment_Id(id) > 0 || facultyRepository.countByDepartment_Id(id) > 0) {
            throw new ConflictException("Cannot delete department with linked students or faculty");
        }
        departmentRepository.deleteById(id);
    }

    private DepartmentResponse toDepartmentResponse(Department d) {
        return new DepartmentResponse(d.getId(), d.getName(), d.getCode());
    }

    // ─── Semesters ──────────────────────────────────────────────────────────

    public List<SemesterResponse> listSemesters() {
        return semesterRepository.findAllByOrderByNameAsc().stream().map(this::toSemesterResponse).toList();
    }

    public SemesterResponse getSemester(UUID id) {
        return toSemesterResponse(semesterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Semester", id.toString())));
    }

    public SemesterResponse createSemester(SemesterRequest req) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO semesters (id, name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)",
            id, req.name(), req.startDate(), req.endDate(), req.active());
        return new SemesterResponse(id, req.name(), req.startDate(), req.endDate(), req.active());
    }

    public SemesterResponse updateSemester(UUID id, SemesterRequest req) {
        semesterRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Semester", id.toString()));
        jdbc.update(
            "UPDATE semesters SET name = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?",
            req.name(), req.startDate(), req.endDate(), req.active(), id);
        return new SemesterResponse(id, req.name(), req.startDate(), req.endDate(), req.active());
    }

    public void deleteSemester(UUID id) {
        semesterRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Semester", id.toString()));
        if (marksRepository.existsBySemester_Id(id)) {
            throw new ConflictException("Cannot delete semester with existing marks");
        }
        semesterRepository.deleteById(id);
    }

    private SemesterResponse toSemesterResponse(Semester s) {
        return new SemesterResponse(s.getId(), s.getName(), s.getStartDate(), s.getEndDate(), s.isActive());
    }

    // ─── Subjects ───────────────────────────────────────────────────────────

    public List<SubjectResponse> listSubjects() {
        return subjectRepository.findAllWithDepartment().stream().map(this::toSubjectResponse).toList();
    }

    public SubjectResponse getSubject(UUID id) {
        return toSubjectResponse(subjectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Subject", id.toString())));
    }

    public SubjectResponse createSubject(SubjectRequest req) {
        validateDepartment(req.departmentId());
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO subjects (id, department_id, code, name, semester_number, credits) VALUES (?, ?, ?, ?, ?, ?)",
            id, req.departmentId(), req.code(), req.name(), req.semesterNumber(), req.credits());
        return toSubjectResponse(subjectRepository.findById(id).orElseThrow());
    }

    public SubjectResponse updateSubject(UUID id, SubjectRequest req) {
        subjectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Subject", id.toString()));
        validateDepartment(req.departmentId());
        jdbc.update(
            "UPDATE subjects SET department_id = ?, code = ?, name = ?, semester_number = ?, credits = ? WHERE id = ?",
            req.departmentId(), req.code(), req.name(), req.semesterNumber(), req.credits(), id);
        return toSubjectResponse(subjectRepository.findById(id).orElseThrow());
    }

    public void deleteSubject(UUID id) {
        subjectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Subject", id.toString()));
        if (marksRepository.existsBySubject_Id(id) || attendanceRepository.existsBySubject_Id(id)) {
            throw new ConflictException("Cannot delete subject with existing marks or attendance");
        }
        subjectRepository.deleteById(id);
    }

    private void validateDepartment(UUID departmentId) {
        if (departmentId != null && !departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department", departmentId.toString());
        }
    }

    private SubjectResponse toSubjectResponse(Subject s) {
        Department d = s.getDepartment();
        return new SubjectResponse(s.getId(), s.getCode(), s.getName(), s.getSemesterNumber(), s.getCredits(),
            d != null ? d.getId() : null, d != null ? d.getName() : null);
    }

    // ─── Marks override ─────────────────────────────────────────────────────

    public List<MarkRowResponse> getMarks(UUID studentId, UUID semesterId) {
        return marksRepository.findByStudentAndSemester(studentId, semesterId).stream().map(this::toMarkRow).toList();
    }

    public MarkRowResponse updateMark(UUID markId, MarkUpdateRequest req) {
        Marks mark = marksRepository.findById(markId)
            .orElseThrow(() -> new ResourceNotFoundException("Mark", markId.toString()));

        double total = req.internal() + req.external() + req.lab() + req.assignment();
        GradeResult gr = recalc(total);

        jdbc.update(
            "UPDATE marks SET internal = ?, external = ?, lab = ?, assignment = ?, total = ?, " +
            "grade = ?, grade_points = ?, updated_at = NOW() WHERE id = ?",
            req.internal(), req.external(), req.lab(), req.assignment(), total, gr.grade(), gr.points(), markId);

        return new MarkRowResponse(markId, mark.getSubject().getCode(), mark.getSubject().getName(),
            req.internal(), req.external(), req.lab(), req.assignment(), total, gr.grade(), gr.points());
    }

    private MarkRowResponse toMarkRow(Marks m) {
        return new MarkRowResponse(m.getId(), m.getSubject().getCode(), m.getSubject().getName(),
            m.getInternal(), m.getExternal(), m.getLab(), m.getAssignment(), m.getTotal(), m.getGrade(), m.getGradePoints());
    }

    private GradeResult recalc(double total) {
        if (total >= 90) return new GradeResult("O", 10.0);
        if (total >= 80) return new GradeResult("A+", 9.0);
        if (total >= 70) return new GradeResult("B+", 7.0);
        if (total >= 60) return new GradeResult("C", 5.0);
        if (total >= 50) return new GradeResult("B", 6.0);
        if (total >= 40) return new GradeResult("D", 4.0);
        return new GradeResult("F", 0.0);
    }

    private record GradeResult(String grade, double points) {}

    // ─── Attendance override ───────────────────────────────────────────────

    public List<AttendanceRowResponse> getAttendance(UUID studentId, UUID subjectId) {
        return attendanceRepository.findByStudentAndSubject(studentId, subjectId).stream()
            .map(a -> new AttendanceRowResponse(a.getId(), a.getDate(), a.getStatus())).toList();
    }

    public AttendanceRowResponse updateAttendance(UUID attendanceId, AttendanceUpdateRequest req) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance", attendanceId.toString()));
        jdbc.update("UPDATE attendance SET status = ? WHERE id = ?", req.status(), attendanceId);
        return new AttendanceRowResponse(attendance.getId(), attendance.getDate(), req.status());
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
