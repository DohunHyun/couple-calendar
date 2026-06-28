package com.couplecalendar.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime end, LocalDateTime start);
    Optional<Event> findByOwner_IdAndSourceTypeAndExternalEventId(Long ownerId, EventSourceType sourceType, String externalEventId);

    // 기기 동기화 삭제 전파: 소유자의 DEVICE 일정 중 조회 범위에 걸치는 것.
    List<Event> findByOwner_IdAndSourceTypeAndStartAtBetween(
            Long ownerId, EventSourceType sourceType, LocalDateTime from, LocalDateTime to);

    // 알림 스케줄러 후보: 알림 설정됨(NONE 아님) + 아직 미발송 + startAt 이 조회 범위 내.
    // 실제 발송 여부는 alertOption.triggerTimeFrom() 으로 서비스에서 판정.
    List<Event> findByAlertOptionNotAndAlertSentFalseAndStartAtBetween(
            AlertOption alertOption, LocalDateTime startFrom, LocalDateTime startTo);
}
