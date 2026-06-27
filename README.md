# Couple Calendar MVP

[![CI](https://github.com/DohunHyun/couple-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/DohunHyun/couple-calendar/actions/workflows/ci.yml)

모바일 웹 기반 커플 공유 캘린더 MVP입니다. `frontend`는 React + Tailwind + Axios, `backend`는 Spring Boot + JPA + JWT + SSE, DB는 MySQL 기준입니다.

## 구조

- `/Users/dohunmac/Documents/coding/git/calendar/frontend`: 모바일 웹 UI
- `/Users/dohunmac/Documents/coding/git/calendar/backend`: REST API, 인증, 커플 연동, 일정/카테고리
- `/Users/dohunmac/Documents/coding/git/calendar/docker-compose.yml`: 로컬 MySQL

## 실행

1. 환경변수

루트의 `.env.example` 값을 참고해서 실제 OAuth 값들을 준비합니다.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `VITE_API_BASE_URL`

2. MySQL

```bash
docker compose up -d
```

3. Backend

```bash
cd /Users/dohunmac/Documents/coding/git/calendar/backend
mvn spring-boot:run
```

4. Frontend

```bash
cd /Users/dohunmac/Documents/coding/git/calendar/frontend
npm install
npm run dev
npm test
```

OAuth Redirect URI 예시

- Google: `http://localhost:5173/oauth/callback?provider=GOOGLE`
- Kakao: `http://localhost:5173/oauth/callback?provider=KAKAO`

## 핵심 구현 포인트

- 실제 Kakao/Google OAuth 로그인 후 `초대코드 생성` 또는 `초대코드 입력` 분기
- 초대코드 생성 후 SSE 대기, 상대방 연동 시 `LINKED` 이벤트로 자동 화면 전환
- 프로필 설정에서 닉네임과 연애 시작일 설정, 건너뛰기 허용
- 메인 달력은 순백색 배경 유지
- 날짜 탭 시 하단 바텀시트로 일정 목록 노출
- 종일 일정은 카테고리 컬러 블록, 시간 일정은 세로 컬러 바 + 시작 시간 노출
- 카테고리 색상은 12개 파스텔 팔레트로 제한
- 구글 일정 삭제는 실제 삭제 대신 `is_hidden` 마스킹 정책 사용
- Google Calendar 개인 일정 + 대한민국 공휴일 캘린더 동기화 구조 포함
- 공유 일정 삭제 시 작성자 본인이 아니면 확인 메시지 반환
- 설정 페이지에서 카테고리 관리, 구글 표시 여부, D-Day 표시 여부 관리

## API 요약

- `GET /api/auth/oauth/{provider}/authorize-url`
- `POST /api/auth/oauth/{provider}/callback`
- `GET /api/auth/me`
- `POST /api/couples/invite-code`
- `POST /api/couples/join`
- `GET /api/couples/stream?token=...`
- `GET/POST/PUT /api/categories`
- `GET/POST/PUT/DELETE /api/events`
- `GET /api/settings`
- `PATCH /api/settings/profile`
- `PATCH /api/settings/preferences`

## 주의

- Google/Kakao 개발자 콘솔에 위 redirect URI를 반드시 등록해야 합니다.
- Google Calendar 동기화는 Google 로그인 계정의 토큰이 저장되어 있어야 정상 동작합니다.
- 현재 워크스페이스에는 기존 빌드 캐시나 의존성이 없어, 실행 전 `npm install` 및 Maven 의존성 다운로드가 필요합니다.

## 개발용 테스트 계정

- 개발 환경(`npm run dev`)에서는 로그인 화면에 `테스트 계정 A로 접속`, `테스트 계정 B로 접속` 버튼이 나타납니다.
- 두 계정은 같은 공유 그룹(`test-shared-group-1`)에 속합니다.
- Shared 일정은 두 계정 모두에게 보여야 하고, Private 일정은 작성자 본인에게만 보여야 합니다.

수동 테스트 시나리오

1. 테스트 계정 A로 접속
- `둘이 저녁 약속`
- `주말 데이트`
- `나현 개인 일정`
- `나현 병원 예약`
- 위 4개만 보여야 하고, `도훈 개인 일정`, `도훈 운동`, `다른 그룹 일정 - 보이면 안 됨`은 보이면 안 됩니다.

2. 테스트 계정 B로 접속
- `둘이 저녁 약속`
- `주말 데이트`
- `도훈 개인 일정`
- `도훈 운동`
- 위 4개만 보여야 하고, `나현 개인 일정`, `나현 병원 예약`, `다른 그룹 일정 - 보이면 안 됨`은 보이면 안 됩니다.

3. Shared / Private 필터 확인
- Shared 필터: 두 계정 모두 `둘이 저녁 약속`, `주말 데이트`만 보여야 합니다.
- Private 필터: A는 A 개인 일정만, B는 B 개인 일정만 보여야 합니다.

4. 일정 생성 확인
- A 계정에서 Shared 일정 생성 후 B로 전환하면 보여야 합니다.
- B 계정에서 Private 일정 생성 후 A로 전환하면 보이면 안 됩니다.

## 모바일 앱 (Capacitor)

기존 React 웹앱을 [Capacitor](https://capacitorjs.com)로 감싸 Android/iOS 네이티브 앱으로 빌드합니다.

- `appId`: `com.couplecalendar.app` · `webDir`: `dist` (`frontend/capacitor.config.json`)
- 네이티브 프로젝트: `frontend/android/`, `frontend/ios/` (소스만 커밋, 빌드 산출물은 무시)

### 사전 준비

- **Android**: [Android Studio](https://developer.android.com/studio) 설치 (Android SDK 포함). JDK 17/21.
- **iOS**(맥 전용): **Xcode** 설치 (맥 앱스토어). Capacitor 8은 Swift Package Manager를 쓰므로 **CocoaPods는 불필요**.

### 빌드/실행

```bash
cd frontend
npm run cap:sync      # 웹 빌드 + 네이티브로 동기화 (android/ios 모두)
npm run cap:android   # Android Studio 열기 → Run ▶
npm run cap:ios       # Xcode 열기 → 시뮬레이터 선택 → Run ▶
```

### 백엔드 연결 (에뮬레이터)

에뮬레이터에서 `localhost`는 기기 자신을 가리키므로, 호스트의 백엔드는 `http://10.0.2.2:8080/api`로 접근합니다.
빌드 시 `VITE_API_BASE_URL`을 배포된 백엔드 주소로 지정하세요. (HTTP 사용 시 cleartext 허용 필요)

### 전체 UI를 기기에서 보기 (개발)

프로덕션 빌드에서는 dev 테스트 계정/프리뷰가 숨겨집니다(운영 가드). 기기에서 전체 UI를 보려면
Capacitor 라이브 리로드로 dev 서버에 연결하세요: `capacitor.config.json`의 `server.url`을
`http://10.0.2.2:5173`로 두고 `npm run dev` 실행.

> 현 단계: Android/iOS 네이티브 프로젝트 스캐폴딩 완료. 실제 실행은 Android Studio / Xcode 설치 후 가능.
