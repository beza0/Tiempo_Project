package com.timebank.timebank.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@DependsOn("entityManagerFactory")
@Order(Ordered.LOWEST_PRECEDENCE)
public class SkillSchemaPatch implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SkillSchemaPatch.class);

    private final JdbcTemplate jdbcTemplate;

    public SkillSchemaPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        patch("ALTER TABLE skills ADD COLUMN IF NOT EXISTS session_types VARCHAR(120)", "session_types");
        patch("ALTER TABLE skills ADD COLUMN IF NOT EXISTS in_person_location VARCHAR(120)", "in_person_location");
        patch("ALTER TABLE skills ADD COLUMN IF NOT EXISTS available_days VARCHAR(200)", "available_days");
        patch("ALTER TABLE skills ADD COLUMN IF NOT EXISTS available_from VARCHAR(5)", "available_from");
        patch("ALTER TABLE skills ADD COLUMN IF NOT EXISTS available_until VARCHAR(5)", "available_until");
    }

    private void patch(String sql, String label) {
        try {
            jdbcTemplate.execute(sql);
            log.info("skills.{} verified", label);
        } catch (Exception e) {
            log.warn("Could not patch skills.{}: {}", label, e.getMessage());
        }
    }
}
