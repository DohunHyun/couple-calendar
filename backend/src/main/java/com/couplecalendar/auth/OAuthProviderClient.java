package com.couplecalendar.auth;

import com.couplecalendar.user.AuthProvider;

public interface OAuthProviderClient {
    AuthProvider provider();
    String buildAuthorizeUrl(String redirectUri, String state);
    AuthDtos.OAuthTokenBundle exchangeCode(String code, String redirectUri);
    AuthDtos.OAuthTokenBundle refreshAccessToken(String refreshToken);
    AuthDtos.OAuthUserProfile fetchUserProfile(String accessToken);
}
