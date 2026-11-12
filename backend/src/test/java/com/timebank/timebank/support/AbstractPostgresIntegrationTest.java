package com.timebank.timebank.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timebank.timebank.config.JwtService;
import com.timebank.timebank.exchange.ExchangeRequest;
import com.timebank.timebank.exchange.ExchangeRequestRepository;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Paylaşımlı PostgreSQL Testcontainers. Docker çalışmıyorsa testler başarısız olur (sessiz atlama yok);
 * yerelde Docker Desktop'ı açıp {@code ./mvnw test} çalıştırın.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = false)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public abstract class AbstractPostgresIntegrationTest {

    protected static final ZoneId TZ = ZoneId.of("Europe/Istanbul");
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
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected ExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    protected JwtService jwtService;

    protected String ownerEmail;
    protected String requesterEmail;
    protected String ownerToken;
    protected String requesterToken;
    protected Instant scheduledStart;

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

        ZonedDateTime start = ZonedDateTime.now(TZ).plusHours(2).withMinute(0).withSecond(0).withNano(0);
        scheduledStart = start.toInstant();
    }

    protected String createSkill() throws Exception {
        return createSkill(scheduledStart);
    }

    protected String createSkill(Instant startAt) throws Exception {
        ZonedDateTime z = startAt.atZone(TZ);
        String day = z.getDayOfWeek().name();
        var body = objectMapper.createObjectNode();
        body.put("title", "Test skill");
        body.put("description", "Desc");
        body.put("durationMinutes", 60);
        body.put("category", "Sport");
        body.set("sessionTypes", objectMapper.valueToTree(List.of("online")));
        body.set("availableDays", objectMapper.valueToTree(List.of(day)));
        // Gün boyu uygunluk: testler günün saatinden bağımsız çalışsın (önceden 08–20 aralığı,
        // "şimdi + 2 saat" gece saatlerinde aralık dışına düşüp testleri kırıyordu).
        body.put("availableFrom", "00:00");
        body.put("availableUntil", "23:59");

        MvcResult r = mockMvc.perform(
                        post("/api/skills")
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isBetween(200, 299);
        JsonNode root = objectMapper.readTree(r.getResponse().getContentAsString());
        assertThat(root.has("id")).isTrue();
        return root.get("id").asText();
    }

    protected String createBookingRequest(String skillId) throws Exception {
        return createBookingRequest(skillId, scheduledStart, 60);
    }

    protected String createBookingRequest(String skillId, Instant startAt, int bookedMinutes) throws Exception {
        var body = objectMapper.createObjectNode();
        body.put("message", "Integration test booking");
        body.put("bookedMinutes", bookedMinutes);
        body.put("scheduledStartAt", startAt.toString());

        MvcResult r = mockMvc.perform(
                        post("/api/exchange-requests/skill/{skillId}", skillId)
                                .header("Authorization", "Bearer " + requesterToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        assertThat(r.getResponse().getStatus()).isBetween(200, 299);
        JsonNode root = objectMapper.readTree(r.getResponse().getContentAsString());
        return root.get("id").asText();
    }

    protected void accept(String exchangeId) throws Exception {
        mockMvc.perform(
                        put("/api/exchange-requests/{id}/accept", exchangeId)
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON))
                .andReturn();
    }

    protected void markPreSessionPromptSent(UUID exchangeId) {
        ExchangeRequest ex = exchangeRequestRepository.findById(exchangeId).orElseThrow();
        ex.setPreSessionConfirmSent(true);
        exchangeRequestRepository.save(ex);
    }

    protected void setScheduledStart(UUID exchangeId, Instant startAt) {
        ExchangeRequest ex = exchangeRequestRepository.findById(exchangeId).orElseThrow();
        ex.setScheduledStartAt(startAt);
        exchangeRequestRepository.save(ex);
    }

    protected void submitPreSessionConfirm(String exchangeId, String token) throws Exception {
        var body = objectMapper.createObjectNode();
        body.put("decision", "CONFIRM");
        mockMvc.perform(
                        post("/api/exchange-requests/{id}/pre-session-response", exchangeId)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(body)))
                .andReturn();
    }

    protected long requesterCreditMinutes() {
        return userRepository.findByEmailIgnoreCase(requesterEmail).orElseThrow().getTimeCreditMinutes();
    }

    protected long ownerCreditMinutes() {
        return userRepository.findByEmailIgnoreCase(ownerEmail).orElseThrow().getTimeCreditMinutes();
    }

    /** Bakiye entity üzerinden güncellenemez (updatable=false); testte doğrudan ayarla. */
    protected void setRequesterCreditMinutes(long minutes) {
        User u = userRepository.findByEmailIgnoreCase(requesterEmail).orElseThrow();
        long current = userRepository.readBalance(u.getId());
        userRepository.credit(u.getId(), minutes - current);
    }

    protected MvcResult getJson(String path, String token) throws Exception {
        return mockMvc.perform(
                        get(path).header("Authorization", "Bearer " + token))
                .andReturn();
    }
}
