package com.timebank.timebank.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class VerifyEmailCodeRequest {

    @NotBlank(message = "E-posta gerekli")
    @Email(message = "Geçerli bir e-posta girin")
    private String email;

    /** 6 haneli doğrulama kodu */
    @NotBlank(message = "Doğrulama kodu gerekli")
    @Size(min = 6, max = 6, message = "Kod 6 hane olmalıdır")
    @Pattern(regexp = "^[0-9]{6}$", message = "Kod yalnızca 6 rakamdan oluşmalıdır")
    private String code;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
