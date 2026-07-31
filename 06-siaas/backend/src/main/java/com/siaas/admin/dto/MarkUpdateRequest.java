package com.siaas.admin.dto;

import jakarta.validation.constraints.NotNull;

public record MarkUpdateRequest(
    @NotNull Double internal,
    @NotNull Double external,
    @NotNull Double lab,
    @NotNull Double assignment
) {}
