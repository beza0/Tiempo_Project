package com.timebank.timebank.exchange;

import com.timebank.timebank.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Rezervasyon: oluştur → kabul → tamamla → öğrenci yorum. İptal: kabul → iptal.
 */
class ExchangeBookingIntegrationTest extends AbstractPostgresIntegrationTest {

    @Test
    void booking_accept_complete_review_happyPath() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        accept(exchangeId);
        // Katılım onayı yalnızca seans başladıktan sonra geçerli: başlangıcı geçmişe al.
        setScheduledStart(java.util.UUID.fromString(exchangeId), java.time.Instant.now().minusSeconds(300));
        ownerMarksSessionComplete(exchangeId);
        requesterAcknowledgesAttendance(exchangeId);
        postReview(exchangeId);
        mockMvc.perform(
                        MockMvcRequestBuilders.get("/api/reviews/me/given")
                                .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].rating").value(5));
    }

    @Test
    void booking_accept_cancel() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        accept(exchangeId);
        mockMvc.perform(
                        put("/api/exchange-requests/{id}/cancel", exchangeId)
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    /** Eğitmen tamamlar (katılım onayı); durum ACCEPTED kalır. */
    private void ownerMarksSessionComplete(String exchangeId) throws Exception {
        mockMvc.perform(
                        put("/api/exchange-requests/{id}/complete", exchangeId)
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    /** Talep sahibi katılım onayı — her iki onay sonrası COMPLETED. */
    private void requesterAcknowledgesAttendance(String exchangeId) throws Exception {
        mockMvc.perform(
                        post("/api/exchange-requests/{id}/ack-attendance", exchangeId)
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    private void postReview(String exchangeId) throws Exception {
        var body = objectMapper.createObjectNode();
        body.put("rating", 5);
        body.put("comment", "Great session");
        mockMvc.perform(
                        post("/api/reviews/exchange/{id}", exchangeId)
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(5));
    }
}
