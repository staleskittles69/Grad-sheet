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
