package com.timebank.timebank.common;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Custom domain kökü API sunucusuna işaret ettiğinde tarayıcıda 403 yerine anlamlı yanıt.
 * Asıl arayüz ayrı static host’ta olmalı; burada yalnızca sağlık bilgisi.
 */
@RestController
public class PublicRootController {

    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> root() {
        return Map.of(
                "service", "tiempo-backend",
                "hint", "Web arayüzü ayrı dağıtımdadır; API /api altında."
        );
    }
}
