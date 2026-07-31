package com.siaas.admin;

import com.siaas.admin.dto.*;
import com.siaas.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getStats()));
    }

    // ─── Students ───────────────────────────────────────────────────────────

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<StudentSummaryResponse>>> listStudents(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listStudents(q)));
    }

    @PostMapping("/students")
    public ResponseEntity<ApiResponse<StudentSummaryResponse>> createStudent(@Valid @RequestBody StudentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Student created", adminService.createStudent(req)));
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<ApiResponse<StudentSummaryResponse>> getStudent(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getStudent(id)));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<ApiResponse<StudentSummaryResponse>> updateStudent(
            @PathVariable UUID id, @Valid @RequestBody StudentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Student updated", adminService.updateStudent(id, req)));
    }

    @PatchMapping("/students/{id}")
    public ResponseEntity<ApiResponse<StudentSummaryResponse>> toggleStudentActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.toggleStudentActive(id)));
    }

    // ─── Faculty ────────────────────────────────────────────────────────────

    @GetMapping("/faculty")
    public ResponseEntity<ApiResponse<List<FacultySummaryResponse>>> listFaculty(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listFaculty(q)));
    }

    @PostMapping("/faculty")
    public ResponseEntity<ApiResponse<FacultySummaryResponse>> createFaculty(@Valid @RequestBody FacultyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Faculty created", adminService.createFaculty(req)));
    }

    @GetMapping("/faculty/{id}")
    public ResponseEntity<ApiResponse<FacultySummaryResponse>> getFaculty(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getFaculty(id)));
    }

    @PutMapping("/faculty/{id}")
    public ResponseEntity<ApiResponse<FacultySummaryResponse>> updateFaculty(
            @PathVariable UUID id, @Valid @RequestBody FacultyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Faculty updated", adminService.updateFaculty(id, req)));
    }

    @PatchMapping("/faculty/{id}")
    public ResponseEntity<ApiResponse<FacultySummaryResponse>> toggleFacultyActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.toggleFacultyActive(id)));
    }

    @GetMapping("/faculty/{id}/subjects")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getFacultySubjects(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getFacultySubjects(id)));
    }

    @PutMapping("/faculty/{id}/subjects")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> replaceFacultySubjects(
            @PathVariable UUID id, @RequestBody List<UUID> subjectIds) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.replaceFacultySubjects(id, subjectIds)));
    }

    // ─── Departments ────────────────────────────────────────────────────────

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> listDepartments() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listDepartments()));
    }

    @PostMapping("/departments")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(@Valid @RequestBody DepartmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Department created", adminService.createDepartment(req)));
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDepartment(id)));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable UUID id, @Valid @RequestBody DepartmentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Department updated", adminService.updateDepartment(id, req)));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable UUID id) {
        adminService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.ok("Department deleted", null));
    }

    // ─── Semesters ──────────────────────────────────────────────────────────

    @GetMapping("/semesters")
    public ResponseEntity<ApiResponse<List<SemesterResponse>>> listSemesters() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listSemesters()));
    }

    @PostMapping("/semesters")
    public ResponseEntity<ApiResponse<SemesterResponse>> createSemester(@Valid @RequestBody SemesterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Semester created", adminService.createSemester(req)));
    }

    @GetMapping("/semesters/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> getSemester(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getSemester(id)));
    }

    @PutMapping("/semesters/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> updateSemester(
            @PathVariable UUID id, @Valid @RequestBody SemesterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Semester updated", adminService.updateSemester(id, req)));
    }

    @DeleteMapping("/semesters/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSemester(@PathVariable UUID id) {
        adminService.deleteSemester(id);
        return ResponseEntity.ok(ApiResponse.ok("Semester deleted", null));
    }

    // ─── Subjects ───────────────────────────────────────────────────────────

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> listSubjects() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listSubjects()));
    }

    @PostMapping("/subjects")
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(@Valid @RequestBody SubjectRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Subject created", adminService.createSubject(req)));
    }

    @GetMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubject(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getSubject(id)));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable UUID id, @Valid @RequestBody SubjectRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Subject updated", adminService.updateSubject(id, req)));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable UUID id) {
        adminService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.ok("Subject deleted", null));
    }

    // ─── Marks override ─────────────────────────────────────────────────────

    @GetMapping("/marks")
    public ResponseEntity<ApiResponse<List<MarkRowResponse>>> getMarks(
            @RequestParam UUID studentId, @RequestParam UUID semesterId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getMarks(studentId, semesterId)));
    }

    @PatchMapping("/marks/{id}")
    public ResponseEntity<ApiResponse<MarkRowResponse>> updateMark(
            @PathVariable UUID id, @Valid @RequestBody MarkUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Mark updated", adminService.updateMark(id, req)));
    }

    // ─── Attendance override ───────────────────────────────────────────────

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRowResponse>>> getAttendance(
            @RequestParam UUID studentId, @RequestParam UUID subjectId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAttendance(studentId, subjectId)));
    }

    @PatchMapping("/attendance/{id}")
    public ResponseEntity<ApiResponse<AttendanceRowResponse>> updateAttendance(
            @PathVariable UUID id, @Valid @RequestBody AttendanceUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Attendance updated", adminService.updateAttendance(id, req)));
    }
}
