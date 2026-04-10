package com.timebank.timebank.skill;

import com.timebank.timebank.skill.dto.CreateSkillRequest;
import com.timebank.timebank.skill.dto.SkillResponse;
import com.timebank.timebank.skill.dto.UpdateSkillRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    /** Sadece gerçek UUID ile eşleşsin; "mine" gibi kelimeler {skillId} sanılmasın. */
    private static final String UUID_SEGMENT =
            "{skillId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}";

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping
    public ResponseEntity<SkillResponse> createSkill(
            @Valid @RequestBody CreateSkillRequest req,
            Authentication authentication
    ) {
        SkillResponse response = skillService.createSkill(req, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    /**
     * {@code /mine} mutlaka {@code /{skillId}} üzerinden önce tanımlanmalı; aksi halde
     * bazı Spring sürümlerinde "mine" path değişkeni sanılıp UUID dönüşümü patlayabilir.
     */
    @GetMapping("/mine")
    public ResponseEntity<List<SkillResponse>> getMySkills(Authentication authentication) {
        return ResponseEntity.ok(skillService.getMySkills(authentication.getName()));
    }

    @GetMapping("/" + UUID_SEGMENT)
    public ResponseEntity<SkillResponse> getSkillById(@PathVariable UUID skillId) {
        return ResponseEntity.ok(skillService.getSkillById(skillId));
    }

    @PutMapping("/" + UUID_SEGMENT)
    public ResponseEntity<SkillResponse> updateSkill(
            @PathVariable UUID skillId,
            @Valid @RequestBody UpdateSkillRequest req,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                skillService.updateSkill(skillId, req, authentication.getName())
        );
    }

    @DeleteMapping("/" + UUID_SEGMENT)
    public ResponseEntity<Void> deleteSkill(
            @PathVariable UUID skillId,
            Authentication authentication
    ) {
        skillService.deleteSkill(skillId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}