package com.siaas.student.dto;

public record StudentProfileResponse(
    String fullName,
    String email,
    String rollNumber,
    int semester,
    String section
) {}
