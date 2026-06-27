package com.couplecalendar.event;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.user.User;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    public void notifyEventCreated(Category category, User owner, List<User> coupleMembers, String eventTitle) {
        if (category.getType() == CategoryType.PRIVATE) {
            log.info("Push PRIVATE event '{}' to owner token {}", eventTitle, owner.getDeviceToken());
            return;
        }
        coupleMembers.forEach(member ->
                log.info("Push SHARED event '{}' to member {} token {}", eventTitle, member.getId(), member.getDeviceToken()));
    }
}
