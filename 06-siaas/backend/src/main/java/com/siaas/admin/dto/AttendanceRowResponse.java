package com.siaas.admin.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AttendanceRowResponse(
    UUID id,
    LocalDate date,
    String status
) {}
