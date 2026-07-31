package com.siaas.auth.dto;

import com.siaas.user.Role;

import java.util.UUID;

public record MeResponse(UUID id, String email, Role role) {}
