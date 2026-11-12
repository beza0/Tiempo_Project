package com.timebank.timebank.user;

import com.timebank.timebank.config.AuthCookieService;
import com.timebank.timebank.support.AbstractPostgresIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthHardeningIntegrationTest extends AbstractPostgresIntegrationTest {

    /** Çerezle oturum + yabancı Origin: siteler arası form POST'u (CSRF) reddedilir, hesap silinmez. */
    @Test
    void crossSiteCookiePost_isRejected() throws Exception {
        mockMvc.perform(post("/api/users/me/delete")
                        .cookie(new Cookie(AuthCookieService.COOKIE_NAME, requesterToken))
                        .header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());
        assertThat(userRepository.findByEmailIgnoreCase(requesterEmail)).isPresent();
    }

    @Test
    void cookiePost_fromAllowedOrigin_isAccepted() throws Exception {
        mockMvc.perform(post("/api/notifications/mark-all-read")
                        .cookie(new Cookie(AuthCookieService.COOKIE_NAME, requesterToken))
                        .header("Origin", "https://www.tiempos.site"))
                .andExpect(status().is2xxSuccessful());
    }

    /** 5 hatalı denemeden sonra sıfırlama kodu geçersiz olur (kaba kuvvet savunması). */
    @Test
    void resetCode_isInvalidated_afterRepeatedFailures() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + requesterEmail + "\"}"))
                .andExpect(status().is2xxSuccessful());
        String realCode = userRepository.findByEmailIgnoreCase(requesterEmail).orElseThrow().getPasswordResetToken();
        assertThat(realCode).isNotBlank();
        String wrong = "000000".equals(realCode) ? "111111" : "000000";

        for (int i = 0; i < CodeAttemptTracker.MAX_FAILURES; i++) {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body(wrong)))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(realCode)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private String body(String code) {
        return "{\"email\":\"" + requesterEmail + "\",\"token\":\"" + code + "\",\"newPassword\":\"NewPassword123\"}";
    }
}
