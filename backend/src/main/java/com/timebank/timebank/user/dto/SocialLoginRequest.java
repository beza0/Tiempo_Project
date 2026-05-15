package com.timebank.timebank.user.dto;

import jakarta.validation.constraints.NotBlank;

public class SocialLoginRequest {

    @NotBlank
    private String provider;

    private String accessToken;

    private String idToken;

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
