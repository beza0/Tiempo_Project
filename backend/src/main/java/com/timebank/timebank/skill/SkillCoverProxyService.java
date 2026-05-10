package com.timebank.timebank.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.UUID;

/**
 * Pollinations’a tarayıcıdan direkt gitmek 429 / hotlink sorunlarına yol açabiliyor.
 * Görsel sunucu tarafında çekilip aynı origin üzerinden servis edilir.
 */
@Service
public class SkillCoverProxyService {

    private static final Logger log = LoggerFactory.getLogger(SkillCoverProxyService.class);

    private final SkillRepository skillRepository;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public SkillCoverProxyService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public ResponseEntity<byte[]> fetchCover(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı"));

        LinkedHashSet<String> urls = new LinkedHashSet<>();
        String stored = skill.getCoverImageUrl();
        if (stored != null && !stored.isBlank()) {
            urls.add(sanitizePollinationsUrl(stored.trim()));
        }
        urls.add(SkillCoverImageUrlBuilder.fromSkillContent(
                skill.getTitle(),
                skill.getDescription(),
                skill.getCategory(),
                skill.getId()
        ));
        urls.add(SkillCoverImageUrlBuilder.minimalCoverUrl(skill.getTitle(), skill.getId()));

        for (String url : urls) {
            try {
                HttpResponse<byte[]> res = httpGet(url);
                if (res.statusCode() != 200 || res.body() == null || res.body().length < 64) {
                    continue;
                }
                String ct = res.headers().firstValue(HttpHeaders.CONTENT_TYPE).orElse(MediaType.IMAGE_JPEG_VALUE);
                if (!ct.startsWith("image/")) {
                    continue;
                }
                return ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                        .contentType(MediaType.parseMediaType(ct))
                        .body(res.body());
            } catch (Exception e) {
                log.debug("cover fetch failed for {}: {}", url, e.getMessage());
            }
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    private HttpResponse<byte[]> httpGet(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(120))
                .header(HttpHeaders.USER_AGENT, "Tiempo/1.0 (skill-cover-proxy)")
                .GET()
                .build();
        return httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
    }

    private static String sanitizePollinationsUrl(String url) {
        if (!url.contains("pollinations.ai")) {
            return url;
        }
        try {
            URI raw = URI.create(url);
            String q = raw.getQuery();
            if (q == null || q.isBlank()) {
                return url;
            }
            StringBuilder out = new StringBuilder();
            boolean first = true;
            for (String pair : q.split("&")) {
                if (pair.startsWith("nologo=")) {
                    continue;
                }
                if (!first) {
                    out.append("&");
                }
                first = false;
                out.append(pair);
            }
            String newQuery = out.toString();
            if (newQuery.isEmpty()) {
                return new URI(
                        raw.getScheme(),
                        raw.getAuthority(),
                        raw.getPath(),
                        null,
                        raw.getFragment()
                ).toString();
            }
            return new URI(
                    raw.getScheme(),
                    raw.getAuthority(),
                    raw.getPath(),
                    newQuery,
                    raw.getFragment()
            ).toString();
        } catch (Exception e) {
            return url;
        }
    }
}
