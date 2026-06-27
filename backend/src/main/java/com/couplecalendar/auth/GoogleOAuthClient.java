package com.couplecalendar.auth;

import com.couplecalendar.user.AuthProvider;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class GoogleOAuthClient extends AbstractOAuthProviderClient {

    public GoogleOAuthClient(RestClient restClient, OAuthProperties properties) {
        super(restClient, properties.getGoogle());
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public String buildAuthorizeUrl(String redirectUri, String state) {
        requireConfigured("Google");
        return properties.getAuthorizeUri()
                + "?response_type=code&client_id=" + encode(properties.getClientId())
                + "&redirect_uri=" + encode(redirectUri)
                + "&scope=" + encode(properties.getScope())
                + "&access_type=offline&prompt=consent&state=" + encode(state);
    }

    @Override
    public AuthDtos.OAuthTokenBundle exchangeCode(String code, String redirectUri) {
        requireConfigured("Google");
        JsonNode node = requestToken(authorizationCodeForm(code, redirectUri));
        return new AuthDtos.OAuthTokenBundle(
                node.path("access_token").asText(),
                node.path("refresh_token").asText(null),
                node.has("expires_in") ? node.path("expires_in").asLong() : null,
                node.path("scope").asText(null),
                node.path("id_token").asText(null)
        );
    }

    @Override
    public AuthDtos.OAuthTokenBundle refreshAccessToken(String refreshToken) {
        requireConfigured("Google");
        JsonNode node = requestToken(refreshTokenForm(refreshToken));
        return new AuthDtos.OAuthTokenBundle(
                node.path("access_token").asText(),
                refreshToken,
                node.has("expires_in") ? node.path("expires_in").asLong() : null,
                node.path("scope").asText(null),
                node.path("id_token").asText(null)
        );
    }

    @Override
    public AuthDtos.OAuthUserProfile fetchUserProfile(String accessToken) {
        requireConfigured("Google");
        JsonNode node = restClient.get()
                .uri(properties.getUserInfoUri())
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(JsonNode.class);
        return new AuthDtos.OAuthUserProfile(
                node.path("id").asText(),
                node.path("email").asText(""),
                node.path("name").asText("Google User")
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
