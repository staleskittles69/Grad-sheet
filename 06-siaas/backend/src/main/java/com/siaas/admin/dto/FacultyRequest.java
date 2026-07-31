package com.siaas.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record FacultyRequest(
    @NotBlank @Email String email,
    String password,
    @NotBlank String fullName,
    @NotBlank String employeeId,
    String designation,
    UUID departmentId,
    List<UUID> subjectIds
) {}
