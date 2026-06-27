package com.couplecalendar.event;

import com.couplecalendar.category.Category;
import com.couplecalendar.common.BaseTimeEntity;
import com.couplecalendar.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
public class Event extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String title;

    @Size(max = 200)
    @Column(length = 200)
    private String content;

    @Column(nullable = false)
    private boolean allDay;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private boolean hidden;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventSourceType sourceType = EventSourceType.LOCAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertOption alertOption = AlertOption.NONE;

    @Column(length = 255)
    private String externalEventId;

    @Column(length = 255)
    private String externalCalendarId;

    protected Event() {
    }

    public Event(String title, String content, boolean allDay, LocalDateTime startAt, LocalDateTime endAt,
                 Category category, User owner, EventSourceType sourceType, AlertOption alertOption,
                 String externalEventId, String externalCalendarId) {
        this.title = title;
        this.content = content;
        this.allDay = allDay;
        this.startAt = startAt;
        this.endAt = endAt;
        this.category = category;
        this.owner = owner;
        this.sourceType = sourceType;
        this.alertOption = alertOption;
        this.externalEventId = externalEventId;
        this.externalCalendarId = externalCalendarId;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public boolean isAllDay() {
        return allDay;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public LocalDateTime getEndAt() {
        return endAt;
    }

    public Category getCategory() {
        return category;
    }

    public User getOwner() {
        return owner;
    }

    public boolean isHidden() {
        return hidden;
    }

    public EventSourceType getSourceType() {
        return sourceType;
    }

    public AlertOption getAlertOption() {
        return alertOption;
    }

    public String getExternalEventId() {
        return externalEventId;
    }

    public String getExternalCalendarId() {
        return externalCalendarId;
    }

    public void update(String title, String content, boolean allDay, LocalDateTime startAt, LocalDateTime endAt,
                       Category category, boolean hidden, AlertOption alertOption) {
        this.title = title;
        this.content = content;
        this.allDay = allDay;
        this.startAt = startAt;
        this.endAt = endAt;
        this.category = category;
        this.hidden = hidden;
        this.alertOption = alertOption;
    }

    public void hide() {
        this.hidden = true;
    }

    public void syncFromExternal(String title, String content, boolean allDay, LocalDateTime startAt, LocalDateTime endAt,
                                 Category category, EventSourceType sourceType, String externalEventId,
                                 String externalCalendarId) {
        this.title = title;
        this.content = content;
        this.allDay = allDay;
        this.startAt = startAt;
        this.endAt = endAt;
        this.category = category;
        this.sourceType = sourceType;
        this.externalEventId = externalEventId;
        this.externalCalendarId = externalCalendarId;
        this.hidden = false;
        this.alertOption = AlertOption.NONE;
    }
}
