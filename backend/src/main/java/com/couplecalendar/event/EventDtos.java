package com.couplecalendar.event;

import com.couplecalendar.category.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public class EventDtos {

    public record EventRequest(
            @NotBlank @Size(max = 50) String title,
            @Size(max = 200) String content,
            boolean allDay,
            @NotNull LocalDate startDate,
            LocalTime startTime,
            @NotNull LocalDate endDate,
            LocalTime endTime,
            @NotNull Long categoryId,
            @NotNull AlertOption alertOption
    ) {}

    public record EventResponse(
            Long id,
            String title,
            String content,
            boolean allDay,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Long categoryId,
            String categoryName,
            String colorHex,
            CategoryType categoryType,
            Long ownerId,
            String ownerNickname,
            boolean hidden,
            EventSourceType sourceType,
            AlertOption alertOption,
            boolean shared
    ) {}

    public record CalendarResponse(
            List<EventResponse> events,
            boolean googleVisible,
            Set<String> holidayDates
    ) {}

    public record DeleteDecisionResponse(
            boolean confirmRequired,
            String message,
            boolean deleted
    ) {}

    public record ShareRequest(boolean shared) {}
}
