package com.siaas.admin.dto;

import java.util.List;
import java.util.UUID;

public record FacultySummaryResponse(
    UUID id,
    String fullName,
    String email,
    String employeeId,
    String designation,
    UUID departmentId,
    String departmentName,
    List<String> subjectCodes,
    boolean active
) {}
