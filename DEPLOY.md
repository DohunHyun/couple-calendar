# 배포 가이드 (Backend)

백엔드(Spring Boot + MySQL)를 클라우드에 배포해 앱이 실제로 동작하게 한다.
추천: **Railway** (Spring Boot + MySQL 가장 쉬움). 아래는 Railway 기준이며, Dockerfile이 있어 다른 호스팅도 가능.

## 0. 준비된 것 (코드 측)

- `server.port=${PORT:8080}` — 클라우드가 주입하는 포트 사용
- CORS 허용 origin에 Capacitor 앱(WebView) 추가됨: `capacitor://localhost`, `http://localhost`, `https://localhost` (+ env `CORS_ALLOWED_ORIGINS`로 override 가능)
- `backend/Dockerfile` (멀티스테이지 빌드)
- 시크릿은 모두 환경변수: `JWT_SECRET`, `DB_URL/DB_USERNAME/DB_PASSWORD`, `GOOGLE_*`, `KAKAO_*`

## 1. Railway 배포 (도훈)

1. https://railway.app 가입 → **New Project** → **Deploy from GitHub repo** → `DohunHyun/couple-calendar` 선택.
2. 서비스 설정에서 **Root Directory = `backend`** 지정 (Dockerfile 자동 인식).
3. **+ New → Database → MySQL** 추가. Railway가 `MYSQLHOST/MYSQLPORT/MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD` 등을 제공.
4. 백엔드 서비스 **Variables**에 환경변수 설정:
   - `JWT_SECRET` = 충분히 긴 랜덤 문자열 (예: `openssl rand -base64 48`)
   - `DB_URL` = `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?serverTimezone=Asia/Seoul`
   - `DB_USERNAME` = `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD` = `${{MySQL.MYSQLPASSWORD}}`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` (아래 2번에서 발급)
5. 배포 후 **공개 도메인** 생성 (예: `couple-calendar-production.up.railway.app`). 이게 백엔드 API 주소.

## 2. OAuth 콘솔 설정 (도훈 — 시크릿)

> 실제 키는 **채팅에 붙여넣지 말 것**. 콘솔과 Railway Variables에만 입력.

- **Google Cloud Console** → OAuth 2.0 클라이언트 생성 → 승인된 리디렉션 URI 추가:
  - 웹/앱 콜백 도메인에 맞춰 등록 (모바일은 딥링크/커스텀 스킴 별도 설정 필요)
- **Kakao Developers** → 앱 생성 → REST API 키 / 보안 키 발급 → Redirect URI 등록.

## 3. 프론트엔드(앱) 재빌드

배포 도메인을 가리키도록 빌드 시 환경변수 지정 후 네이티브 동기화:

```bash
cd frontend
VITE_API_BASE_URL="https://<배포도메인>/api" npm run build
npm run cap:sync
# Android Studio / Xcode 에서 Run, 또는 스토어용 릴리스 빌드
```

## 4. 운영 전 점검

- `JWT_SECRET` 반드시 주입 (기본 더미값 사용 금지)
- JPA `ddl-auto: update` — 초기엔 편하지만, 스키마 안정화 후 마이그레이션(Flyway 등) 전환 권장
- 모바일 OAuth는 웹 리다이렉트와 달라 딥링크 설정 필요 (커스텀 URL 스킴 또는 provider 네이티브 SDK)
- 푸시(G3) 실발송은 Firebase(FCM)/APNS 프로비저닝 + `FcmPushSender` 구현 후 동작
