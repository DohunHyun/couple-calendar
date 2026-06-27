package com.couplecalendar.couple;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public class CoupleDtos {

    public record InviteCodeResponse(
            String inviteCode,
            String status,
            Long coupleId
    ) {}

    public record JoinRequest(@NotBlank @Pattern(regexp = "^[A-Z0-9]{8}$") String inviteCode) {}

    public record CoupleProfileRequest(String nickname, LocalDate anniversaryDate) {}

    public record CoupleProfileResponse(
            Long userId,
            String nickname,
            Long coupleId,
            String inviteCode,
            LocalDate anniversaryDate,
            String status
    ) {}
}
