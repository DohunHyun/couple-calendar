package com.couplecalendar.couple;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoupleRepository extends JpaRepository<Couple, Long> {
    Optional<Couple> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
    Optional<Couple> findByOwnerUserIdAndStatus(Long ownerUserId, String status);
}
