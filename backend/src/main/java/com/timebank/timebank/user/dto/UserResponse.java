package com.timebank.timebank.user.dto;

import java.util.UUID;

public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private long timeCreditMinutes;

    public UserResponse(UUID id, String fullName, String email, long timeCreditMinutes) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.timeCreditMinutes = timeCreditMinutes;
    }

    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public long getTimeCreditMinutes() { return timeCreditMinutes; }
}
