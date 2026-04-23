package com.timebank.timebank.exchange;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timebank.timebank.config.JwtService;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Rezervasyon: oluştur → kabul → tamamla → öğrenci yorum. İptal: kabul → iptal.
 * PostgreSQL Testcontainers; Docker açık olmalı.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class ExchangeBookingIntegrationTest {

    private static final ZoneId TZ = ZoneId.of("Europe/Istanbul");
    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder();

    @Container
    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void dataSourceProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String ownerEmail;
    private String requesterEmail;
    private String ownerToken;
    private String requesterToken;
    private Instant scheduledStart;

    @BeforeEach
    void seedUsers() {
        ownerEmail = "owner-" + UUID.randomUUID() + "@test.local";
        requesterEmail = "learner-" + UUID.randomUUID() + "@test.local";
        String hash = BCRYPT.encode("pw");
        User owner = new User("Test Owner", ownerEmail, hash);
        User requester = new User("Test Learner", requesterEmail, hash);
        requester.setTimeCreditMinutes(300);
        userRepository.save(owner);
        userRepository.save(requester);
        ownerToken = jwtService.generateToken(ownerEmail, "USER");
        requesterToken = jwtService.generateToken(requesterEmail, "USER");

        ZonedDateTime start = ZonedDateTime.now(TZ).plusDays(1).withHour(15).withMinute(0).withSecond(0).withNano(0);
        if (start.isBefore(ZonedDateTime.now(TZ).plusHours(1))) {
            start = start.plusDays(1);
        }
        scheduledStart = start.toInstant();
    }

    @Test
    void booking_accept_complete_review_happyPath() throws Exception {
        String skillId = createSkill();
        String exchangeId = createBookingRequest(skillId);
        accept(exchangeId);
        complete(exchangeId);
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

    private String createSkill() throws Exception {
        ZonedDateTime z = scheduledStart.atZone(TZ);
        String day = z.getDayOfWeek().name();
        var body = objectMapper.createObjectNode();
        body.put("title", "Test skill");
        body.put("description", "Desc");
        body.put("durationMinutes", 60);
        body.put("category", "Sport");
        body.set("sessionTypes", objectMapper.valueToTree(List.of("online")));
        body.set("availableDays", objectMapper.valueToTree(List.of(day)));
        body.put("availableFrom", "08:00");
        body.put("availableUntil", "20:00");

        MvcResult r = mockMvc.perform(
                        post("/api/skills")
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(r.getResponse().getContentAsString());
        assertThat(root.has("id")).isTrue();
        return root.get("id").asText();
    }

    private String createBookingRequest(String skillId) throws Exception {
        var body = objectMapper.createObjectNode();
        body.put("message", "Integration test booking");
        body.put("bookedMinutes", 60);
        body.put("scheduledStartAt", scheduledStart.toString());

        MvcResult r = mockMvc.perform(
                        post("/api/exchange-requests/skill/{skillId}", skillId)
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private void accept(String exchangeId) throws Exception {
        mockMvc.perform(
                        put("/api/exchange-requests/{id}/accept", exchangeId)
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    private void complete(String exchangeId) throws Exception {
        mockMvc.perform(
                        put("/api/exchange-requests/{id}/complete", exchangeId)
                                .header("Authorization", "Bearer " + ownerToken)
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
