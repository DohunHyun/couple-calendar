package com.couplecalendar.auth;

import com.couplecalendar.common.ApiException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

abstract class AbstractOAuthProviderClient implements OAuthProviderClient {

    protected final RestClient restClient;
    protected final OAuthProperties.Provider properties;

    protected AbstractOAuthProviderClient(RestClient restClient, OAuthProperties.Provider properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    protected void requireConfigured(String providerName) {
        if (isBlank(properties.getClientId()) || isBlank(properties.getAuthorizeUri())
                || isBlank(properties.getTokenUri()) || isBlank(properties.getUserInfoUri())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    providerName + " OAuth is not configured. Check environment variables.");
        }
    }

    protected String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    protected MultiValueMap<String, String> authorizationCodeForm(String code, String redirectUri) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", properties.getClientId());
        if (!isBlank(properties.getClientSecret())) {
            form.add("client_secret", properties.getClientSecret());
        }
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        return form;
    }

    protected MultiValueMap<String, String> refreshTokenForm(String refreshToken) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", properties.getClientId());
        if (!isBlank(properties.getClientSecret())) {
            form.add("client_secret", properties.getClientSecret());
        }
        form.add("refresh_token", refreshToken);
        return form;
    }

    protected LocalDateTime expiresAt(Long expiresInSeconds) {
        return expiresInSeconds == null ? null : LocalDateTime.now().plusSeconds(expiresInSeconds);
    }

    protected boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
