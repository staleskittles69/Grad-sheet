package com.siaas.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SubjectRequest(
    @NotBlank String code,
    @NotBlank String name,
    @NotNull Integer semesterNumber,
    @NotNull Integer credits,
    UUID departmentId
) {}
