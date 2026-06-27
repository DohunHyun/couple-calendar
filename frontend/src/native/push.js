import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { updateDeviceToken } from "../api/auth";

let initialized = false;

/**
 * 네이티브 앱(Android/iOS)에서만 푸시 등록을 수행한다.
 * 웹/프리뷰/dev 테스트 환경에서는 아무 동작도 하지 않는다.
 * 등록 성공 시 받은 디바이스 토큰을 백엔드(PUT /auth/device-token)로 보낸다.
 *
 * 실제 알림 수신에는 네이티브 설정이 추가로 필요하다:
 * - Android: google-services.json (Firebase)
 * - iOS: APNS 인증서 + Push Notifications capability (Apple Developer)
 */
export async function initPushNotifications() {
  if (initialized || !Capacitor.isNativePlatform()) {
    return;
  }
  initialized = true;

  try {
    PushNotifications.addListener("registration", async (token) => {
      try {
        await updateDeviceToken(token.value);
      } catch (error) {
        console.warn("device token 전송 실패", error);
      }
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.warn("push 등록 오류", error);
    });

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== "granted") {
      return;
    }
    await PushNotifications.register();
  } catch (error) {
    console.warn("push 초기화 건너뜀", error);
  }
}
