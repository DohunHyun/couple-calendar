package com.couplecalendar.user;

import com.couplecalendar.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_settings")
public class UserSetting extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private boolean googleVisible = true;

    @Column(nullable = false)
    private boolean ddayVisible = true;

    @Column(nullable = false)
    private boolean profileCompleted = false;

    protected UserSetting() {
    }

    public UserSetting(User user) {
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public boolean isGoogleVisible() {
        return googleVisible;
    }

    public boolean isDdayVisible() {
        return ddayVisible;
    }

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public void setGoogleVisible(boolean googleVisible) {
        this.googleVisible = googleVisible;
    }

    public void setDdayVisible(boolean ddayVisible) {
        this.ddayVisible = ddayVisible;
    }

    public void setProfileCompleted(boolean profileCompleted) {
        this.profileCompleted = profileCompleted;
    }
}
