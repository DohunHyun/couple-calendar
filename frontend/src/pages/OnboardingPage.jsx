import { useEffect, useMemo, useState } from "react";
import { joinCouple } from "../api/couples";
import { PROVIDERS } from "../utils/constants";
import { cleanInviteCode, formatInviteCode } from "../utils/date";

function OAuthLoginScreen({ onStartOAuth, onStartTestAccount, devTestEnabled = false }) {
  return (
    <main className="flex min-h-screen flex-col bg-white px-6 py-10">
      <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-between">
        <div className="animate-fadeUp">
          <p className="mb-3 text-sm uppercase tracking-[0.28em] text-zinc-400">Couple Calendar</p>
          <h1 className="text-4xl font-semibold leading-tight text-ink">
            둘만의 일정을
            <br />
            가볍게 맞춥니다.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500">카카오 또는 구글로 시작하세요.</p>
        </div>
        <div className="space-y-3">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.key}
              type="button"
              onClick={() => onStartOAuth(provider.key)}
              className={`w-full rounded-2xl px-4 py-4 text-base font-semibold ${provider.className}`}
            >
              {provider.label}
            </button>
          ))}
          {devTestEnabled ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-preview-mode"))}
              className="w-full rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white"
            >
              가입 없이 둘러보기
            </button>
          ) : null}
          {devTestEnabled ? (
            <div className="rounded-[28px] border border-line bg-[#FAFAFB] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Dev Test Accounts</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => onStartTestAccount("A")}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800"
                >
                  테스트 계정 A로 접속
                </button>
                <button
                  type="button"
                  onClick={() => onStartTestAccount("B")}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800"
                >
                  테스트 계정 B로 접속
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function LinkChoiceScreen({ onCreate, onJoin }) {
  return (
    <main className="flex min-h-screen items-center bg-white px-6">
      <section className="mx-auto w-full max-w-sm rounded-[32px] border border-line p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">연동 시작</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight">반가워요! 우리만의 달력을 시작해볼까요?</h2>
        <div className="mt-8 space-y-3">
          <button type="button" onClick={onCreate} className="w-full rounded-2xl bg-black px-4 py-4 font-semibold text-white">
            새로운 초대코드 만들기
          </button>
          <button type="button" onClick={onJoin} className="w-full rounded-2xl bg-mist px-4 py-4 font-semibold text-zinc-700">
            초대코드 입력하기
          </button>
        </div>
      </section>
    </main>
  );
}

function InviteCreateScreen({ inviteCode, onBack }) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) {
      return undefined;
    }
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <main className="flex min-h-screen bg-white px-6 py-10">
      <section className="mx-auto w-full max-w-sm">
        <button type="button" onClick={onBack} className="mb-6 text-sm text-zinc-500">
          ← 뒤로
        </button>
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">초대코드 발급</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight">이 코드를 복사해서 상대방에게 보내세요!</h2>
        <div className="mt-8 rounded-[32px] bg-mist px-6 py-8 text-center">
          <p className="text-xs text-zinc-500">상대방 연동을 실시간으로 기다리는 중</p>
          <p className="mt-3 text-3xl font-semibold tracking-[0.28em]">{inviteCode || "........"}</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(inviteCode || "");
              setShowToast(true);
            }}
            className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            코드 복사
          </button>
        </div>
        {showToast ? (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm text-white">
            코드가 복사되었습니다.
          </div>
        ) : null}
      </section>
    </main>
  );
}

function InviteJoinScreen({ onSubmit, onBack }) {
  const [inviteCode, setInviteCode] = useState("");
  const normalized = cleanInviteCode(inviteCode);
  const isValid = useMemo(() => /^[A-Za-z0-9]{8}$/.test(normalized), [normalized]);

  return (
    <main className="flex min-h-screen bg-white px-6 py-10">
      <section className="mx-auto w-full max-w-sm">
        <button type="button" onClick={onBack} className="mb-6 text-sm text-zinc-500">
          ← 뒤로
        </button>
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">초대코드 입력</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight">전송받은 초대코드를 입력해주세요.</h2>
        <div className="mt-8 space-y-3">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(formatInviteCode(e.target.value))}
            placeholder="ABCD-EFGH"
            className="w-full rounded-2xl border border-line px-4 py-4 text-center text-xl tracking-[0.24em]"
          />
          {!isValid ? <p className="text-sm text-red-500">올바른 8자리 초대코드를 입력해주세요.</p> : null}
          <button
            type="button"
            disabled={!isValid}
            onClick={() => onSubmit(normalized)}
            className="w-full rounded-2xl bg-black px-4 py-4 font-semibold text-white disabled:bg-zinc-200"
          >
            연동하기
          </button>
        </div>
      </section>
    </main>
  );
}

export default function OnboardingPage({
  screen,
  inviteCode,
  devTestEnabled = false,
  onStartOAuth,
  onStartTestAccount,
  onCreateInvite,
  onGoToJoin,
  onJoinInvite,
  onBackToChoice,
}) {
  if (screen === "link-choice") {
    return <LinkChoiceScreen onCreate={onCreateInvite} onJoin={onGoToJoin} />;
  }

  if (screen === "invite-create") {
    return <InviteCreateScreen inviteCode={inviteCode} onBack={onBackToChoice} />;
  }

  if (screen === "invite-join") {
    return <InviteJoinScreen onSubmit={async (code) => joinCouple(code).then(onJoinInvite)} onBack={onBackToChoice} />;
  }

  return <OAuthLoginScreen onStartOAuth={onStartOAuth} onStartTestAccount={onStartTestAccount} devTestEnabled={devTestEnabled} />;
}
