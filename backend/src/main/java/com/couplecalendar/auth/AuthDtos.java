package com.couplecalendar.auth;

import com.couplecalendar.user.AuthProvider;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class AuthDtos {

    public record AuthorizeUrlResponse(String authorizeUrl) {}

    public record OAuthCallbackRequest(
            @NotBlank String code,
            @NotBlank String redirectUri,
            String deviceToken
    ) {}

    public record AuthResponse(
            String accessToken,
            Long userId,
            String email,
            String nickname,
            String provider,
            Long coupleId,
            String onboardingStage,
            boolean googleVisible,
            boolean ddayVisible,
            boolean profileCompleted,
            LocalDate anniversaryDate
    ) {}

    public record OAuthTokenBundle(
            String accessToken,
            String refreshToken,
            Long expiresInSeconds,
            String scope,
            String idToken
    ) {}

    public record OAuthUserProfile(
            String providerUserId,
            String email,
            String nickname
    ) {}

    public record OAuthAuthorizeCommand(AuthProvider provider, String redirectUri, String state) {}
}
