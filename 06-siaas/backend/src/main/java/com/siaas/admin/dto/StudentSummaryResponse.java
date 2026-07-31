package com.siaas.admin.dto;

import java.util.UUID;

public record StudentSummaryResponse(
    UUID id,
    String fullName,
    String email,
    String rollNumber,
    int semester,
    String section,
    UUID departmentId,
    String departmentName,
    int admissionYear,
    boolean active
) {}
