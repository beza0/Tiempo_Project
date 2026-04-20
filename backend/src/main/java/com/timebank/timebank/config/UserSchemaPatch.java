package com.timebank.timebank.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Flyway migrasyonlarından sonra ek güvence (eski volume'larda eksik sütun).
 * flywayInitializer bean adına bağlanma — Spring Boot sürümüne göre değişebilir.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 1)
public class UserSchemaPatch implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSchemaPatch.class);

    private final JdbcTemplate jdbcTemplate;

    public UserSchemaPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
            log.info("users.avatar_url column verified");
        } catch (Exception e) {
            log.warn("Could not patch users.avatar_url: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT USING (avatar_url::text)");
            log.info("users.avatar_url type set to TEXT");
        } catch (Exception e) {
            log.debug("users.avatar_url TEXT alter skipped or already TEXT: {}", e.getMessage());
        }
        executeIgnore(
                jdbcTemplate,
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE",
                "users.email_verified");
        executeIgnore(
                jdbcTemplate,
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128)",
                "users.email_verification_token");
        executeIgnore(
                jdbcTemplate,
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ",
                "users.email_verification_expires_at");
        executeIgnore(
                jdbcTemplate,
                "CREATE INDEX IF NOT EXISTS idx_users_email_verification_token "
                        + "ON users (email_verification_token) "
                        + "WHERE email_verification_token IS NOT NULL",
                "idx_users_email_verification_token");
    }

    private void executeIgnore(JdbcTemplate jdbcTemplate, String sql, String label) {
        try {
            jdbcTemplate.execute(sql);
            log.info("Şema yaması uygulandı: {}", label);
        } catch (Exception e) {
            log.warn("Şema yaması uygulanamadı ({}): {}", label, e.getMessage());
        }
    }
}
