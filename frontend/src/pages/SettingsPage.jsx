import { useEffect, useState } from "react";
import { fetchCategories, saveCategory } from "../api/categories";
import { fetchSettings, updatePreferences, updateProfile } from "../api/settings";
import CategoryEditorSheet from "../components/CategoryEditorSheet";
import { getTestCategoriesForUser } from "../dev/testCalendarData";
import {
  isDeviceCalendarAvailable,
  listDeviceCalendars,
  getSelectedCalendarIds,
  setSelectedCalendarIds,
  syncDeviceCalendar,
} from "../native/deviceCalendar";

export default function SettingsPage({
  user,
  settings,
  onBack,
  onSettingsUpdated,
  onUserUpdated,
  onRefreshCalendar,
  previewMode = false,
  devTestMode = false,
  onSwitchTestAccount,
  onResetTestData,
  onExitDevTest,
}) {
  const [categories, setCategories] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [nickname, setNickname] = useState(user.nickname || "");
  const [anniversaryDate, setAnniversaryDate] = useState(user.anniversaryDate || "");

  // 기기 캘린더 연동
  const deviceSyncSupported = isDeviceCalendarAvailable();
  const [deviceCalendars, setDeviceCalendars] = useState([]);
  const [selectedIds, setSelectedIds] = useState(getSelectedCalendarIds());
  const [deviceDefaultShared, setDeviceDefaultShared] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (!deviceSyncSupported || previewMode || devTestMode) {
      return;
    }
    listDeviceCalendars()
      .then(setDeviceCalendars)
      .catch(() => setDeviceCalendars([]));
    fetchSettings()
      .then((data) => setDeviceDefaultShared(!!data.deviceSyncDefaultShared))
      .catch(() => {});
  }, [deviceSyncSupported, previewMode, devTestMode]);

  function toggleCalendar(id) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    setSelectedCalendarIds(next);
  }

  async function handleDeviceSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      const result = await syncDeviceCalendar(from, to);
      if (result) {
        setSyncMessage(`동기화 완료 · ${result.upserted}건 반영`);
        onRefreshCalendar?.();
      } else {
        setSyncMessage("연동할 캘린더를 먼저 선택해주세요.");
      }
    } catch (error) {
      setSyncMessage("동기화 중 오류가 발생했어요.");
    } finally {
      setSyncing(false);
    }
  }

  async function loadCategories() {
    if (devTestMode) {
      setCategories(getTestCategoriesForUser(user));
      return;
    }
    const data = await fetchCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, [devTestMode, user]);

  async function handleSaveCategory(form) {
    if (previewMode || devTestMode) {
      const nextCategory = form.id ? { ...form } : { ...form, id: Date.now() };
      setCategories((prev) =>
        form.id ? prev.map((item) => (item.id === form.id ? nextCategory : item)) : [...prev, nextCategory]
      );
      setCategoryOpen(false);
      return;
    }
    await saveCategory(
      {
        name: form.name,
        colorHex: form.colorHex,
        type: form.type,
      },
      form.id
    );
    setCategoryOpen(false);
    loadCategories();
  }

  return (
    <main className="min-h-screen bg-white px-4 pb-24 pt-6">
      <section className="mx-auto w-full max-w-md space-y-5">
        <button type="button" onClick={onBack} className="text-sm text-zinc-500">
          ← 뒤로가기
        </button>

        <div className="rounded-[28px] border border-line p-5">
          <p className="text-sm font-semibold text-ink">커플 프로필 설정</p>
          <div className="mt-4 space-y-3">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 10))}
              maxLength={10}
              placeholder="내 닉네임"
              className="w-full rounded-2xl border border-line px-4 py-3"
            />
            <input
              type="date"
              value={anniversaryDate}
              className="w-full rounded-2xl border border-line px-4 py-3"
              onChange={(e) => setAnniversaryDate(e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                if (previewMode) {
                  onUserUpdated((prev) => ({ ...prev, nickname, anniversaryDate }));
                  return;
                }
                const data = await updateProfile({
                  nickname,
                  anniversaryDate: anniversaryDate || null,
                });
                onUserUpdated((prev) => ({ ...prev, nickname: data.nickname, anniversaryDate: data.anniversaryDate }));
              }}
              className="w-full rounded-2xl bg-black px-4 py-3 font-semibold text-white"
            >
              커플 프로필 저장
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-line p-5">
          <p className="text-sm font-semibold text-ink">캘린더 관리</p>
          <div className="mt-4 space-y-3">
            <button type="button" onClick={() => setCategoryOpen(true)} className="w-full rounded-2xl bg-mist px-4 py-3 text-left">
              내 카테고리 관리
            </button>
            <button
              type="button"
              onClick={onRefreshCalendar}
              className="w-full rounded-2xl bg-white px-4 py-3 text-left font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              캘린더 새로고침
            </button>
            <label className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
              <span>구글 연동 일정 표시</span>
              <input
              type="checkbox"
              checked={settings.googleVisible}
              onChange={async (e) => {
                if (previewMode) {
                  onSettingsUpdated({ ...settings, googleVisible: e.target.checked });
                  return;
                }
                const data = await updatePreferences({ googleVisible: e.target.checked });
                onSettingsUpdated(data);
              }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-[28px] border border-line p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">기기 캘린더 연동</p>
            {deviceSyncSupported ? (
              <button
                type="button"
                onClick={handleDeviceSync}
                disabled={syncing}
                className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white disabled:bg-zinc-300"
              >
                {syncing ? "동기화 중…" : "지금 동기화"}
              </button>
            ) : null}
          </div>

          {!deviceSyncSupported ? (
            <p className="mt-3 text-sm text-zinc-500">모바일 앱(iOS/Android)에서만 사용할 수 있어요.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-xs leading-5 text-zinc-500">
                폰 기본 캘린더에서 가져올 캘린더를 선택하세요. 가져온 일정은 기본적으로 나만 보이고(PRIVATE), 일정별로 공유할 수 있어요.
              </p>

              {deviceCalendars.length === 0 ? (
                <p className="text-sm text-zinc-400">캘린더가 없거나 권한이 필요해요. "지금 동기화"를 눌러 권한을 허용해주세요.</p>
              ) : (
                <div className="space-y-2">
                  {deviceCalendars.map((calendar) => (
                    <label
                      key={calendar.id}
                      className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-sm">{calendar.title}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(calendar.id)}
                        onChange={() => toggleCalendar(calendar.id)}
                      />
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
                <span className="text-sm">가져온 일정 기본 공유</span>
                <input
                  type="checkbox"
                  checked={deviceDefaultShared}
                  onChange={async (e) => {
                    setDeviceDefaultShared(e.target.checked);
                    try {
                      await updatePreferences({ deviceSyncDefaultShared: e.target.checked });
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              </label>

              {syncMessage ? <p className="text-xs text-zinc-500">{syncMessage}</p> : null}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-line p-5">
          <p className="text-sm font-semibold text-ink">앱 내부 설정</p>
          <div className="mt-4">
            <label className="flex items-center justify-between rounded-2xl bg-mist px-4 py-3">
              <span>디데이 상단 노출</span>
              <input
              type="checkbox"
              checked={settings.ddayVisible}
              onChange={async (e) => {
                if (previewMode) {
                  onSettingsUpdated({ ...settings, ddayVisible: e.target.checked });
                  return;
                }
                const data = await updatePreferences({ ddayVisible: e.target.checked });
                onSettingsUpdated(data);
              }}
              />
            </label>
          </div>
        </div>

        {devTestMode ? (
          <div className="rounded-[28px] border border-dashed border-zinc-300 p-5">
            <p className="text-sm font-semibold text-ink">개발 테스트 계정</p>
            <p className="mt-2 text-sm text-zinc-500">현재 접속 계정: {user.nickname} ({user.userId})</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => onSwitchTestAccount?.("A")}
                className="w-full rounded-2xl bg-mist px-4 py-3 text-left font-medium"
              >
                테스트 계정 A로 전환
              </button>
              <button
                type="button"
                onClick={() => onSwitchTestAccount?.("B")}
                className="w-full rounded-2xl bg-mist px-4 py-3 text-left font-medium"
              >
                테스트 계정 B로 전환
              </button>
              <button
                type="button"
                onClick={onResetTestData}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left font-medium text-zinc-700"
              >
                테스트 데이터 초기화
              </button>
              <button
                type="button"
                onClick={onExitDevTest}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left font-medium text-zinc-700"
              >
                테스트 계정 종료
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <CategoryEditorSheet
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onSubmit={handleSaveCategory}
        categories={categories}
      />
    </main>
  );
}
