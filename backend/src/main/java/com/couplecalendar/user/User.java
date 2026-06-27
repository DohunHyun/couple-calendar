package com.couplecalendar.user;

import com.couplecalendar.common.BaseTimeEntity;
import com.couplecalendar.couple.Couple;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Size(max = 10)
    @Column(nullable = false, length = 10)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "couple_id")
    private Couple couple;

    private String deviceToken;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserSetting setting;

    protected User() {
    }

    public User(String email, AuthProvider provider, String nickname) {
        this.email = email;
        this.provider = provider;
        this.nickname = nickname;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public Couple getCouple() {
        return couple;
    }

    public String getDeviceToken() {
        return deviceToken;
    }

    public UserSetting getSetting() {
        return setting;
    }

    public void updateProfile(String nickname) {
        if (nickname != null && !nickname.isBlank()) {
            this.nickname = nickname.substring(0, Math.min(10, nickname.length()));
        }
    }

    public void joinCouple(Couple couple) {
        this.couple = couple;
    }

    public void leaveCouple() {
        this.couple = null;
    }

    public void updateDeviceToken(String deviceToken) {
        this.deviceToken = deviceToken;
    }

    public void attachSetting(UserSetting setting) {
        this.setting = setting;
    }

    public Long getCoupleId() {
        return couple != null ? couple.getId() : null;
    }
}
