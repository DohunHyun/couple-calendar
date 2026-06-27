package com.couplecalendar.event;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryRepository;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import com.couplecalendar.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;
    private final PushNotificationService pushNotificationService;
    private final GoogleCalendarSyncService googleCalendarSyncService;

    public EventService(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            UserSettingRepository userSettingRepository,
            PushNotificationService pushNotificationService,
            GoogleCalendarSyncService googleCalendarSyncService
    ) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.userSettingRepository = userSettingRepository;
        this.pushNotificationService = pushNotificationService;
        this.googleCalendarSyncService = googleCalendarSyncService;
    }

    @Transactional(readOnly = true)
    public EventDtos.CalendarResponse list(User user, LocalDate monthStart, LocalDate monthEnd, boolean syncGoogle) {
        if (syncGoogle) {
            googleCalendarSyncService.syncMonth(user, monthStart, monthEnd);
        }
        LocalDateTime start = monthStart.atStartOfDay();
        LocalDateTime end = monthEnd.atTime(LocalTime.MAX);
        UserSetting setting = userSettingRepository.findByUser(user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User settings not found"));
        List<EventDtos.EventResponse> events = eventRepository.findByStartAtLessThanEqualAndEndAtGreaterThanEqual(end, start).stream()
                .filter(event -> isVisibleToUser(event, user))
                .filter(event -> !event.isHidden())
                .sorted(Comparator.comparing(Event::getStartAt))
                .map(this::toResponse)
                .toList();
        Set<String> holidayDates = events.stream()
                .filter(event -> event.sourceType() == EventSourceType.GOOGLE_HOLIDAY)
                .map(event -> event.startAt().toLocalDate().toString())
                .collect(java.util.stream.Collectors.toSet());
        return new EventDtos.CalendarResponse(events, setting.isGoogleVisible(), holidayDates);
    }

    @Transactional
    public EventDtos.EventResponse create(User user, EventDtos.EventRequest request) {
        Category category = loadAccessibleCategory(user, request.categoryId());
        Event event = new Event(
                request.title(),
                request.content(),
                request.allDay(),
                toDateTime(request.startDate(), request.startTime(), request.allDay()),
                toDateTime(request.endDate(), request.endTime(), request.allDay()),
                category,
                user,
                EventSourceType.LOCAL,
                request.alertOption(),
                null,
                null
        );
        Event saved = eventRepository.save(event);
        List<User> coupleMembers = userRepository.findAll().stream()
                .filter(candidate -> user.getCouple() != null && candidate.getCouple() != null
                        && candidate.getCouple().getId().equals(user.getCouple().getId()))
                .toList();
        pushNotificationService.notifyEventCreated(category, user, coupleMembers, saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public EventDtos.EventResponse update(User user, Long eventId, EventDtos.EventRequest request) {
        Event event = loadVisibleEvent(user, eventId);
        if (!canMutateEvent(user, event)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owner can edit this event");
        }
        Category category = loadAccessibleCategory(user, request.categoryId());
        event.update(
                request.title(),
                request.content(),
                request.allDay(),
                toDateTime(request.startDate(), request.startTime(), request.allDay()),
                toDateTime(request.endDate(), request.endTime(), request.allDay()),
                category,
                event.isHidden(),
                request.alertOption()
        );
        return toResponse(event);
    }

    @Transactional
    public EventDtos.DeleteDecisionResponse delete(User user, Long eventId, boolean confirmed) {
        Event event = loadVisibleEvent(user, eventId);
        if (event.getSourceType() == EventSourceType.GOOGLE || event.getSourceType() == EventSourceType.GOOGLE_HOLIDAY) {
            event.hide();
            return new EventDtos.DeleteDecisionResponse(false, "Google event masked locally", true);
        }

        if (!canMutateEvent(user, event)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Event access denied");
        }

        if (!event.getOwner().getId().equals(user.getId()) && event.getCategory().getType() == CategoryType.SHARED) {
            if (!confirmed) {
                return new EventDtos.DeleteDecisionResponse(
                        true,
                        event.getOwner().getNickname() + "님이 등록한 공유 일정입니다. 함께 삭제하시겠습니까?",
                        false
                );
            }
        }
        eventRepository.delete(event);
        return new EventDtos.DeleteDecisionResponse(false, "Deleted", true);
    }

    private Category loadAccessibleCategory(User user, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));
        boolean owned = category.getUser().getId().equals(user.getId());
        boolean sameCoupleShared = category.getType() == CategoryType.SHARED
                && user.getCoupleId() != null
                && category.getUser().getCouple() != null
                && user.getCoupleId().equals(category.getUser().getCouple().getId());
        if (!owned && !sameCoupleShared) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Category access denied");
        }
        return category;
    }

    private Event loadVisibleEvent(User user, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!isVisibleToUser(event, user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Event access denied");
        }
        return event;
    }

    private boolean isVisibleToUser(Event event, User user) {
        if (event.getOwner().getId().equals(user.getId())) {
            return true;
        }
        return user.getCouple() != null
                && event.getOwner().getCouple() != null
                && user.getCouple().getId().equals(event.getOwner().getCouple().getId());
    }

    private boolean canMutateEvent(User user, Event event) {
        if (event.getOwner().getId().equals(user.getId())) {
            return true;
        }
        return event.getCategory().getType() == CategoryType.SHARED
                && user.getCoupleId() != null
                && event.getOwner().getCouple() != null
                && user.getCoupleId().equals(event.getOwner().getCouple().getId());
    }

    private EventDtos.EventResponse toResponse(Event event) {
        return new EventDtos.EventResponse(
                event.getId(),
                event.getTitle(),
                event.getContent(),
                event.isAllDay(),
                event.getStartAt(),
                event.getEndAt(),
                event.getCategory().getId(),
                event.getCategory().getName(),
                event.getCategory().getColorHex(),
                event.getCategory().getType(),
                event.getOwner().getId(),
                event.getOwner().getNickname(),
                event.isHidden(),
                event.getSourceType(),
                event.getAlertOption()
        );
    }

    private LocalDateTime toDateTime(LocalDate date, LocalTime time, boolean allDay) {
        if (allDay) {
            return date.atStartOfDay();
        }
        return date.atTime(time != null ? time : LocalTime.of(9, 0));
    }
}
