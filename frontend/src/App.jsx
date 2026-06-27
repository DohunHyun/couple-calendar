import { useEffect, useMemo, useRef, useState } from "react";
import { completeOAuth, fetchMe, getAuthorizeUrl } from "./api/auth";
import { createInviteCode } from "./api/couples";
import { openCoupleStream } from "./api/couples";
import {
  DEV_TEST_ENABLED,
  buildTestSession,
  clearDevTestSession,
  ensureTestEvents,
  loadDevTestSession,
  resetTestEvents,
  saveDevTestSession,
} from "./dev/testCalendarData";
import MainCalendarPage from "./pages/MainCalendarPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import SettingsPage from "./pages/SettingsPage";
import { initPushNotifications } from "./native/push";

function deriveStage(session) {
  if (!session) {
    return "login";
  }
  if (session.onboardingStage === "LINK") {
    return "link-choice";
  }
  if (session.onboardingStage === "PROFILE") {
    return "profile";
  }
  return "main";
}

export default function App() {
  const [session, setSession] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [devTestMode, setDevTestMode] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [settings, setSettings] = useState({
    googleVisible: true,
    ddayVisible: true,
    profileCompleted: false,
  });
  const [stage, setStage] = useState("loading");
  const [inviteCode, setInviteCode] = useState("");
  const streamRef = useRef(null);

  const callbackInfo = useMemo(() => {
    if (window.location.pathname !== "/oauth/callback") {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return {
      provider: params.get("provider"),
      code: params.get("code"),
    };
  }, []);

  async function bootstrap() {
    if (DEV_TEST_ENABLED) {
      const testSession = loadDevTestSession();
      if (testSession) {
        setDevTestMode(true);
        setPreviewMode(false);
        setSession(testSession);
        setSettings({
          googleVisible: true,
          ddayVisible: true,
          profileCompleted: true,
        });
        setStage("main");
        return;
      }
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStage("login");
      return;
    }
    const me = await fetchMe();
    setSession({
      userId: me.userId,
      email: me.email,
      nickname: me.nickname,
      provider: me.provider,
      coupleId: me.coupleId,
      anniversaryDate: me.anniversaryDate,
    });
    setSettings({
      googleVisible: me.googleVisible,
      ddayVisible: me.ddayVisible,
      profileCompleted: me.profileCompleted,
    });
    setStage(deriveStage(me));
  }

  useEffect(() => {
    const handler = () => {
      setPreviewMode(true);
      setDevTestMode(false);
      clearDevTestSession();
      setSession({
        userId: 999,
        email: "preview@local",
        nickname: "도훈",
        provider: "PREVIEW",
        coupleId: 1,
        anniversaryDate: "2025-08-10",
        partnerNickname: "나현",
      });
      setSettings({
        googleVisible: true,
        ddayVisible: true,
        profileCompleted: true,
      });
      setStage("main");
    };
    window.addEventListener("open-preview-mode", handler);
    return () => window.removeEventListener("open-preview-mode", handler);
  }, []);

  function openDevTestAccount(userKey) {
    const testSession = buildTestSession(userKey);
    if (!testSession) {
      return;
    }
    localStorage.removeItem("accessToken");
    saveDevTestSession(userKey);
    ensureTestEvents();
    setPreviewMode(false);
    setDevTestMode(true);
    setSession(testSession);
    setSettings({
      googleVisible: true,
      ddayVisible: true,
      profileCompleted: true,
    });
    setStage("main");
  }

  useEffect(() => {
    if (callbackInfo?.provider && callbackInfo?.code) {
      const redirectUri = `${window.location.origin}/oauth/callback?provider=${callbackInfo.provider}`;
      completeOAuth(callbackInfo.provider, {
        code: callbackInfo.code,
        redirectUri,
      })
        .then((auth) => {
          localStorage.setItem("accessToken", auth.accessToken);
          setSession({
            userId: auth.userId,
            email: auth.email,
            nickname: auth.nickname,
            provider: auth.provider,
            coupleId: auth.coupleId,
            anniversaryDate: auth.anniversaryDate,
          });
          setSettings({
            googleVisible: auth.googleVisible,
            ddayVisible: auth.ddayVisible,
            profileCompleted: auth.profileCompleted,
          });
          window.history.replaceState({}, "", "/");
          setStage(deriveStage(auth));
        })
        .catch(() => {
          window.history.replaceState({}, "", "/");
          setStage("login");
        });
      return;
    }
    bootstrap().catch(() => {
      localStorage.removeItem("accessToken");
      setStage("login");
    });
  }, []);

  useEffect(() => {
    if (stage !== "invite-create" || !inviteCode) {
      streamRef.current?.close();
      return undefined;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return undefined;
    }
    streamRef.current?.close();
    streamRef.current = openCoupleStream(token, async () => {
      const me = await fetchMe();
      setSession((prev) => ({ ...prev, coupleId: me.coupleId, anniversaryDate: me.anniversaryDate }));
      setStage("profile");
    });
    return () => streamRef.current?.close();
  }, [stage, inviteCode]);

  useEffect(() => {
    if (previewMode || devTestMode) {
      return;
    }
    if (!localStorage.getItem("accessToken")) {
      return;
    }
    // 네이티브 앱에서만 실제로 동작(웹은 no-op). 로그인된 세션에서 디바이스 토큰을 등록.
    initPushNotifications();
  }, [session?.userId, previewMode, devTestMode]);

  if (stage === "loading") {
    return <main className="min-h-screen bg-white" />;
  }

  if (stage === "login" || stage === "link-choice" || stage === "invite-create" || stage === "invite-join") {
    return (
      <OnboardingPage
        screen={stage}
        inviteCode={inviteCode}
        devTestEnabled={DEV_TEST_ENABLED}
        onStartOAuth={async (provider) => {
          const redirectUri = `${window.location.origin}/oauth/callback?provider=${provider}`;
          const response = await getAuthorizeUrl(provider, redirectUri);
          window.location.href = response.authorizeUrl;
        }}
        onStartTestAccount={openDevTestAccount}
        onCreateInvite={async () => {
          const response = await createInviteCode();
          setInviteCode(response.inviteCode);
          setStage("invite-create");
        }}
        onGoToJoin={() => setStage("invite-join")}
        onJoinInvite={async () => {
          const me = await fetchMe();
          setSession((prev) => ({ ...prev, coupleId: me.coupleId, anniversaryDate: me.anniversaryDate }));
          setStage("profile");
        }}
        onBackToChoice={() => setStage("link-choice")}
      />
    );
  }

  if (stage === "profile") {
    return (
      <ProfileSetupPage
        currentUser={session}
        onCompleted={(profile) => {
          setSession((prev) => ({ ...prev, nickname: profile.nickname, anniversaryDate: profile.anniversaryDate }));
          setSettings((prev) => ({ ...prev, profileCompleted: true }));
          setStage("main");
        }}
      />
    );
  }

  if (stage === "settings") {
    return (
      <SettingsPage
        user={session}
        settings={settings}
        previewMode={previewMode}
        devTestMode={devTestMode}
        onBack={() => setStage("main")}
        onRefreshCalendar={() => {
          setRefreshSeed((prev) => prev + 1);
          setStage("main");
        }}
        onSwitchTestAccount={(userKey) => {
          openDevTestAccount(userKey);
          setStage("settings");
        }}
        onResetTestData={() => {
          resetTestEvents();
          setRefreshSeed((prev) => prev + 1);
        }}
        onExitDevTest={() => {
          clearDevTestSession();
          setDevTestMode(false);
          setSession(null);
          setStage("login");
        }}
        onSettingsUpdated={(data) =>
          setSettings({
            googleVisible: data.googleVisible,
            ddayVisible: data.ddayVisible,
            profileCompleted: data.profileCompleted,
          })
        }
        onUserUpdated={(updater) => setSession((prev) => updater(prev))}
      />
    );
  }

  return (
    <MainCalendarPage
      user={session}
      settings={settings}
      previewMode={previewMode}
      devTestMode={devTestMode}
      refreshSeed={refreshSeed}
      onOpenSettings={() => setStage("settings")}
    />
  );
}
