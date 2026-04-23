package com.timebank.timebank.user;

import com.timebank.timebank.user.dto.LoginRequest;
import com.timebank.timebank.user.dto.LoginResponse;
import com.timebank.timebank.user.dto.RegisterRequest;
import com.timebank.timebank.user.dto.UpdateUserProfileRequest;
import com.timebank.timebank.user.dto.UserDashboardResponse;
import com.timebank.timebank.user.dto.UserProfileResponse;
import com.timebank.timebank.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        User saved = userService.register(req);

        return ResponseEntity.ok(
                new UserResponse(
                        saved.getId(),
                        saved.getFullName(),
                        saved.getEmail(),
                        saved.getTimeCreditMinutes()
                )
        );
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        LoginResponse response = userService.login(req);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<String> me(Authentication authentication) {
        return ResponseEntity.ok("Hello " + authentication.getName());
    }

    @GetMapping("/users/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(
                userService.getMyProfile(authentication.getName())
        );
    }

    @PutMapping("/users/me/profile")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @Valid @RequestBody UpdateUserProfileRequest req,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userService.updateMyProfile(authentication.getName(), req)
        );
    }

    @GetMapping("/users/me/dashboard")
    public ResponseEntity<UserDashboardResponse> getMyDashboard(Authentication authentication) {
        return ResponseEntity.ok(
                userService.getMyDashboard(authentication.getName())
        );
    }
}