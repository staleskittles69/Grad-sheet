package com.siaas.student;

import com.siaas.common.ApiResponse;
import com.siaas.student.dto.AcademicsResponse;
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

    @GetMapping("/academics")
    public ResponseEntity<ApiResponse<AcademicsResponse>> academics(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getAcademics(user)));
    }
}
