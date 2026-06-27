package com.couplecalendar.event;

/**
 * 단말 푸시 발송 추상화. 기본 구현은 {@link LoggingPushSender}(로그 출력).
 * 실제 FCM/APNS 연동 시 {@code app.push.provider} 프로퍼티에 맞춘 구현체를 추가하면
 * 이 인터페이스를 그대로 주입받는 호출부(PushNotificationService)는 변경 없이 동작한다.
 */
public interface PushSender {

    /**
     * @param deviceToken 수신자 단말 토큰 (null/blank 이면 호출부에서 걸러짐)
     * @param title       알림 제목
     * @param body        알림 본문
     */
    void send(String deviceToken, String title, String body);
}
