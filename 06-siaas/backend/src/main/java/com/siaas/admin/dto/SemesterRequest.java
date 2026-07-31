package com.siaas.admin.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SemesterRequest(
    @NotBlank String name,
    LocalDate startDate,
    LocalDate endDate,
    boolean active
) {}
