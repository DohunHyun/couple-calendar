package com.couplecalendar.profile;

import com.couplecalendar.common.CurrentUser;
import com.couplecalendar.user.UserSetting;
import com.couplecalendar.user.UserSettingRepository;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final CurrentUser currentUser;
    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;

    public SettingsController(CurrentUser currentUser, UserRepository userRepository, UserSettingRepository userSettingRepository) {
        this.currentUser = currentUser;
        this.userRepository = userRepository;
        this.userSettingRepository = userSettingRepository;
    }

    @GetMapping
    public SettingsDtos.SettingsResponse get(Authentication authentication) {
        User user = currentUser.require(authentication);
        UserSetting setting = ensureSetting(user);
        return new SettingsDtos.SettingsResponse(
                user.getNickname(),
                user.getCouple() != null ? user.getCouple().getAnniversaryDate() : null,
                setting.isGoogleVisible(),
                setting.isDdayVisible(),
                setting.isProfileCompleted(),
                setting.isDeviceSyncDefaultShared()
        );
    }

    @PatchMapping("/profile")
    public SettingsDtos.SettingsResponse updateProfile(Authentication authentication, @RequestBody SettingsDtos.ProfileRequest request) {
        User user = currentUser.require(authentication);
        UserSetting setting = ensureSetting(user);
        user.updateProfile(request.nickname());
        if (user.getCouple() != null && request.anniversaryDate() != null) {
            user.getCouple().updateAnniversaryDate(request.anniversaryDate());
        }
        setting.setProfileCompleted(true);
        userRepository.save(user);
        userSettingRepository.save(setting);
        return new SettingsDtos.SettingsResponse(
                user.getNickname(),
                user.getCouple() != null ? user.getCouple().getAnniversaryDate() : null,
                setting.isGoogleVisible(),
                setting.isDdayVisible(),
                setting.isProfileCompleted(),
                setting.isDeviceSyncDefaultShared()
        );
    }

    @PatchMapping("/preferences")
    public SettingsDtos.SettingsResponse updatePreferences(Authentication authentication, @RequestBody SettingsDtos.PreferenceRequest request) {
        User user = currentUser.require(authentication);
        UserSetting setting = ensureSetting(user);
        if (request.googleVisible() != null) {
            setting.setGoogleVisible(request.googleVisible());
        }
        if (request.ddayVisible() != null) {
            setting.setDdayVisible(request.ddayVisible());
        }
        if (request.deviceSyncDefaultShared() != null) {
            setting.setDeviceSyncDefaultShared(request.deviceSyncDefaultShared());
        }
        userSettingRepository.save(setting);
        return new SettingsDtos.SettingsResponse(
                user.getNickname(),
                user.getCouple() != null ? user.getCouple().getAnniversaryDate() : null,
                setting.isGoogleVisible(),
                setting.isDdayVisible(),
                setting.isProfileCompleted(),
                setting.isDeviceSyncDefaultShared()
        );
    }

    private UserSetting ensureSetting(User user) {
        return userSettingRepository.findByUser(user)
                .orElseGet(() -> userSettingRepository.save(new UserSetting(user)));
    }
}
