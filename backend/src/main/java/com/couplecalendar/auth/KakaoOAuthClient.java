package com.couplecalendar.auth;

import com.couplecalendar.user.AuthProvider;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class KakaoOAuthClient extends AbstractOAuthProviderClient {

    public KakaoOAuthClient(RestClient restClient, OAuthProperties properties) {
        super(restClient, properties.getKakao());
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.KAKAO;
    }

    @Override
    public String buildAuthorizeUrl(String redirectUri, String state) {
        requireConfigured("Kakao");
        return properties.getAuthorizeUri()
                + "?response_type=code&client_id=" + encode(properties.getClientId())
                + "&redirect_uri=" + encode(redirectUri)
                + "&state=" + encode(state);
    }

    @Override
    public AuthDtos.OAuthTokenBundle exchangeCode(String code, String redirectUri) {
        requireConfigured("Kakao");
        JsonNode node = requestToken(authorizationCodeForm(code, redirectUri));
        return new AuthDtos.OAuthTokenBundle(
                node.path("access_token").asText(),
                node.path("refresh_token").asText(null),
                node.has("expires_in") ? node.path("expires_in").asLong() : null,
                node.path("scope").asText(null),
                null
        );
    }

    @Override
    public AuthDtos.OAuthTokenBundle refreshAccessToken(String refreshToken) {
        requireConfigured("Kakao");
        JsonNode node = requestToken(refreshTokenForm(refreshToken));
        return new AuthDtos.OAuthTokenBundle(
                node.path("access_token").asText(),
                node.path("refresh_token").asText(refreshToken),
                node.has("expires_in") ? node.path("expires_in").asLong() : null,
                node.path("scope").asText(null),
                null
        );
    }

    @Override
    public AuthDtos.OAuthUserProfile fetchUserProfile(String accessToken) {
        requireConfigured("Kakao");
        JsonNode node = restClient.get()
                .uri(properties.getUserInfoUri())
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(JsonNode.class);
        JsonNode kakaoAccount = node.path("kakao_account");
        JsonNode profile = kakaoAccount.path("profile");
        return new AuthDtos.OAuthUserProfile(
                node.path("id").asText(),
                kakaoAccount.path("email").asText(""),
                profile.path("nickname").asText("카카오유저")
        );
    }

    private JsonNode requestToken(MultiValueMap<String, String> form) {
        return restClient.post()
                .uri(properties.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(JsonNode.class);
    }
}
