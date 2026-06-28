package com.couplecalendar.event;

import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryRepository;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 기기 캘린더 연동(폰 → 서비스 단방향). 클라이언트가 선택 캘린더에서 읽은 일정을 받아
 * sourceType=DEVICE 로 upsert 한다. 설계: spec.md §8-A.
 *
 * - 캘린더별 카테고리 자동 생성/갱신(색 보존), 매핑 키 (owner, externalCalendarId).
 * - 신규 일정 공유여부 = UserSetting.deviceSyncDefaultShared. 기존 일정은 사용자 override 유지(sticky).
 * - 조회 범위 내에서 이번에 안 올라온 기존 DEVICE 일정은 hidden 처리(기기에서 삭제됨).
 */
@Service
public class DeviceCalendarSyncService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final UserSettingRepository userSettingRepository;

    public DeviceCalendarSyncService(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            UserSettingRepository userSettingRepository
    ) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.userSettingRepository = userSettingRepository;
    }

    @Transactional
    public DeviceSyncDtos.DeviceSyncResponse sync(User user, DeviceSyncDtos.DeviceSyncRequest request) {
        Map<String, Category> categoryByCalendar = new HashMap<>();
        for (DeviceSyncDtos.DeviceCalendar calendar : request.calendars()) {
            categoryByCalendar.put(calendar.externalCalendarId(), ensureDeviceCategory(user, calendar));
        }

        boolean defaultShared = userSettingRepository.findByUser(user)
                .map(UserSetting::isDeviceSyncDefaultShared)
                .orElse(false);

        Set<String> seen = new HashSet<>();
        int upserted = 0;
        for (DeviceSyncDtos.DeviceEvent device : request.events()) {
            Category category = categoryByCalendar.get(device.externalCalendarId());
            if (category == null) {
                // 캘린더 메타가 함께 오지 않은 일정은 스킵(클라이언트가 calendars에 포함해야 함).
                continue;
            }
            String title = (device.title() == null || device.title().isBlank()) ? "(제목 없음)" : device.title();
            AlertOption alert = device.alertOption() == null ? AlertOption.NONE : device.alertOption();

            Event existing = eventRepository
                    .findByOwner_IdAndSourceTypeAndExternalEventId(user.getId(), EventSourceType.DEVICE, device.externalEventId())
                    .orElse(null);
            if (existing == null) {
                Event event = new Event(title, device.content(), device.allDay(), device.startAt(), device.endAt(),
                        category, user, EventSourceType.DEVICE, alert, device.externalEventId(), device.externalCalendarId());
                event.setShared(defaultShared);
                eventRepository.save(event);
            } else {
                // 제목·시간·카테고리만 갱신, 공유설정(shared)은 유지(sticky), 숨김 해제.
                existing.syncFromDevice(title, device.content(), device.allDay(), device.startAt(), device.endAt(), category);
            }
            seen.add(device.externalEventId());
            upserted++;
        }

        int hidden = 0;
        List<Event> inRange = eventRepository.findByOwner_IdAndSourceTypeAndStartAtBetween(
                user.getId(), EventSourceType.DEVICE, request.rangeStart(), request.rangeEnd());
        for (Event event : inRange) {
            if (!event.isHidden() && !seen.contains(event.getExternalEventId())) {
                event.hide();
                hidden++;
            }
        }

        return new DeviceSyncDtos.DeviceSyncResponse(upserted, hidden);
    }

    private Category ensureDeviceCategory(User user, DeviceSyncDtos.DeviceCalendar calendar) {
        String name = (calendar.name() == null || calendar.name().isBlank()) ? "기기 캘린더" : calendar.name();
        String color = (calendar.colorHex() == null || calendar.colorHex().isBlank()) ? "#E5E7EB" : calendar.colorHex();
        return categoryRepository.findByUser_IdAndExternalCalendarId(user.getId(), calendar.externalCalendarId())
                .map(existing -> {
                    existing.update(name, color, existing.getType());
                    return existing;
                })
                .orElseGet(() -> categoryRepository.save(
                        new Category(name, color, CategoryType.PRIVATE, user, calendar.externalCalendarId())));
    }
}
