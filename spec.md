# spec.md — Couple Calendar 기술 명세

> **기획 의도가 정본**, 각 규칙에 **실제 코드 근거**와 **현재 상태**를 병기한다.
> v1.0은 코드 역공학으로 "as-built"를 적었으나, v2.0은 [PRD.md](PRD.md) 의도를 기준으로 두고 2026-06-27 코드 정독으로 확인한 사실을 명시한다.
> 상태 범례: ✅ 충족 / ⚠️ 부분 / ❌ 미충족 / 🐛 버그

- **문서 버전**: 2.0
- **최종 수정**: 2026-06-27

---

## 0. 기획 의도 대비 현재 구현 — 마스터 표

| 영역 | 의도 | 상태 | 근거 |
|------|------|------|------|
| OAuth 2.0 | 실제 Kakao/Google | ✅ | `AuthService.completeOAuth`, `App.jsx:206` |
| 연동 상태 분리 | 생성 시 NULL, join 시 매핑 | ✅ | `CoupleService:29,53` |
| 구글 hidden 숨김 | 화면 제외 | ✅ | `EventService.list:58` |
| 일정 폼 헤더/알림/50·200 | 명세대로 | ✅ | `EventEditorSheet:82,173,101,192` |
| SHARED 카테고리 공용 | 커플 CRUD | ✅ | `EventService:143,171` |
| 온보딩 화면 분리 | 단계 분리 | ✅ | `OnboardingPage` |
| 초대코드 입력 라우팅 | 입력화면 도달 | 🐛 | `App.jsx:216` (G1) |
| 초대코드 검증 UX | 정규식+버튼+문구 | ✅ | `OnboardingPage:129,146,149` |
| 복사 3초 토스트 | 노출 | ✅ | `OnboardingPage:90,118` |
| 독립 설정 + D-Day 귀속 | 설정 토글 | ✅ | `SettingsPage`, `MainCalendarPage:340` |
| 시간일정 `HH:MM 제목`+4px바 | 시간 노출 | ✅ | `CalendarGrid:152,134` |
| 공휴일 빨강 | 날짜 빨강 | ✅ | `CalendarGrid` 공휴일 `#FF0000` 인라인 |
| 구글 동기화 | fetch·병합 | ⚠️ | `GoogleCalendarSyncService` (구글토큰 필요) |
| 구글 토글=가시성 | 표시 필터 | ✅ | `MainCalendarPage:153` |
| 구글 비파괴 삭제 | is_hidden | ✅ | `EventService.delete:117` |
| 공유 삭제 확인 | 팝업 | ✅ | `EventService.delete:126` |
| 푸시 분기 | 실제 발송 | 🟡 | `PushSender` 추상화+토큰 발송, FCM 미연동 (G3) |
| 알림 스케줄 | 발송 | ✅ | `AlertSchedulerService` 매분 (G4) |
| 프리뷰 제거 | 비범위 | ❌ | `OnboardingPage:32` 잔존 (G5) |

## 1. 시스템 구성

| 영역 | 스택 | 위치 |
|------|------|------|
| Frontend | React 18, Vite 5, TailwindCSS 3, Axios | `frontend/` |
| Backend | Spring Boot 3.3.1, Spring Security, Spring Data JPA, JJWT 0.12 | `backend/` |
| DB | MySQL 8.4 (utf8mb4, TZ Asia/Seoul) | `docker-compose.yml` |
| 외부 | Google OAuth2 + Calendar API(읽기), Kakao OAuth2 | — |
| 빌드 | Java 17, Maven | `backend/pom.xml` |

통신: SPA ↔ REST(JWT Bearer). 커플 연동 실시간 알림은 SSE.

## 2. 모듈 구조

**Backend** (`com.couplecalendar`) — 도메인별 패키지(`Controller/Service/Repository/Dtos/Entity`):
`auth`(OAuth·JWT) / `couple`(초대·연동·SSE) / `event`(일정·동기화·푸시) / `category` / `user` / `profile`(설정 API) / `common` / `config`.

