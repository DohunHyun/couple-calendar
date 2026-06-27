package com.couplecalendar.couple;

import com.couplecalendar.common.CurrentUser;
import com.couplecalendar.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/couples")
public class CoupleController {

    private final CurrentUser currentUser;
    private final CoupleService coupleService;
    private final CoupleLinkSseService sseService;

    public CoupleController(CurrentUser currentUser, CoupleService coupleService, CoupleLinkSseService sseService) {
        this.currentUser = currentUser;
        this.coupleService = coupleService;
        this.sseService = sseService;
    }

    @PostMapping("/invite-code")
    public CoupleDtos.InviteCodeResponse createInviteCode(Authentication authentication) {
        User user = currentUser.require(authentication);
        return coupleService.createInviteCode(user);
    }

    @PostMapping("/join")
    public CoupleDtos.CoupleProfileResponse join(Authentication authentication, @Valid @RequestBody CoupleDtos.JoinRequest request) {
        User user = currentUser.require(authentication);
        return coupleService.joinByCode(user, request.inviteCode());
    }

    @PatchMapping("/profile")
    public CoupleDtos.CoupleProfileResponse updateProfile(
            Authentication authentication,
            @RequestBody CoupleDtos.CoupleProfileRequest request
    ) {
        User user = currentUser.require(authentication);
        return coupleService.updateProfile(user, request.nickname(), request.anniversaryDate());
    }

    @GetMapping("/stream")
    public SseEmitter stream(Authentication authentication) {
        User user = currentUser.require(authentication);
        return sseService.connect(user.getId());
    }
}
