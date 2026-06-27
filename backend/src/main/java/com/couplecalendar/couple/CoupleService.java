package com.couplecalendar.couple;

import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoupleService {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final CoupleLinkSseService sseService;

    public CoupleService(CoupleRepository coupleRepository, UserRepository userRepository, CoupleLinkSseService sseService) {
        this.coupleRepository = coupleRepository;
        this.userRepository = userRepository;
        this.sseService = sseService;
    }

    @Transactional
    public CoupleDtos.InviteCodeResponse createInviteCode(User user) {
        if (user.getCouple() != null) {
            return new CoupleDtos.InviteCodeResponse(user.getCouple().getInviteCode(), "LINKED", user.getCouple().getId());
        }
        Couple couple = coupleRepository.findByOwnerUserIdAndStatus(user.getId(), "PENDING")
                .orElseGet(() -> coupleRepository.save(new Couple(generateCode(), user.getId())));
        return new CoupleDtos.InviteCodeResponse(couple.getInviteCode(), couple.getStatus(), couple.getId());
    }

    @Transactional
    public CoupleDtos.CoupleProfileResponse joinByCode(User user, String inviteCode) {
        Couple couple = coupleRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite code not found"));
        if (!"PENDING".equals(couple.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "This invite code has already been linked.");
        }
        if (couple.getOwnerUserId().equals(user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot join with your own invite code.");
        }
        User owner = userRepository.findById(couple.getOwnerUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite owner not found"));
        if (owner.getCouple() != null || user.getCouple() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "One of the users is already linked to a couple.");
        }
        owner.joinCouple(couple);
        user.joinCouple(couple);
        couple.markLinked();
        userRepository.save(owner);
        userRepository.save(user);

        userRepository.findAll().stream()
                .filter(candidate -> candidate.getCouple() != null && candidate.getCouple().getId().equals(couple.getId()))
                .forEach(candidate -> sseService.sendLinked(candidate.getId(), couple.getId()));

        return new CoupleDtos.CoupleProfileResponse(
                user.getId(),
                user.getNickname(),
                couple.getId(),
                couple.getInviteCode(),
                couple.getAnniversaryDate(),
                couple.getStatus()
        );
    }

    @Transactional
    public CoupleDtos.CoupleProfileResponse updateProfile(User user, String nickname, LocalDate anniversaryDate) {
        if (nickname != null && !nickname.isBlank()) {
            user.updateProfile(nickname.substring(0, Math.min(10, nickname.length())));
        }
        Couple couple = user.getCouple();
        if (couple != null && anniversaryDate != null) {
            couple.updateAnniversaryDate(anniversaryDate);
        }
        userRepository.save(user);
        if (couple != null) {
            coupleRepository.save(couple);
        }
        return new CoupleDtos.CoupleProfileResponse(
                user.getId(),
                user.getNickname(),
                couple != null ? couple.getId() : null,
                couple != null ? couple.getInviteCode() : null,
                couple != null ? couple.getAnniversaryDate() : null,
                couple != null ? couple.getStatus() : "PENDING"
        );
    }

    private String generateCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder(8);
            for (int index = 0; index < 8; index++) {
                builder.append(CHARS.charAt(random.nextInt(CHARS.length())));
            }
            code = builder.toString();
        } while (coupleRepository.existsByInviteCode(code));
        return code;
    }
}
