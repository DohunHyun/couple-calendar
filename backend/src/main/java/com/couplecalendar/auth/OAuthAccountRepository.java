package com.couplecalendar.auth;

import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {
    Optional<OAuthAccount> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);
    Optional<OAuthAccount> findByUserAndProvider(User user, AuthProvider provider);
}