**Frontend** (`frontend/src`):
- `pages/`: `OnboardingPage`, `ProfileSetupPage`, `MainCalendarPage`, `SettingsPage`
- `components/`: `CalendarGrid`, `EventEditorSheet`, `EventListSheet`, `BottomSheet`, `SelectionSheet`, `CategoryEditorSheet`, `ColorChipPicker`, `MonthSelectorCarousel`, `EventSearchModal`, `MonthPickerSheet`
- `api/`: `client`, `auth`, `couples`, `events`, `categories`, `settings`
- `utils/`: `eventVisibility`, `calendarSegments`, `date`, `constants` (+ `*.test.js`)
- `dev/`: `testCalendarData` (⚠️ 기획 비범위 — G5)

라우팅은 React Router가 아니라 `App.jsx`의 `stage` 상태머신:
`loading → login → link-choice → invite-create / invite-join → profile → main / settings`.
**🐛 주의(G1)**: `invite-join` 단계로 전이하는 `setStage` 호출이 없어 `InviteJoinScreen`이 도달 불가. `link-choice`의 "초대코드 입력하기"가 `onJoinInvite`(→profile)로 잘못 연결됨([App.jsx:216](frontend/src/App.jsx#L216)).

## 3. 데이터 모델

모든 엔티티는 `BaseTimeEntity`(createdAt/updatedAt) 상속.

### users (`User`)
id(PK) / email(NN,UQ) / nickname(NN,≤10) / provider(enum GOOGLE,KAKAO) / **couple_id(FK, nullable — 연동 전 NULL)** / deviceToken / setting(1:1).

### couples (`Couple`)
id(PK) / inviteCode(NN,UQ,8) / ownerUserId(NN) / anniversaryDate(LocalDate) / **status(PENDING→LINKED)** / linkedAt.

### events (`Event`)
id / title(NN,≤50) / content(≤200) / allDay / startAt / endAt(NN) / category_id(FK,NN) / owner_id(FK,NN) / **hidden(마스킹)** / sourceType(enum LOCAL,GOOGLE,GOOGLE_HOLIDAY) / alertOption(enum NONE,AT_TIME,TEN_MINUTES_BEFORE,ONE_HOUR_BEFORE,ONE_DAY_BEFORE) / externalEventId / externalCalendarId.

### category (`Category`)
id / name(≤30) / colorHex(7) / type(enum PRIVATE,SHARED) / user_id(FK,NN 소유자).

### user_settings (`UserSetting`)
googleVisible(기본 true) / ddayVisible(기본 true) / profileCompleted(기본 false).

### oauth_account (`OAuthAccount`)
provider별 accessToken / refreshToken / expiresAt / scope. 구글 동기화에 사용.

## 4. 인증 / 인가

### OAuth 흐름 (✅ 실제 연동)
1. `GET /auth/oauth/{provider}/authorize-url?redirectUri` → provider 인가 URL.
2. 프론트가 `window.location.href`로 리다이렉트, provider 로그인 후 `code` 수신.
3. `POST /auth/oauth/{provider}/callback`(code, redirectUri, deviceToken?) → 토큰 교환 → 프로필 조회 → email로 User upsert → **JWT 발급**.
4. 이후 `Authorization: Bearer <jwt>`.

> ⚠️ 더미 로그인은 **정식 로그인이 아니라** 프리뷰/dev 테스트 계정 경로(G5)에만 존재. 정식 OAuth는 실제 토큰 교환을 한다.

### JWT
- `JwtTokenProvider`: subject=userId, 만료 `app.jwt.access-token-minutes`(기본 720분).
- `JwtAuthenticationFilter`: `Authorization: Bearer` **또는** `?token=`(SSE EventSource용)에서 해석.

### Security (`SecurityConfig`)
Stateless, CSRF off, CORS(`localhost:5173`). `permitAll`: `/api/auth/**`, `GET /api/health`. 그 외 authenticated.

### onboardingStage (`AuthService.toAuthResponse`)
`couple==null → LINK` / `!profileCompleted → PROFILE` / else `MAIN`.

## 5. 도메인 규칙 (★ 핵심)

### 5.1 가시성 — `EventService.isVisibleToUser` (R4) ✅
`보임 ⟺ event.owner==user OR 같은 couple`. 목록 조회 시 추가로 `!event.hidden` 필터([EventService.java:58](backend/src/main/java/com/couplecalendar/event/EventService.java#L58)) → **hidden 구글 일정 정상 제외**.

### 5.2 수정/삭제 권한 — `EventService.canMutateEvent` (R5) ✅
`가능 ⟺ event.owner==user OR (category.type==SHARED AND 같은 커플)`. → PRIVATE는 작성자만, **SHARED는 커플 양쪽**.

### 5.3 삭제 분기 — `EventService.delete` (R6,R7) ✅
| 조건 | 결과 |
|------|------|
| sourceType ∈ {GOOGLE, GOOGLE_HOLIDAY} | `hide()`, deleted=true |
| 남의 SHARED & confirmed=false | 보류, confirmRequired=true + "[작성자]님이 등록한 공유 일정입니다. 함께 삭제하시겠습니까?" |
| 그 외 | 실제 삭제 |

프론트: `confirmRequired`면 `window.confirm` 후 `deleteEvent(id, true)` 재호출([MainCalendarPage.jsx:229](frontend/src/pages/MainCalendarPage.jsx#L229)).

### 5.4 카테고리 접근 (R4) ✅
`CategoryRepository.findAccessibleCategories`: `c.user==me OR (c.type==SHARED AND 같은 couple)`. 이벤트 생성/수정 시 `loadAccessibleCategory`가 동일 규칙 적용 → **상대의 SHARED 카테고리로 일정 작성 가능**. 단 카테고리 **정의 수정**은 소유자만(`CategoryService.update`).

### 5.5 커플 연동 — `CoupleService` (R1,R2,R3) ✅
- `createInviteCode`: Couple(status=PENDING, ownerUserId) 생성, **생성자 user.couple은 NULL 유지**.
- `joinByCode`: 코드없음 404 / `status!=PENDING` 409 / 자기코드 400 / 한쪽이라도 커플보유 409. 성공 시 **양쪽 user.couple 동시 set + markLinked() + 양쪽 SSE `LINKED`**.

## 6. API 명세

기준 `…:8080/api`. 별도 표기 없으면 JWT 필요.

### Auth
| 메서드 | 경로 | 비고 |
|--------|------|------|
| GET | `/auth/oauth/{provider}/authorize-url?redirectUri` | public |
| POST | `/auth/oauth/{provider}/callback` | public, body `{code, redirectUri, deviceToken?}` |
| GET | `/auth/me` | `AuthResponse` |

### Couples
| 메서드 | 경로 | 비고 |
|--------|------|------|
| POST | `/couples/invite-code` | `{inviteCode, status, coupleId}` |
| POST | `/couples/join` | `{inviteCode}` (`^[A-Z0-9]{8}$`) |
| PATCH | `/couples/profile` | `{nickname?, anniversaryDate?}` |
| GET | `/couples/stream?token=<jwt>` | SSE |

### Events
| 메서드 | 경로 | 비고 |
|--------|------|------|
| GET | `/events?monthStart&monthEnd&syncGoogle=false` | `CalendarResponse{events[], googleVisible, holidayDates[]}` |
| POST | `/events` | `EventRequest` |
| PUT | `/events/{id}` | `EventRequest` |
| DELETE | `/events/{id}?confirmSharedDelete=false` | `DeleteDecisionResponse` |

`EventRequest`: `{ title(≤50,NotBlank), content?(≤200), allDay, startDate(NotNull), startTime?, endDate(NotNull), endTime?, categoryId(NotNull), alertOption(NotNull) }`. allDay=true면 0시, startTime 없으면 09:00.

### Categories / Settings
| 메서드 | 경로 | 비고 |
|--------|------|------|
| GET/POST/PUT | `/categories[/{id}]` | 접근 가능 분만 / PUT은 소유자만 |
| GET | `/settings` | `SettingsResponse` |
| PATCH | `/settings/profile` | `{nickname?, anniversaryDate?}` → profileCompleted=true |
| PATCH | `/settings/preferences` | `{googleVisible?, ddayVisible?}` |

에러: `ApiException(status,message)` → `GlobalExceptionHandler`. 권한 403 / 미존재 404 / 충돌 409 / 검증 400.

## 7. 실시간 동기화 (SSE) ✅

`CoupleLinkSseService`: `ConcurrentHashMap<userId, SseEmitter>`, 타임아웃 30분. 연결 `GET /couples/stream?token=<jwt>`. 커플 성립 시 양쪽에 `event: LINKED`, data `{status, coupleId}`. 프론트는 invite-create 단계에서 구독 → 수신 시 `fetchMe()` 후 profile로 전환([App.jsx:187](frontend/src/App.jsx#L187)).

## 8. Google Calendar 동기화 — `GoogleCalendarSyncService` ⚠️

- 트리거: `GET /events?...&syncGoogle=true`. **메인 진입 시 `loadCalendar(baseDate, true)`로 자동 동기화**([MainCalendarPage.jsx:149](frontend/src/pages/MainCalendarPage.jsx#L149)).
- 대상: `primary`(→GOOGLE, "Google 일정" PRIVATE), 한국 공휴일(`ko.south_korea#holiday@…` →GOOGLE_HOLIDAY, "대한민국 공휴일" SHARED).
- 토큰: `OAuthAccount` accessToken, 만료 임박 시 refreshToken 갱신(`ensureAccessToken`).
- upsert 키 `(owner, sourceType, externalEventId)`, `cancelled` 스킵.
- 읽기 전용(scope `calendar.readonly`) → 삭제는 로컬 `hidden` 마스킹(§5.3).
- **⚠️ 제약(G2)**: 구글 OAuth 토큰이 없으면(예: 카카오 단독 로그인) `syncMonth`가 BAD_REQUEST throw. 구글 미연동 사용자 대응 분기 필요.

## 8.5 알림 / 푸시 (R12)

**수신자 분기** — `PushNotificationService.recipientsFor`: PRIVATE → 작성자 본인, SHARED → 커플 2인. 각 수신자의 `deviceToken`으로 발송, 토큰 없으면 스킵.

**발송 추상화(G3)** — `PushSender` 인터페이스. 기본 구현 `LoggingPushSender`(로그 출력)는 `app.push.provider=log`(기본, `matchIfMissing`)일 때 활성. 실제 FCM/APNS는 동일 인터페이스를 구현한 빈을 추가하고 `app.push.provider`를 전환하면 호출부 변경 없이 동작. (현재 Firebase 프로비저닝·프론트 토큰 SDK 부재로 실발송은 미완.)

**알림 스케줄러(G4)** — `AlertSchedulerService.dispatchDueAlerts` `@Scheduled(fixedRate=60_000)`:
- 후보 조회: `alertOption != NONE AND alertSent = false AND startAt ∈ [now-1d, now+2d]`.
- 트리거 시각 = `AlertOption.triggerTimeFrom(startAt)` (AT_TIME=시작, 10분/1시간/1일 전).
- `triggerAt ≤ now` 이면 발송 후 `markAlertSent()` (멱등). `triggerAt < now-5분`(놓침)은 발송 없이 해제.
- `Event.alertSent`는 일정 수정 시 `false`로 재무장(`Event.update`).
- `@EnableScheduling`은 `CoupleCalendarApplication`에 선언.

## 9. UI / 렌더링 규칙 (코드 확인됨)

- 모바일 웹, 메인 달력 순백 배경(`bg-white`).
- **12색 파스텔 팔레트** 고정([constants.js](frontend/src/utils/constants.js)):
  `#FBCFE8 #FED7AA #FDE68A #D9F99D #BBF7D0 #A7F3D0 #A5F3FC #BFDBFE #C7D2FE #DDD6FE #F5D0FE #E5E7EB`
- **종일 일정**: 카테고리 컬러 블록([CalendarGrid.jsx:119](frontend/src/components/CalendarGrid.jsx#L119)).
- **시간 일정**: 투명 배경 + 4px(`w-1`) 세로 컬러바 + `startAt.slice(11,16)` 시작시간 + 제목([CalendarGrid.jsx:134](frontend/src/components/CalendarGrid.jsx#L134)). 구글 출처는 바 색 `#9CA3AF`(실버).
- **공휴일/일요일**: 날짜 숫자 `text-red-500`, 토요일 `text-blue-500`([CalendarGrid.jsx:95](frontend/src/components/CalendarGrid.jsx#L95)). ⚠️ 명세는 `#FF0000`(G6).
- **일정 폼**(`EventEditorSheet`): 전체화면 오버레이, 상단 헤더 ✕/타이틀/저장, 알림 셀렉트(5종), 제목 maxLength 50·메모 200, 종일 토글 시 시간 피커 조건부 렌더.
- **D-Day**: `settings.ddayVisible`일 때만 상단 노출([MainCalendarPage.jsx:340](frontend/src/pages/MainCalendarPage.jsx#L340)), 토글은 `SettingsPage` 앱 내부 설정.
- **설정 화면**(`SettingsPage`): 커플 프로필 / 캘린더 관리(카테고리·새로고침·구글 토글) / 앱 내부 설정(D-Day). 카테고리 편집은 여기서만 진입.

## 10. 로컬 실행 / 환경

### 환경변수(`.env.example`)
`GOOGLE_CLIENT_ID/SECRET`, `KAKAO_CLIENT_ID/SECRET`, `VITE_API_BASE_URL`(기본 `http://localhost:8080/api`).

### 실행
```bash
docker compose up -d                       # MySQL :3306
cd backend && mvn spring-boot:run          # API :8080
cd frontend && npm install && npm run dev  # SPA :5173
```

### OAuth Redirect URI (provider 콘솔 등록 필수)
- Google: `http://localhost:5173/oauth/callback?provider=GOOGLE`
- Kakao: `http://localhost:5173/oauth/callback?provider=KAKAO`

### 설정 주의(`application.yml`)
JPA `ddl-auto: update`, `open-in-view: false`. 시크릿은 환경변수로 외부화됨: `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`(미설정 시 로컬 개발용 기본값). **운영에서는 `JWT_SECRET`을 반드시 주입**할 것.

## 11. 테스트

- 프론트 단위: `npm test`(`node --test src/utils/*.test.js`) — `eventVisibility.test.js`(§5.1), `calendarSegments.test.js`.
- 개발용 테스트 계정(`dev/testCalendarData.js`): A/B 같은 그룹, 공유/개인 가시성 수동 검증. ⚠️ 기획 비범위(G5).
- **백엔드 단위 테스트(15개, Mockito)**: `mvn test`.
  - `EventServiceTest` — 가시성/권한/삭제 분기/카테고리 접근(§5.1~5.4).
  - `CoupleServiceTest` — 연동 상태 머신(§5.5: 생성 시 미연동, 자가/중복 거부, 성공 시 양쪽 연동+SSE).
  - `AlertOptionTest` / `AlertSchedulerServiceTest` — 트리거 시각 계산 + 도래/미래/놓침 분기(§8.5).
  - ⚠️ **JDK 주의**: Spring Boot 3.3 번들 Mockito/ByteBuddy는 Java 26 미지원. 테스트는 **JDK 17 또는 21**로 실행할 것
    (`JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test`). 컴파일 타깃은 Java 17.

## 12. 알려진 갭 / 버그 (PRD §7과 동기)

| ID | 내용 | 상태 |
|----|------|------|
| ~~G1~~ | 초대코드 입력 화면 라우팅 | ✅ 수정 — `App.jsx` `onGoToJoin`→`invite-join`, `OnboardingPage` LinkChoice 연결 |
| ~~G2~~ | 카카오 단독 로그인 시 구글 동기화 throw | ✅ 수정 — `GoogleCalendarSyncService.syncMonth` 미연동 시 no-op |
| ~~G3~~ | 푸시가 로그만 출력 | 🟡 부분 — `PushSender`/`LoggingPushSender` 추상화 + 토큰 발송 배선. 실제 FCM은 Firebase 프로비저닝 필요 |
| ~~G4~~ | 알림 스케줄러 부재 | ✅ 수정 — `AlertSchedulerService`(@Scheduled 60s) + `Event.alertSent` 멱등 + `AlertOption.triggerTimeFrom` |
| ~~G5~~ | 프리뷰 모드 운영 노출 | ✅ 수정 — "둘러보기"를 `DEV_TEST_ENABLED` 가드 |
| ~~G6~~ | 공휴일 빨강 `#FF0000` 아님 | ✅ 수정 — `CalendarGrid` 공휴일 `#FF0000` 인라인 |
| — | `EventService.create`가 `userRepository.findAll()` 사용(비효율) | 미해결 — `EventService.java:86` |
| ~~—~~ | JWT secret/DB pw 평문 | ✅ 수정 — `JWT_SECRET`/`DB_*` 환경변수로 외부화 |
