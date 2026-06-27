package com.couplecalendar.auth;

import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.AuthProvider;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class OAuthClientRegistry {

    private final Map<AuthProvider, OAuthProviderClient> clients = new EnumMap<>(AuthProvider.class);

    public OAuthClientRegistry(List<OAuthProviderClient> providerClients) {
        providerClients.forEach(client -> clients.put(client.provider(), client));
    }

    public OAuthProviderClient get(AuthProvider provider) {
        OAuthProviderClient client = clients.get(provider);
        if (client == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported provider: " + provider);
        }
        return client;
    }
}
