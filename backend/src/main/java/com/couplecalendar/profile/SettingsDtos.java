package com.couplecalendar.profile;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class SettingsDtos {

    public record ProfileRequest(
            @Size(max = 10) String nickname,
            LocalDate anniversaryDate
    ) {}

    public record PreferenceRequest(
            Boolean googleVisible,
            Boolean ddayVisible
    ) {}

    public record SettingsResponse(
            String nickname,
            LocalDate anniversaryDate,
            boolean googleVisible,
            boolean ddayVisible,
            boolean profileCompleted
    ) {}
}
