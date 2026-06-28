package com.couplecalendar.event;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class DeviceSyncDtos {

    /** 클라이언트가 선택 캘린더에서 읽은 일정 묶음을 업로드. */
    public record DeviceSyncRequest(
            @NotNull List<DeviceCalendar> calendars,
            @NotNull List<DeviceEvent> events,
            @NotNull LocalDateTime rangeStart,
            @NotNull LocalDateTime rangeEnd
    ) {}

    public record DeviceCalendar(
            @NotNull String externalCalendarId,
            String name,
            String colorHex
    ) {}

    public record DeviceEvent(
            @NotNull String externalEventId,
            @NotNull String externalCalendarId,
            String title,
            String content,
            boolean allDay,
            @NotNull LocalDateTime startAt,
            @NotNull LocalDateTime endAt,
            AlertOption alertOption
    ) {}

    public record DeviceSyncResponse(
            int upserted,
            int hidden
    ) {}
}
