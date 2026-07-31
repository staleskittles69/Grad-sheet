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
        boolean weak
    ) {}
}
