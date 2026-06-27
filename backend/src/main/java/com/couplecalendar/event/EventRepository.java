package com.couplecalendar.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime end, LocalDateTime start);
    Optional<Event> findByOwner_IdAndSourceTypeAndExternalEventId(Long ownerId, EventSourceType sourceType, String externalEventId);
}
