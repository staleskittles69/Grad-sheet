package com.siaas.admin.dto;

import jakarta.validation.constraints.Pattern;

public record AttendanceUpdateRequest(
    @Pattern(regexp = "PRESENT|ABSENT|LEAVE") String status
) {}
