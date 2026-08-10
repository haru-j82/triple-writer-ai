"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getPlan } from "@/lib/plans";

export default function ProfilePage() {
  const { state, hydrated, creditsRemaining } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.user) router.push("/login");
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  const plan = getPlan(state.plan);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">프로필</h1>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-lg font-bold">{state.user.name}</p>
        <p className="text-sm text-gray-500">{state.user.email}</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">현재 플랜</p>
            <p className="mt-1 font-semibold">
              {plan.id}{" "}
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
                업그레이드
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">남은 사용 횟수</p>
            <p className="mt-1 font-semibold">{creditsRemaining}회</p>
            <p className="text-[11px] text-gray-400">
              구독 {state.planCreditsRemaining} | 보너스 {state.bonusCreditsRemaining}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">계정 정보</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-400">이메일</dt>
            <dd>{state.user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <dt className="text-gray-400">로그인 방식</dt>
            <dd>Google</dd>
          </div>
          <div className="flex justify-between pb-2">
            <dt className="text-gray-400">가입일</dt>
            <dd>{new Date(state.user.joinedAt).toLocaleDateString("ko-KR")}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">결제 내역</h2>
        {state.billingLog.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">아직 결제 내역이 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {state.billingLog.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p>{b.planName} 플랜</p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.date).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="font-semibold">₩{b.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">사용 내역</h2>
        {state.usageLog.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">사용 내역이 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {state.usageLog.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm">{log.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.date).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    log.amount > 0 ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {log.amount > 0 ? `+${log.amount}` : log.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
