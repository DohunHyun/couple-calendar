package com.couplecalendar.event;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class AlertOptionTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 6, 27, 9, 0);

    @Test
    void none은트리거시각이없다() {
        assertThat(AlertOption.NONE.triggerTimeFrom(START)).isNull();
    }

    @Test
    void 옵션별트리거시각이정확하다() {
        assertThat(AlertOption.AT_TIME.triggerTimeFrom(START)).isEqualTo(START);
        assertThat(AlertOption.TEN_MINUTES_BEFORE.triggerTimeFrom(START)).isEqualTo(START.minusMinutes(10));
        assertThat(AlertOption.ONE_HOUR_BEFORE.triggerTimeFrom(START)).isEqualTo(START.minusHours(1));
        assertThat(AlertOption.ONE_DAY_BEFORE.triggerTimeFrom(START)).isEqualTo(START.minusDays(1));
    }
}
