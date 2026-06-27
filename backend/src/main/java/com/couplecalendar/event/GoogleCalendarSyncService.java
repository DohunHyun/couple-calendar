package com.couplecalendar.event;

import com.couplecalendar.auth.GoogleOAuthClient;
import com.couplecalendar.auth.OAuthAccount;
import com.couplecalendar.auth.OAuthAccountRepository;
import com.couplecalendar.auth.AuthDtos;
import com.couplecalendar.category.Category;
import com.couplecalendar.category.CategoryRepository;
import com.couplecalendar.category.CategoryType;
import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class GoogleCalendarSyncService {

    private static final String HOLIDAY_CALENDAR_ID = "ko.south_korea#holiday@group.v.calendar.google.com";

    private final OAuthAccountRepository oAuthAccountRepository;
    private final GoogleOAuthClient googleOAuthClient;
    private final RestClient restClient;
    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;

    public GoogleCalendarSyncService(
            OAuthAccountRepository oAuthAccountRepository,
            GoogleOAuthClient googleOAuthClient,
            RestClient restClient,
            EventRepository eventRepository,
            CategoryRepository categoryRepository
    ) {
        this.oAuthAccountRepository = oAuthAccountRepository;
        this.googleOAuthClient = googleOAuthClient;
        this.restClient = restClient;
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public void syncMonth(User user, LocalDate monthStart, LocalDate monthEnd) {
        OAuthAccount account = oAuthAccountRepository.findByUserAndProvider(user, AuthProvider.GOOGLE)
                .orElse(null);
        if (account == null) {
            // 구글 미연동 사용자(예: 카카오 단독 로그인)는 동기화를 건너뛴다 (best-effort).
            return;
        }
        String accessToken = ensureAccessToken(account);
        upsertEvents(user, accessToken, "primary", EventSourceType.GOOGLE, ensureCategory(user, "Google 일정", "#C0C0C0", CategoryType.PRIVATE),
                monthStart, monthEnd);
        upsertEvents(user, accessToken, HOLIDAY_CALENDAR_ID, EventSourceType.GOOGLE_HOLIDAY,
                ensureCategory(user, "대한민국 공휴일", "#C0C0C0", CategoryType.SHARED), monthStart, monthEnd);
    }

    private String ensureAccessToken(OAuthAccount account) {
        if (account.getExpiresAt() == null || account.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(1))) {
            return account.getAccessToken();
        }
        if (account.getRefreshToken() == null || account.getRefreshToken().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Google refresh token is missing.");
        }
        AuthDtos.OAuthTokenBundle refreshed = googleOAuthClient.refreshAccessToken(account.getRefreshToken());
        account.updateTokens(
                refreshed.accessToken(),
                refreshed.refreshToken(),
                refreshed.expiresInSeconds() == null ? null : LocalDateTime.now().plusSeconds(refreshed.expiresInSeconds()),
                refreshed.scope()
        );
        oAuthAccountRepository.save(account);
        return account.getAccessToken();
    }

    private void upsertEvents(User user, String accessToken, String calendarId, EventSourceType sourceType,
                              Category category, LocalDate monthStart, LocalDate monthEnd) {
        JsonNode response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("www.googleapis.com")
                        .path("/calendar/v3/calendars/{calendarId}/events")
                        .queryParam("timeMin", monthStart.atStartOfDay() + "Z")
                        .queryParam("timeMax", monthEnd.plusDays(1).atStartOfDay() + "Z")
                        .queryParam("singleEvents", "true")
                        .queryParam("orderBy", "startTime")
                        .build(calendarId))
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(JsonNode.class);

        for (JsonNode item : response.path("items")) {
            String status = item.path("status").asText("");
            if ("cancelled".equals(status)) {
                continue;
            }
            boolean allDay = item.path("start").has("date");
            LocalDateTime startAt = parseDateTime(item.path("start"), allDay);
            LocalDateTime endAt = parseDateTime(item.path("end"), allDay);
            String externalEventId = item.path("id").asText();

            Event event = eventRepository.findByOwner_IdAndSourceTypeAndExternalEventId(user.getId(), sourceType, externalEventId)
                    .orElseGet(() -> new Event(
                            item.path("summary").asText("(제목 없음)"),
                            item.path("description").asText(""),
                            allDay,
                            startAt,
                            endAt,
                            category,
                            user,
                            sourceType,
                            AlertOption.NONE,
                            externalEventId,
                            calendarId
                    ));
            event.syncFromExternal(
                    item.path("summary").asText("(제목 없음)"),
                    item.path("description").asText(""),
                    allDay,
                    startAt,
                    endAt,
                    category,
                    sourceType,
                    externalEventId,
                    calendarId
            );
            eventRepository.save(event);
        }
    }

    private LocalDateTime parseDateTime(JsonNode node, boolean allDay) {
        if (allDay) {
            return LocalDate.parse(node.path("date").asText()).atStartOfDay();
        }
        return OffsetDateTime.parse(node.path("dateTime").asText(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                .toLocalDateTime();
    }

    private Category ensureCategory(User user, String name, String colorHex, CategoryType type) {
        return categoryRepository.findAccessibleCategories(user.getId(), user.getCoupleId()).stream()
                .filter(category -> category.getUser().getId().equals(user.getId()))
                .filter(category -> category.getName().equals(name))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(new Category(name, colorHex, type, user)));
    }
}
