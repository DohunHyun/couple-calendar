package com.couplecalendar.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 기본 푸시 구현체. 실제 발송 대신 로그를 남긴다.
 * {@code app.push.provider} 미설정(기본) 또는 {@code log} 일 때 활성화된다.
 * 실제 FCM 구현체를 추가할 때는 {@code app.push.provider=fcm} 으로 전환하고
 * 동일 인터페이스({@link PushSender})를 구현한 빈을 등록하면 된다.
 */
@Component
@ConditionalOnProperty(name = "app.push.provider", havingValue = "log", matchIfMissing = true)
public class LoggingPushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingPushSender.class);

    @Override
    public void send(String deviceToken, String title, String body) {
        log.info("[PUSH] token={} title='{}' body='{}'", deviceToken, title, body);
    }
}
