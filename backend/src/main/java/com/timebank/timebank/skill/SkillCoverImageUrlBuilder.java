package com.timebank.timebank.skill;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Ücretsiz Pollinations görsel API’si — tarayıcı bu URL’den PNG/JPEG çeker.
 * Anahtar gerekmez; prompt path + sorgu parametreleri ile çalışır.
 *
 * @see <a href="https://pollinations.ai/">pollinations.ai</a>
 */
public final class SkillCoverImageUrlBuilder {

    private static final String BASE = "https://image.pollinations.ai/prompt/";
    /** Uzun prompt + Türkçe karakter URL encode ile limit aşılabiliyor; kısa tut. */
    private static final int MAX_PROMPT_CHARS = 220;
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private SkillCoverImageUrlBuilder() {
    }

    /**
     * Başlık ve açıklamaya göre kapak görseli URL’si (AI üretimi Pollinations üzerinden).
     *
     * @param stableId önbellek için (owner + başlık yeterli; kayıt öncesi skill id yok)
     */
    public static String fromSkillContent(String title, String description, String category, UUID stableId) {
        String t = title == null ? "" : title.trim();
        String snippet = shorten(descriptionMain(description), 90);
        String cat = category == null ? "" : category.trim();
        String prompt = String.format(
                "Educational skill cover art. Topic: %s. Context: %s. Area: %s. "
                        + "Abstract flat illustration, colorful, modern, no text.",
                shorten(t, 72),
                snippet.isEmpty() ? "learning and teaching" : snippet,
                cat.isEmpty() ? "skills" : shorten(cat, 48)
        );
        prompt = shorten(WHITESPACE.matcher(prompt.trim()).replaceAll(" "), MAX_PROMPT_CHARS);
        String encoded = URLEncoder.encode(prompt, StandardCharsets.UTF_8).replace("+", "%20");
        long seed = stableId != null
                ? Math.floorMod(stableId.getMostSignificantBits() ^ stableId.getLeastSignificantBits(), 1_000_000_000L)
                : Math.floorMod(Objects.hash(title, category), 1_000_000_000);
        // nologo hesap gerektirir; seed CDN önbelleğini tetikler (429 azalır).
        return BASE + encoded + "?width=800&height=480&model=turbo&seed=" + seed;
    }

    /** Birincil URL başarısız olduğunda (429 vb.) daha kısa ikinci istek. */
    public static String minimalCoverUrl(String title, UUID skillId) {
        String t = title == null || title.isBlank() ? "skill" : title.trim();
        String prompt = shorten(
                "Colorful flat illustration, " + t + ", educational cover, no text",
                140
        );
        prompt = shorten(WHITESPACE.matcher(prompt.trim()).replaceAll(" "), 160);
        String encoded = URLEncoder.encode(prompt, StandardCharsets.UTF_8).replace("+", "%20");
        long seed = skillId != null
                ? Math.floorMod(skillId.getMostSignificantBits() ^ skillId.getLeastSignificantBits(), 1_000_000_000L)
                : 0;
        return BASE + encoded + "?width=640&height=400&model=turbo&seed=" + seed;
    }

    /** Form meta bloğundan önceki kullanıcı metni (frontend ile uyumlu). */
    static String descriptionMain(String desc) {
        if (desc == null || desc.isBlank()) {
            return "";
        }
        String sep = "\n\n———\n";
        int i = desc.indexOf(sep);
        return (i >= 0 ? desc.substring(0, i) : desc).trim();
    }

    private static String shorten(String s, int max) {
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, Math.max(1, max - 1)).trim() + "…";
    }
}
