package com.couplecalendar.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryRepository;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 기기 캘린더 동기화(spec §8-A): 신규=기본 공유설정, 기존=sticky 유지, 삭제 전파, 카테고리 색 보존.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeviceCalendarSyncServiceTest {

    @Mock EventRepository eventRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock UserSettingRepository userSettingRepository;

    @InjectMocks DeviceCalendarSyncService service;

    private final LocalDateTime now = LocalDateTime.of(2026, 6, 28, 10, 0);

    @Test
    void 신규일정은_기본공유설정으로_생성되고_카테고리색이_보존된다() {
        User user = user(1, false); // deviceSyncDefaultShared=false
        when(categoryRepository.findByUser_IdAndExternalCalendarId(1L, "cal-1")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));
        when(userSettingRepository.findByUser(user)).thenReturn(Optional.of(settingOf(user, false)));
        when(eventRepository.findByOwner_IdAndSourceTypeAndExternalEventId(eq(1L), eq(EventSourceType.DEVICE), eq("evt-1")))
                .thenReturn(Optional.empty());
        when(eventRepository.findByOwner_IdAndSourceTypeAndStartAtBetween(eq(1L), eq(EventSourceType.DEVICE), any(), any()))
                .thenReturn(List.of());

        DeviceSyncDtos.DeviceSyncResponse res = service.sync(user, request(
                List.of(new DeviceSyncDtos.DeviceCalendar("cal-1", "개인", "#FBCFE8")),
                List.of(new DeviceSyncDtos.DeviceEvent("evt-1", "cal-1", "치과", null, false, now, now.plusHours(1), null))));

        ArgumentCaptor<Category> catCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(catCaptor.capture());
        assertThat(catCaptor.getValue().getColorHex()).isEqualTo("#FBCFE8");
        assertThat(catCaptor.getValue().getExternalCalendarId()).isEqualTo("cal-1");

        ArgumentCaptor<Event> evtCaptor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(evtCaptor.capture());
        assertThat(evtCaptor.getValue().getSourceType()).isEqualTo(EventSourceType.DEVICE);
        assertThat(evtCaptor.getValue().isShared()).isFalse();
        assertThat(res.upserted()).isEqualTo(1);
        assertThat(res.hidden()).isZero();
    }

    @Test
    void 기존일정은_공유설정이_유지되고_제목이_갱신된다() {
        User user = user(1, true); // 기본은 SHARED지만 기존 일정엔 적용 안 됨(sticky)
        Category cat = deviceCategory(10, user, "cal-1");
        Event existing = deviceEvent(100, user, cat, "evt-1", true); // 사용자가 SHARED로 둠
        ReflectionTestUtils.setField(existing, "title", "옛제목");

        when(categoryRepository.findByUser_IdAndExternalCalendarId(1L, "cal-1")).thenReturn(Optional.of(cat));
        when(userSettingRepository.findByUser(user)).thenReturn(Optional.of(settingOf(user, true)));
        when(eventRepository.findByOwner_IdAndSourceTypeAndExternalEventId(eq(1L), eq(EventSourceType.DEVICE), eq("evt-1")))
                .thenReturn(Optional.of(existing));
        when(eventRepository.findByOwner_IdAndSourceTypeAndStartAtBetween(any(), any(), any(), any()))
                .thenReturn(List.of(existing));

        service.sync(user, request(
                List.of(new DeviceSyncDtos.DeviceCalendar("cal-1", "개인", "#FBCFE8")),
                List.of(new DeviceSyncDtos.DeviceEvent("evt-1", "cal-1", "새제목", null, false, now, now.plusHours(1), null))));

        assertThat(existing.getTitle()).isEqualTo("새제목");
        assertThat(existing.isShared()).isTrue();           // sticky 유지
        verify(eventRepository, never()).save(any());        // 기존은 dirty checking, save 호출 안 함
    }

    @Test
    void 기기에서_사라진_일정은_숨김처리된다() {
        User user = user(1, false);
        Category cat = deviceCategory(10, user, "cal-1");
        Event stale = deviceEvent(100, user, cat, "evt-old", false); // 이번 업로드에 없음

        when(userSettingRepository.findByUser(user)).thenReturn(Optional.of(settingOf(user, false)));
        when(eventRepository.findByOwner_IdAndSourceTypeAndStartAtBetween(any(), any(), any(), any()))
                .thenReturn(List.of(stale));

        DeviceSyncDtos.DeviceSyncResponse res = service.sync(user, request(
                List.of(new DeviceSyncDtos.DeviceCalendar("cal-1", "개인", "#FBCFE8")),
                List.of())); // 빈 이벤트 목록

        assertThat(stale.isHidden()).isTrue();
        assertThat(res.hidden()).isEqualTo(1);
    }

    // --- helpers ---

    private DeviceSyncDtos.DeviceSyncRequest request(List<DeviceSyncDtos.DeviceCalendar> calendars,
                                                     List<DeviceSyncDtos.DeviceEvent> events) {
        return new DeviceSyncDtos.DeviceSyncRequest(calendars, events, now.minusDays(7), now.plusDays(7));
    }

    private User user(long id, boolean defaultShared) {
        User u = new User("u" + id + "@example.com", AuthProvider.GOOGLE, "user" + id);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private UserSetting settingOf(User user, boolean defaultShared) {
        UserSetting s = new UserSetting(user);
        s.setDeviceSyncDefaultShared(defaultShared);
        return s;
    }

    private Category deviceCategory(long id, User user, String externalCalendarId) {
        Category c = new Category("개인", "#FBCFE8", CategoryType.PRIVATE, user, externalCalendarId);
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private Event deviceEvent(long id, User owner, Category category, String externalEventId, boolean shared) {
        Event e = new Event("title", null, false, now, now.plusHours(1), category, owner,
                EventSourceType.DEVICE, AlertOption.NONE, externalEventId, "cal-1");
        ReflectionTestUtils.setField(e, "id", id);
        e.setShared(shared);
        return e;
    }
}
