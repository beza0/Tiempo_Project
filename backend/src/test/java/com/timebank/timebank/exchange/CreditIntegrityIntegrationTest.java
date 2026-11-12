package com.timebank.timebank.exchange;

import com.timebank.timebank.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kredi bütünlüğü regresyonları: eşzamanlı kabul, erken aktarım, onaysız oturum iadesi.
 */
class CreditIntegrityIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private ExchangeRequestService exchangeRequestService;

    /** Önceden: 60 dk bakiyeyle iki 60 dk talep aynı anda kabul edilebiliyor, 60 dk yoktan var oluyordu. */
    @Test
    void concurrentAccepts_neverOverdrawBalance() throws Exception {
        String skillId = createSkill();
        Instant a = scheduledStart;
        Instant b = scheduledStart.plus(3, ChronoUnit.HOURS);
        String ex1 = createBookingRequest(skillId, a, 60);
        String ex2 = createBookingRequest(skillId, b, 60);
        setRequesterCreditMinutes(60);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (String id : List.of(ex1, ex2)) {
            results.add(pool.submit(() -> {
                go.await();
                MvcResult r = mockMvc.perform(put("/api/exchange-requests/{id}/accept", id)
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON))
                        .andReturn();
                return r.getResponse().getStatus();
            }));
        }
        go.countDown();
        int ok = 0;
        for (Future<Integer> f : results) {
            if (f.get() == 200) {
                ok++;
            }
        }
        pool.shutdown();

        assertThat(ok).as("yalnızca bir kabul başarılı olmalı").isEqualTo(1);
        assertThat(requesterCreditMinutes()).isEqualTo(0);
    }

    /** Önceden: seanstan saatler önce "tamamla" + "başladım" ile tam aktarım yapılabiliyordu. */
    @Test
    void attendanceAck_beforeStart_isRejected_andCreditStaysHeld() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        accept(exchangeId);
        long ownerBefore = ownerCreditMinutes();

        mockMvc.perform(put("/api/exchange-requests/{id}/complete", exchangeId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/exchange-requests/{id}/ack-attendance", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        ExchangeRequest ex = exchangeRequestRepository.findById(UUID.fromString(exchangeId)).orElseThrow();
        assertThat(ex.getStatus()).isEqualTo(ExchangeRequestStatus.ACCEPTED);
        assertThat(ex.isRequesterCreditHeld()).isTrue();
        assertThat(ownerCreditMinutes()).isEqualTo(ownerBefore);
    }

    @Test
    void doubleAccept_debitsOnce() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        long before = requesterCreditMinutes();
        accept(exchangeId);
        mockMvc.perform(put("/api/exchange-requests/{id}/accept", exchangeId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
        assertThat(requesterCreditMinutes()).isEqualTo(before - 60);
    }

    /** Önceden: seans öncesi onay penceresi kaçarsa kredi süresiz askıda kalıyordu. */
    @Test
    void unconfirmedSession_isRefunded_afterGracePeriod() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        long before = requesterCreditMinutes();
        accept(exchangeId);
        assertThat(requesterCreditMinutes()).isEqualTo(before - 60);

        Instant longAgo = Instant.now()
                .minus(60, ChronoUnit.MINUTES)
                .minus(ExchangeRequestService.UNCONFIRMED_SESSION_GRACE_HOURS, ChronoUnit.HOURS)
                .minus(5, ChronoUnit.MINUTES);
        setScheduledStart(UUID.fromString(exchangeId), longAgo);

        exchangeRequestService.settleDueSessionsAtEnd();

        ExchangeRequest ex = exchangeRequestRepository.findById(UUID.fromString(exchangeId)).orElseThrow();
        assertThat(ex.getStatus()).isEqualTo(ExchangeRequestStatus.CANCELLED);
        assertThat(ex.isRequesterCreditHeld()).isFalse();
        assertThat(requesterCreditMinutes()).isEqualTo(before);
    }

    @Test
    void unconfirmedSession_withinGrace_staysOpen_andCanBeAcknowledged() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        accept(exchangeId);
        long ownerBefore = ownerCreditMinutes();
        setScheduledStart(UUID.fromString(exchangeId), Instant.now().minus(2, ChronoUnit.HOURS));

        exchangeRequestService.settleDueSessionsAtEnd();
        ExchangeRequest ex = exchangeRequestRepository.findById(UUID.fromString(exchangeId)).orElseThrow();
        assertThat(ex.getStatus()).isEqualTo(ExchangeRequestStatus.ACCEPTED);

        mockMvc.perform(put("/api/exchange-requests/{id}/complete", exchangeId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/exchange-requests/{id}/ack-attendance", exchangeId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        assertThat(ownerCreditMinutes()).isEqualTo(ownerBefore + 60);
    }
}
