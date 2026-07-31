package com.siaas.admin.dto;

import java.util.List;
import java.util.UUID;

public record AdminStatsResponse(
    long totalStudents,
    long totalFaculty,
    long activeSubjects,
    long totalDepartments,
    List<RecentStudent> recentStudents,
    List<RecentFaculty> recentFaculty
) {
    public record RecentStudent(UUID id, String fullName, String rollNumber, int semester) {}
    public record RecentFaculty(UUID id, String fullName, List<String> subjectCodes) {}
}
