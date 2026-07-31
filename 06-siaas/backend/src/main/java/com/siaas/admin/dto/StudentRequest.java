package com.siaas.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StudentRequest(
    @NotBlank @Email String email,
    String password,
    @NotBlank String fullName,
    @NotBlank String rollNumber,
    @NotNull Integer semester,
    String section,
    UUID departmentId,
    @NotNull Integer admissionYear
) {}
