package com.timebank.timebank.user.dto;

import java.util.UUID;

public class LoginResponse {
    private String token;
    private UUID userId;
    private String email;
    private String fullName;
    private String role;

    public LoginResponse(String token, UUID userId, String email, String fullName, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() { return token; }
    public UUID getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
}