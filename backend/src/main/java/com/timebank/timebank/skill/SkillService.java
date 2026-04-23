package com.timebank.timebank.skill;

import com.timebank.timebank.skill.dto.CreateSkillRequest;
import com.timebank.timebank.skill.dto.SkillResponse;
import com.timebank.timebank.skill.dto.UpdateSkillRequest;
import com.timebank.timebank.user.User;
import com.timebank.timebank.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    public SkillService(SkillRepository skillRepository, UserRepository userRepository) {
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
    }

    public SkillResponse createSkill(CreateSkillRequest req, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        Skill skill = new Skill();
        skill.setTitle(req.getTitle().trim());
        skill.setDescription(req.getDescription().trim());
        skill.setDurationMinutes(req.getDurationMinutes());
        skill.setCategory(blankToNull(req.getCategory()));
        String level = blankToNull(req.getLevel());
        skill.setLevel(level != null ? level : "intermediate");
        skill.setOwner(owner);

        Skill saved = skillRepository.save(skill);

        return mapToResponse(saved);
    }

    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SkillResponse getSkillById(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı"));

        return mapToResponse(skill);
    }

    public List<SkillResponse> getMySkills(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadCredentialsException("Kullanıcı bulunamadı"));

        return skillRepository.findByOwnerId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SkillResponse updateSkill(UUID skillId, UpdateSkillRequest req, String userEmail) {
        Skill skill = skillRepository.findByIdAndOwnerEmail(skillId, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı veya bu skill size ait değil"));

        skill.setTitle(req.getTitle().trim());
        skill.setDescription(req.getDescription().trim());
        skill.setDurationMinutes(req.getDurationMinutes());
        if (req.getCategory() != null) {
            skill.setCategory(blankToNull(req.getCategory()));
        }
        String level = blankToNull(req.getLevel());
        if (level != null) {
            skill.setLevel(level);
        }

        Skill updated = skillRepository.save(skill);
        return mapToResponse(updated);
    }

    public void deleteSkill(UUID skillId, String userEmail) {
        Skill skill = skillRepository.findByIdAndOwnerEmail(skillId, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Skill bulunamadı veya bu skill size ait değil"));

        skillRepository.delete(skill);
    }

    private SkillResponse mapToResponse(Skill skill) {
        return new SkillResponse(
                skill.getId(),
                skill.getTitle(),
                skill.getDescription(),
                skill.getDurationMinutes(),
                skill.getCategory(),
                skill.getLevel(),
                skill.getOwner().getId(),
                skill.getOwner().getFullName(),
                skill.getCreatedAt()
        );
    }

    private static String blankToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}