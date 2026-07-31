package com.siaas.admin.dto;

import java.util.UUID;

public record SubjectResponse(
    UUID id,
    String code,
    String name,
    int semesterNumber,
    int credits,
    UUID departmentId,
    String departmentName
) {}
