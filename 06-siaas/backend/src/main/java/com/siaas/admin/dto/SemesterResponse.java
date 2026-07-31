package com.siaas.admin.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SemesterResponse(
    UUID id,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    boolean active
) {}
