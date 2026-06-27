import { useState } from "react";
import { updateProfile } from "../api/settings";

export default function ProfileSetupPage({ currentUser, onCompleted }) {
  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [anniversaryDate, setAnniversaryDate] = useState(currentUser?.anniversaryDate || "");

  async function submit(skip) {
    const response = await updateProfile({
      nickname: skip ? currentUser?.nickname : nickname,
      anniversaryDate: skip ? null : anniversaryDate || null,
    });
    onCompleted(response);
  }

  return (
    <main className="flex min-h-screen items-center bg-white px-6">
      <section className="mx-auto w-full max-w-sm rounded-[32px] border border-line p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">커플 연동 완료</p>
        <h2 className="mt-2 text-3xl font-semibold">마지막 한 단계</h2>
        <div className="mt-6 space-y-4">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 10))}
            className="w-full rounded-2xl border border-line px-4 py-3"
            placeholder="내 닉네임"
          />
          <input
            type="date"
            value={anniversaryDate}
            onChange={(e) => setAnniversaryDate(e.target.value)}
            className="w-full rounded-2xl border border-line px-4 py-3"
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => submit(false)} className="flex-1 rounded-2xl bg-black px-4 py-3 text-white">
            시작하기
          </button>
          <button type="button" onClick={() => submit(true)} className="rounded-2xl bg-mist px-4 py-3 text-zinc-700">
            건너뛰기
          </button>
        </div>
      </section>
    </main>
  );
}
