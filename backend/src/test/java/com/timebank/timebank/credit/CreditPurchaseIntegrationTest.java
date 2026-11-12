package com.timebank.timebank.credit;

import com.fasterxml.jackson.databind.JsonNode;
import com.timebank.timebank.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Demo ödeme: checkout → complete → kredi artışı. */
class CreditPurchaseIntegrationTest extends AbstractPostgresIntegrationTest {

    @Test
    void checkoutAndComplete_addsPackageMinutes() throws Exception {
        long before = requesterCreditMinutes();

        var checkoutBody = objectMapper.createObjectNode();
        checkoutBody.put("packageId", "starter");

        MvcResult checkout = mockMvc.perform(
                        post("/api/credits/checkout")
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(checkoutBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demoMode").value(true))
                .andReturn();

        JsonNode checkoutJson = objectMapper.readTree(checkout.getResponse().getContentAsString());
        String sessionId = checkoutJson.get("sessionId").asText();
        assertThat(sessionId).isNotBlank();

        mockMvc.perform(
                        post("/api/credits/complete/{sessionId}", sessionId)
                                .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.minutesAdded").value(60));

        assertThat(requesterCreditMinutes()).isEqualTo(before + 60);

        // Demo satın alma deftere PURCHASE olarak yazılır; aynı oturum ikinci kez kullanılamaz.
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/api/transactions/mine")
                                .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("PURCHASE"));
        mockMvc.perform(
                        post("/api/credits/complete/{sessionId}", sessionId)
                                .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isBadRequest());
        assertThat(requesterCreditMinutes()).isEqualTo(before + 60);
    }
}
