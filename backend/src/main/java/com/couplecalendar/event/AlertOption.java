package com.couplecalendar.event;

import java.time.LocalDateTime;

public enum AlertOption {
    NONE,
    AT_TIME,
    TEN_MINUTES_BEFORE,
    ONE_HOUR_BEFORE,
    ONE_DAY_BEFORE;

    /**
     * 일정 시작 시각 기준 알림이 발송돼야 할 시각. NONE 이면 null.
     */
    public LocalDateTime triggerTimeFrom(LocalDateTime startAt) {
        return switch (this) {
            case NONE -> null;
            case AT_TIME -> startAt;
            case TEN_MINUTES_BEFORE -> startAt.minusMinutes(10);
            case ONE_HOUR_BEFORE -> startAt.minusHours(1);
            case ONE_DAY_BEFORE -> startAt.minusDays(1);
        };
    }
}
