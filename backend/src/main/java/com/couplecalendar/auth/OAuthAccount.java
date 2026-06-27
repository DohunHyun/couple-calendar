package com.couplecalendar.auth;

import com.couplecalendar.common.BaseTimeEntity;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "oauth_accounts")
public class OAuthAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(nullable = false, length = 150)
    private String providerUserId;

    @Column(nullable = false, length = 500)
    private String accessToken;

    @Column(length = 500)
    private String refreshToken;

    private LocalDateTime expiresAt;

    @Column(length = 500)
    private String scope;

    protected OAuthAccount() {
    }

    public OAuthAccount(User user, AuthProvider provider, String providerUserId) {
        this.user = user;
        this.provider = provider;
        this.providerUserId = providerUserId;
    }

    public User getUser() {
        return user;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public String getProviderUserId() {
        return providerUserId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public String getScope() {
        return scope;
    }

    public void updateTokens(String accessToken, String refreshToken, LocalDateTime expiresAt, String scope) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.scope = scope;
    }
}
