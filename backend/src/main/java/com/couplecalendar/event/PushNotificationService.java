package com.couplecalendar.event;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.user.User;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 일정 관련 푸시 알림 분기 + 발송 조율.
 * 수신자 결정 규칙(R12): PRIVATE → 작성자 본인, SHARED → 커플 2인.
 * 실제 발송은 {@link PushSender} 구현체에 위임한다(기본 로깅).
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final PushSender pushSender;

    public PushNotificationService(PushSender pushSender) {
        this.pushSender = pushSender;
    }

    /** 일정 생성 시 알림. */
    public void notifyEventCreated(Category category, User owner, List<User> coupleMembers, String eventTitle) {
        dispatch(
                recipientsFor(category.getType(), owner, coupleMembers),
                "새 일정",
                eventTitle + " 일정이 등록되었어요."
        );
    }

    /** 알림 시점 도래 시 알림 (스케줄러에서 호출). */
    public void notifyEventAlert(Event event, List<User> coupleMembers) {
        dispatch(
                recipientsFor(event.getCategory().getType(), event.getOwner(), coupleMembers),
                "일정 알림",
                event.getTitle() + " 일정이 곧 시작돼요."
        );
    }

    private List<User> recipientsFor(CategoryType type, User owner, List<User> coupleMembers) {
        if (type == CategoryType.PRIVATE) {
            return List.of(owner);
        }
        return coupleMembers;
    }

    private void dispatch(List<User> recipients, String title, String body) {
        for (User recipient : recipients) {
            String token = recipient.getDeviceToken();
            if (token == null || token.isBlank()) {
                log.debug("Skip push for user {} - no device token", recipient.getId());
                continue;
            }
            pushSender.send(token, title, body);
        }
    }
}
