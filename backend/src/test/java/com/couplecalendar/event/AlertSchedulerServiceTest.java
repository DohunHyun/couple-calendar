package com.couplecalendar.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 알림 스케줄러(G4): 도래한 알림은 발송·멱등 처리, 미래는 건너뛰고, 놓친 알림은 발송 없이 해제.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AlertSchedulerServiceTest {

    @Mock EventRepository eventRepository;
    @Mock UserRepository userRepository;
    @Mock PushNotificationService pushNotificationService;

    @InjectMocks AlertSchedulerService scheduler;

    @Test
    void 도래한알림은발송되고멱등표시된다() {
        Event e = eventWithAlert(AlertOption.AT_TIME, LocalDateTime.now());
        when(eventRepository.findByAlertOptionNotAndAlertSentFalseAndStartAtBetween(any(), any(), any()))
                .thenReturn(List.of(e));

        scheduler.dispatchDueAlerts();

        verify(pushNotificationService).notifyEventAlert(eq(e), anyList());
        assertThat(e.isAlertSent()).isTrue();
    }

    @Test
    void 미래알림은발송되지않는다() {
        Event e = eventWithAlert(AlertOption.AT_TIME, LocalDateTime.now().plusDays(1));
        when(eventRepository.findByAlertOptionNotAndAlertSentFalseAndStartAtBetween(any(), any(), any()))
                .thenReturn(List.of(e));

        scheduler.dispatchDueAlerts();

        verify(pushNotificationService, never()).notifyEventAlert(any(), anyList());
        assertThat(e.isAlertSent()).isFalse();
    }

    @Test
    void 놓친알림은발송없이해제된다() {
        Event e = eventWithAlert(AlertOption.AT_TIME, LocalDateTime.now().minusMinutes(30));
        when(eventRepository.findByAlertOptionNotAndAlertSentFalseAndStartAtBetween(any(), any(), any()))
                .thenReturn(List.of(e));

        scheduler.dispatchDueAlerts();

        verify(pushNotificationService, never()).notifyEventAlert(any(), anyList());
        assertThat(e.isAlertSent()).isTrue();
    }

    private Event eventWithAlert(AlertOption option, LocalDateTime startAt) {
        User owner = new User("owner@example.com", AuthProvider.GOOGLE, "owner");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Category category = new Category("cat", "#FFFFFF", CategoryType.PRIVATE, owner);
        ReflectionTestUtils.setField(category, "id", 1L);
        Event e = new Event("title", "content", false, startAt, startAt.plusHours(1),
                category, owner, EventSourceType.LOCAL, option, null, null);
        ReflectionTestUtils.setField(e, "id", 1L);
        return e;
    }
}
