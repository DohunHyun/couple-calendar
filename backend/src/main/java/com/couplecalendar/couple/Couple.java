package com.couplecalendar.couple;

import com.couplecalendar.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "couples")
public class Couple extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 8)
    private String inviteCode;

    @Column(nullable = false)
    private Long ownerUserId;

    private LocalDate anniversaryDate;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDateTime linkedAt;

    protected Couple() {
    }

    public Couple(String inviteCode, Long ownerUserId) {
        this.inviteCode = inviteCode;
        this.ownerUserId = ownerUserId;
        this.status = "PENDING";
    }

    public Long getId() {
        return id;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public LocalDate getAnniversaryDate() {
        return anniversaryDate;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getLinkedAt() {
        return linkedAt;
    }

    public void updateAnniversaryDate(LocalDate anniversaryDate) {
        this.anniversaryDate = anniversaryDate;
    }

    public void markLinked() {
        this.status = "LINKED";
        this.linkedAt = LocalDateTime.now();
    }
}
