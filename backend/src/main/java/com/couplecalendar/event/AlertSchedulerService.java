package com.couplecalendar.event;

import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 매 분 실행되어, 알림 시점이 도래한 일정에 대해 푸시를 발송한다.
 * - 각 일정은 한 번만 발송(alertSent 플래그로 멱등 보장).
 * - 발송 누락(앱 다운 등)으로 한참 지난 알림은 발송하지 않고 조용히 해제(disarm)한다.
 */
@Service
public class AlertSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(AlertSchedulerService.class);

    // 알림 시점이 이 시간보다 더 과거면 '놓친 알림'으로 보고 발송하지 않는다.
    private static final long MISS_THRESHOLD_MINUTES = 5;

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    public AlertSchedulerService(
            EventRepository eventRepository,
            UserRepository userRepository,
            PushNotificationService pushNotificationService
    ) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void dispatchDueAlerts() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime missBefore = now.minusMinutes(MISS_THRESHOLD_MINUTES);

        // 후보 범위: AT_TIME(막 지난 것)부터 ONE_DAY_BEFORE(하루 뒤 시작) 까지 커버.
        List<Event> candidates = eventRepository.findByAlertOptionNotAndAlertSentFalseAndStartAtBetween(
                AlertOption.NONE, now.minusDays(1), now.plusDays(2));

        for (Event event : candidates) {
            LocalDateTime triggerAt = event.getAlertOption().triggerTimeFrom(event.getStartAt());
            if (triggerAt == null || triggerAt.isAfter(now)) {
                continue; // 아직 시점 도래 전
            }
            if (triggerAt.isBefore(missBefore)) {
                event.markAlertSent(); // 놓친 알림은 발송 없이 해제
                continue;
            }
            pushNotificationService.notifyEventAlert(event, coupleMembers(event.getOwner()));
            event.markAlertSent();
            log.info("Dispatched alert for event {} (trigger {})", event.getId(), triggerAt);
        }
    }

    private List<User> coupleMembers(User owner) {
        if (owner.getCouple() == null) {
            return List.of(owner);
        }
        Long coupleId = owner.getCouple().getId();
        return userRepository.findAll().stream()
                .filter(user -> user.getCouple() != null && coupleId.equals(user.getCouple().getId()))
                .toList();
    }
}
