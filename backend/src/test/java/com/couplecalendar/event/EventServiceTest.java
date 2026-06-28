package com.couplecalendar.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryRepository;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.common.ApiException;
import com.couplecalendar.couple.Couple;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 핵심 도메인 규칙(가시성 R4 / 수정·삭제 권한 R5 / 삭제 분기 R6·R7 / 카테고리 접근) 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceTest {

    @Mock EventRepository eventRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock UserRepository userRepository;
    @Mock UserSettingRepository userSettingRepository;
    @Mock PushNotificationService pushNotificationService;
    @Mock GoogleCalendarSyncService googleCalendarSyncService;

    @InjectMocks EventService eventService;

    @Test
    void list_커플일정은보이고_타인일정과숨김일정은제외된다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        User partner = user(2, couple);
        User stranger = user(3, null);

        Category shared = category(10, CategoryType.SHARED, owner);
        Event visible = event(100, owner, shared, EventSourceType.LOCAL);
        Event strangerEvent = event(101, stranger, category(11, CategoryType.PRIVATE, stranger), EventSourceType.LOCAL);
        Event hiddenEvent = event(102, owner, shared, EventSourceType.LOCAL);
        hiddenEvent.hide();

        when(userSettingRepository.findByUser(partner)).thenReturn(Optional.of(new UserSetting(partner)));
        when(eventRepository.findByStartAtLessThanEqualAndEndAtGreaterThanEqual(any(), any()))
                .thenReturn(List.of(visible, strangerEvent, hiddenEvent));

        EventDtos.CalendarResponse res = eventService.list(partner, LocalDate.now(), LocalDate.now(), false);

        assertThat(res.events()).extracting(EventDtos.EventResponse::id).containsExactly(100L);
    }

    @Test
    void list_상대의_DEVICE일정은_SHARED만_보인다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        User partner = user(2, couple);
        Category cat = category(10, CategoryType.PRIVATE, owner);
        Event devicePrivate = deviceEvent(200, owner, cat, false);
        Event deviceShared = deviceEvent(201, owner, cat, true);

        when(userSettingRepository.findByUser(partner)).thenReturn(Optional.of(new UserSetting(partner)));
        when(eventRepository.findByStartAtLessThanEqualAndEndAtGreaterThanEqual(any(), any()))
                .thenReturn(List.of(devicePrivate, deviceShared));

        EventDtos.CalendarResponse res = eventService.list(partner, LocalDate.now(), LocalDate.now(), false);

        assertThat(res.events()).extracting(EventDtos.EventResponse::id).containsExactly(201L);
    }

    @Test
    void list_본인의_DEVICE_PRIVATE일정은_본인에게_보인다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        Category cat = category(10, CategoryType.PRIVATE, owner);
        Event devicePrivate = deviceEvent(200, owner, cat, false);

        when(userSettingRepository.findByUser(owner)).thenReturn(Optional.of(new UserSetting(owner)));
        when(eventRepository.findByStartAtLessThanEqualAndEndAtGreaterThanEqual(any(), any()))
                .thenReturn(List.of(devicePrivate));

        EventDtos.CalendarResponse res = eventService.list(owner, LocalDate.now(), LocalDate.now(), false);

        assertThat(res.events()).extracting(EventDtos.EventResponse::id).containsExactly(200L);
    }

    @Test
    void delete_구글일정은삭제대신숨김처리된다() {
        User u = user(1, null);
        Event google = event(100, u, category(10, CategoryType.PRIVATE, u), EventSourceType.GOOGLE);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(google));

        EventDtos.DeleteDecisionResponse res = eventService.delete(u, 100L, false);

        assertThat(res.deleted()).isTrue();
        assertThat(res.confirmRequired()).isFalse();
        assertThat(google.isHidden()).isTrue();
        verify(eventRepository, never()).delete(any());
    }

    @Test
    void delete_상대의공유일정은확인을요구한다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        User partner = user(2, couple);
        Event e = event(100, owner, category(10, CategoryType.SHARED, owner), EventSourceType.LOCAL);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(e));

        EventDtos.DeleteDecisionResponse res = eventService.delete(partner, 100L, false);

        assertThat(res.confirmRequired()).isTrue();
        assertThat(res.deleted()).isFalse();
        assertThat(res.message()).contains("user1");
        verify(eventRepository, never()).delete(any());
    }

    @Test
    void delete_상대의공유일정도확인시삭제된다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        User partner = user(2, couple);
        Event e = event(100, owner, category(10, CategoryType.SHARED, owner), EventSourceType.LOCAL);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(e));

        EventDtos.DeleteDecisionResponse res = eventService.delete(partner, 100L, true);

        assertThat(res.deleted()).isTrue();
        verify(eventRepository).delete(e);
    }

    @Test
    void update_상대의개인일정은수정할수없다() {
        Couple couple = couple(1);
        User owner = user(1, couple);
        User partner = user(2, couple);
        Event e = event(100, owner, category(10, CategoryType.PRIVATE, owner), EventSourceType.LOCAL);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(e));

        EventDtos.EventRequest req = request(10L);

        assertThatThrownBy(() -> eventService.update(partner, 100L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void create_타인의개인카테고리로는일정을만들수없다() {
        User stranger = user(3, null);
        User me = user(1, null);
        when(categoryRepository.findById(10L)).thenReturn(Optional.of(category(10, CategoryType.PRIVATE, stranger)));

        assertThatThrownBy(() -> eventService.create(me, request(10L)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    // --- helpers ---

    private Couple couple(long id) {
        Couple c = new Couple("CODE000" + id, 999L);
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private User user(long id, Couple couple) {
        User u = new User("u" + id + "@example.com", AuthProvider.GOOGLE, "user" + id);
        ReflectionTestUtils.setField(u, "id", id);
        if (couple != null) {
            u.joinCouple(couple);
        }
        return u;
    }

    private Category category(long id, CategoryType type, User owner) {
        Category c = new Category("cat" + id, "#FFFFFF", type, owner);
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private Event event(long id, User owner, Category category, EventSourceType source) {
        LocalDateTime now = LocalDateTime.now();
        Event e = new Event("title", "content", true, now, now, category, owner, source, AlertOption.NONE, null, null);
        ReflectionTestUtils.setField(e, "id", id);
        return e;
    }

    private Event deviceEvent(long id, User owner, Category category, boolean shared) {
        Event e = event(id, owner, category, EventSourceType.DEVICE);
        e.setShared(shared);
        return e;
    }

    private EventDtos.EventRequest request(long categoryId) {
        return new EventDtos.EventRequest(
                "title", "content", true, LocalDate.now(), null, LocalDate.now(), null, categoryId, AlertOption.NONE);
    }
}
