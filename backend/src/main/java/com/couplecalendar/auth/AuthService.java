package com.couplecalendar.auth;

import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final OAuthClientRegistry oAuthClientRegistry;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            UserSettingRepository userSettingRepository,
            OAuthAccountRepository oAuthAccountRepository,
            OAuthClientRegistry oAuthClientRegistry,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.userSettingRepository = userSettingRepository;
        this.oAuthAccountRepository = oAuthAccountRepository;
        this.oAuthClientRegistry = oAuthClientRegistry;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthDtos.AuthorizeUrlResponse getAuthorizeUrl(AuthProvider provider, String redirectUri) {
        OAuthProviderClient client = oAuthClientRegistry.get(provider);
        return new AuthDtos.AuthorizeUrlResponse(client.buildAuthorizeUrl(redirectUri, UUID.randomUUID().toString()));
    }

    @Transactional
    public AuthDtos.AuthResponse completeOAuth(AuthProvider provider, AuthDtos.OAuthCallbackRequest request) {
        OAuthProviderClient client = oAuthClientRegistry.get(provider);
        AuthDtos.OAuthTokenBundle tokenBundle = client.exchangeCode(request.code(), request.redirectUri());
        AuthDtos.OAuthUserProfile profile = client.fetchUserProfile(tokenBundle.accessToken());

        if (profile.email() == null || profile.email().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, provider + " profile did not include an email address.");
        }

        User user = userRepository.findByEmail(profile.email())
                .orElseGet(() -> new User(profile.email(), provider, fallbackNickname(profile.nickname(), profile.email())));
        user.updateProfile(fallbackNickname(profile.nickname(), profile.email()));
        user.updateDeviceToken(request.deviceToken());
        User savedUser = userRepository.save(user);

        UserSetting setting = userSettingRepository.findByUser(savedUser)
                .orElseGet(() -> {
                    UserSetting created = new UserSetting(savedUser);
                    savedUser.attachSetting(created);
                    return created;
                });
        userSettingRepository.save(setting);

        OAuthAccount account = oAuthAccountRepository.findByProviderAndProviderUserId(provider, profile.providerUserId())
                .orElseGet(() -> new OAuthAccount(savedUser, provider, profile.providerUserId()));
        account.updateTokens(
                tokenBundle.accessToken(),
                tokenBundle.refreshToken(),
                tokenBundle.expiresInSeconds() == null ? null : LocalDateTime.now().plusSeconds(tokenBundle.expiresInSeconds()),
                tokenBundle.scope()
        );
        oAuthAccountRepository.save(account);

        return toAuthResponse(savedUser, setting);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse me(User user) {
        UserSetting setting = userSettingRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User settings not found"));
        return toAuthResponse(user, setting);
    }

    private AuthDtos.AuthResponse toAuthResponse(User user, UserSetting setting) {
        String onboardingStage;
        if (user.getCouple() == null) {
            onboardingStage = "LINK";
        } else if (!setting.isProfileCompleted()) {
            onboardingStage = "PROFILE";
        } else {
            onboardingStage = "MAIN";
        }
        return new AuthDtos.AuthResponse(
                jwtTokenProvider.createToken(user.getId()),
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getProvider().name(),
                user.getCoupleId(),
                onboardingStage,
                setting.isGoogleVisible(),
                setting.isDdayVisible(),
                setting.isProfileCompleted(),
                user.getCouple() != null ? user.getCouple().getAnniversaryDate() : null
        );
    }

    private String fallbackNickname(String nickname, String email) {
        String base = (nickname != null && !nickname.isBlank()) ? nickname : email.split("@")[0];
        return base.substring(0, Math.min(base.length(), 10));
    }
}
