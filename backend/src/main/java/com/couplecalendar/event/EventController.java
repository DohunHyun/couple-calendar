package com.couplecalendar.event;

import com.couplecalendar.common.CurrentUser;
import com.couplecalendar.user.User;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final CurrentUser currentUser;
    private final EventService eventService;
    private final DeviceCalendarSyncService deviceCalendarSyncService;

    public EventController(CurrentUser currentUser, EventService eventService,
                           DeviceCalendarSyncService deviceCalendarSyncService) {
        this.currentUser = currentUser;
        this.eventService = eventService;
        this.deviceCalendarSyncService = deviceCalendarSyncService;
    }

    @GetMapping
    public EventDtos.CalendarResponse list(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate monthStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate monthEnd,
            @RequestParam(defaultValue = "false") boolean syncGoogle
    ) {
        User user = currentUser.require(authentication);
        return eventService.list(user, monthStart, monthEnd, syncGoogle);
    }

    @PostMapping
    public EventDtos.EventResponse create(Authentication authentication, @Valid @RequestBody EventDtos.EventRequest request) {
        User user = currentUser.require(authentication);
        return eventService.create(user, request);
    }

    @PutMapping("/{eventId}")
    public EventDtos.EventResponse update(
            Authentication authentication,
            @PathVariable Long eventId,
            @Valid @RequestBody EventDtos.EventRequest request
    ) {
        User user = currentUser.require(authentication);
        return eventService.update(user, eventId, request);
    }

    @DeleteMapping("/{eventId}")
    public EventDtos.DeleteDecisionResponse delete(
            Authentication authentication,
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "false") boolean confirmSharedDelete
    ) {
        User user = currentUser.require(authentication);
        return eventService.delete(user, eventId, confirmSharedDelete);
    }

    /** 기기 캘린더 일정 배치 동기화 (폰 → 서비스, spec §8-A). */
    @PostMapping("/device-sync")
    public DeviceSyncDtos.DeviceSyncResponse deviceSync(
            Authentication authentication,
            @Valid @RequestBody DeviceSyncDtos.DeviceSyncRequest request
    ) {
        User user = currentUser.require(authentication);
        return deviceCalendarSyncService.sync(user, request);
    }

    /** DEVICE 일정의 공유 여부 토글(작성자만). */
    @PatchMapping("/{eventId}/share")
    public EventDtos.EventResponse updateShare(
            Authentication authentication,
            @PathVariable Long eventId,
            @RequestBody EventDtos.ShareRequest request
    ) {
        User user = currentUser.require(authentication);
        return eventService.updateShared(user, eventId, request.shared());
    }
}
