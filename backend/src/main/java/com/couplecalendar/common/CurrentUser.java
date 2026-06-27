package com.couplecalendar.common;

import com.couplecalendar.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    public User require(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }
}
