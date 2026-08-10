"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getPlan } from "@/lib/plans";
import { getMockUser } from "@/lib/mockUserStore";

export function CreditDisplay() {
  const { state, hydrated, creditsRemaining } = useStore();
  const router = useRouter();

  if (!hydrated || !state.user) return null;

  // Mock 크레딧 사용
  const mockUser = getMockUser("tooissss0919@gmail.com");
  const mockCreditsRemaining = mockUser.blog_credits;
  const mockCreditsTotal = 100;
  const mockUsedCredits = mockCreditsTotal - mockCreditsRemaining;

  const plan = getPlan(state.plan);
  const usedCredits = mockUsedCredits;
  const percentUsed = mockCreditsTotal > 0 ? (usedCredits / mockCreditsTotal) * 100 : 0;
  const isLow = mockCreditsRemaining <= 10;

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            크레딧 사용 현황
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>
              {creditsRemaining}
            </span>
            <span className="text-sm font-medium text-gray-500">
              / {state.creditsTotal}
            </span>
          </div>

          {/* 진행 바 */}
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isLow ? "bg-red-500" : "bg-violet-600"
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* 현재 플랜 정보 */}
          <p className="mt-2 text-xs text-gray-600">
            현재 플랜: <span className="font-semibold">{plan.name}</span> ({plan.description})
          </p>
        </div>

        {/* 업그레이드 버튼 */}
        {isLow && (
          <button
            onClick={() => router.push("/pricing")}
            className="ml-4 whitespace-nowrap rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            업그레이드
          </button>
        )}
      </div>

      {/* 크레딧 부족 경고 */}
      {creditsRemaining === 0 && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          크레딧이 부족합니다. 요금제를 업그레이드하거나 다음 달을 기다려주세요.
        </div>
      )}
    </div>
  );
}
