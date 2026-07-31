package com.siaas.admin.dto;

import java.util.UUID;

public record MarkRowResponse(
    UUID id,
    String subjectCode,
    String subjectName,
    double internal,
    double external,
    double lab,
    double assignment,
    double total,
    String grade,
    double gradePoints
) {}
