package com.couplecalendar.auth;

import com.couplecalendar.common.CurrentUser;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;

    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @GetMapping("/oauth/{provider}/authorize-url")
    public AuthDtos.AuthorizeUrlResponse authorizeUrl(
            @PathVariable AuthProvider provider,
            @RequestParam String redirectUri
    ) {
        return authService.getAuthorizeUrl(provider, redirectUri);
    }

    @PostMapping("/oauth/{provider}/callback")
    public AuthDtos.AuthResponse oauthCallback(
            @PathVariable AuthProvider provider,
            @Valid @RequestBody AuthDtos.OAuthCallbackRequest request
    ) {
        return authService.completeOAuth(provider, request);
    }

    @GetMapping("/me")
    public AuthDtos.AuthResponse me(Authentication authentication) {
        User user = currentUser.require(authentication);
        return authService.me(user);
    }

    @PutMapping("/device-token")
    public void updateDeviceToken(Authentication authentication, @Valid @RequestBody AuthDtos.DeviceTokenRequest request) {
        User user = currentUser.require(authentication);
        authService.updateDeviceToken(user, request.deviceToken());
    }
}
