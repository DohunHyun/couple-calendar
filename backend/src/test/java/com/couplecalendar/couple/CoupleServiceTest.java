package com.couplecalendar.couple;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.couplecalendar.common.ApiException;
import com.couplecalendar.user.AuthProvider;
import com.couplecalendar.user.User;
import com.couplecalendar.user.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 커플 연동 상태 머신(R1 1인1커플 / R2 자가연결 불가 / R3 연동 상태 분리) 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CoupleServiceTest {

    @Mock CoupleRepository coupleRepository;
    @Mock UserRepository userRepository;
    @Mock CoupleLinkSseService sseService;

    @InjectMocks CoupleService coupleService;

    @Test
    void createInviteCode_생성자는아직커플에묶이지않는다() {
        User u = user(1, null);
        when(coupleRepository.findByOwnerUserIdAndStatus(1L, "PENDING")).thenReturn(Optional.empty());
        when(coupleRepository.existsByInviteCode(anyString())).thenReturn(false);
        when(coupleRepository.save(any(Couple.class))).thenAnswer(i -> i.getArgument(0));

        CoupleDtos.InviteCodeResponse res = coupleService.createInviteCode(u);

        assertThat(res.status()).isEqualTo("PENDING");
        assertThat(u.getCouple()).isNull();
    }

    @Test
    void joinByCode_자기코드로는연동할수없다() {
        Couple couple = couple(1, 1L, "PENDING");
        User u = user(1, null);
        when(coupleRepository.findByInviteCode("CODE1234")).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> coupleService.joinByCode(u, "CODE1234"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void joinByCode_이미연동된코드는거부된다() {
        Couple couple = couple(1, 1L, "LINKED");
        User u = user(2, null);
        when(coupleRepository.findByInviteCode("CODE1234")).thenReturn(Optional.of(couple));

        assertThatThrownBy(() -> coupleService.joinByCode(u, "CODE1234"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void joinByCode_성공시양쪽을연동하고실시간이벤트를보낸다() {
        Couple couple = couple(1, 1L, "PENDING");
        User owner = user(1, null);
        User joiner = user(2, null);
        when(coupleRepository.findByInviteCode("CODE1234")).thenReturn(Optional.of(couple));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(userRepository.findAll()).thenReturn(List.of(owner, joiner));

        coupleService.joinByCode(joiner, "CODE1234");

        assertThat(owner.getCouple()).isNotNull();
        assertThat(joiner.getCouple()).isNotNull();
        assertThat(couple.getStatus()).isEqualTo("LINKED");
        verify(sseService, times(2)).sendLinked(anyLong(), eq(1L));
    }

    // --- helpers ---

    private User user(long id, Couple couple) {
        User u = new User("u" + id + "@example.com", AuthProvider.GOOGLE, "user" + id);
        ReflectionTestUtils.setField(u, "id", id);
        if (couple != null) {
            u.joinCouple(couple);
        }
        return u;
    }

    private Couple couple(long id, long ownerUserId, String status) {
        Couple c = new Couple("CODE1234", ownerUserId);
        ReflectionTestUtils.setField(c, "id", id);
        ReflectionTestUtils.setField(c, "status", status);
        return c;
    }
}
