package com.timebank.timebank.credit;

import com.timebank.timebank.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prod varsayılanı (redirect, PSP doğrulaması yok): satın alma kapalı.
 * Önceden checkout'un döndürdüğü sessionId ile /complete çağrısı ödeme olmadan kredi ekliyordu.
 */
@TestPropertySource(properties = "app.payment.mode=redirect")
class CreditPurchaseDisabledIntegrationTest extends AbstractPostgresIntegrationTest {

    @Test
    void purchaseIsDisabled_withoutVerifiedPaymentProvider() throws Exception {
        long before = requesterCreditMinutes();

        mockMvc.perform(get("/api/credits/availability").header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchaseEnabled").value(false));

        mockMvc.perform(post("/api/credits/checkout")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"packageId\":\"ultimate\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/credits/complete/{id}", "00000000-0000-0000-0000-000000000000")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(requesterCreditMinutes()).isEqualTo(before);
    }
}
