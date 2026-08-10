"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { CreditDisplay } from "@/components/CreditDisplay";
import Link from "next/link";

export default function SettingsPage() {
  const { state, hydrated, logout, changePlan } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.user) router.push("/login");
  }, [hydrated, state.user, router]);

  if (!hydrated || !state.user) return null;

  const currentPlan = PLANS.find((p) => p.id === state.plan) || PLANS[0];
  const monthlyUsed = state.creditsTotal - (state.planCreditsRemaining + state.bonusCreditsRemaining);
  const monthlyRate = state.creditsTotal > 0 ? (monthlyUsed / state.creditsTotal) * 100 : 0;

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      logout();
      router.push("/");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">설정</h1>

      {/* 프로필 섹션 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">프로필</h2>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">이름</p>
            <p className="mt-1 text-sm text-gray-900">{state.user.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">이메일</p>
            <p className="mt-1 text-sm text-gray-900">{state.user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">가입일</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(state.user.joinedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          로그아웃
        </button>
      </div>

      {/* 크레딧 현황 */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">크레딧 현황</h2>
        <CreditDisplay />
      </div>

      {/* 크레딧 사용 분석 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">사용 현황 분석</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              플랜 크레딧
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-900">
              {state.planCreditsRemaining}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              {state.creditsTotal}중 {monthlyUsed}개 사용 ({monthlyRate.toFixed(0)}%)
            </p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              보너스 크레딧
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-900">
              {state.bonusCreditsRemaining}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              특별 이벤트나 가입 시 지급
            </p>
          </div>
        </div>
      </div>

      {/* 현재 요금제 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">현재 요금제</h2>
        <div className="mt-4">
          <div className="flex items-start justify-between rounded-lg bg-violet-50 p-4">
            <div>
              <h3 className="font-semibold text-violet-900">{currentPlan.name}</h3>
              <p className="mt-1 text-sm text-violet-700">{currentPlan.description}</p>
              <ul className="mt-3 space-y-1 text-xs text-violet-700">
                <li>월 {currentPlan.monthlyCredits}회 사용 가능</li>
                <li>
                  대량생성: 회당 {currentPlan.bulkPostsPerCredit}개 글 생성
                </li>
                <li>3개월간 데이터 저장</li>
              </ul>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500">월 요금</p>
              <p className="mt-1 text-2xl font-bold text-violet-900">
                ₩{currentPlan.priceMonthly.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-violet-600">
                {currentPlan.priceMonthly === 0 ? "(무료)" : "/월"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 요금제 변경 */}
      {state.plan !== "enterprise" && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">요금제 업그레이드</h2>
          <p className="mt-2 text-sm text-gray-600">
            더 많은 크레딧이 필요하신가요? 상위 요금제로 업그레이드하세요.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLANS.filter((p) => p.id !== state.plan).map((plan) => (
              <button
                key={plan.id}
                onClick={() => {
                  changePlan(plan.id);
                  alert(
                    `${plan.name} 플랜으로 업그레이드되었습니다. ${plan.monthlyCredits}개의 크레딧이 추가되었습니다.`
                  );
                }}
                className="rounded-lg border-2 border-gray-200 p-4 text-left transition hover:border-violet-600 hover:bg-violet-50"
              >
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                <p className="mt-1 text-sm font-bold text-violet-600">
                  ₩{plan.priceMonthly.toLocaleString()}/월
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  +{plan.monthlyCredits} 크레딧
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 환불 정책 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">환불 정책</h2>
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <p>
            이 프로젝트는 <strong>데모 버전</strong>으로, 실제 결제가 이루어지지 않습니다.
          </p>
          <p>
            <strong>실제 서비스 전환 시</strong>, 다음 환불 정책을 적용할 예정입니다:
          </p>
          <ul className="ml-4 space-y-2">
            <li>- 구매 후 7일 이내: 100% 전액 환불</li>
            <li>- 7일 이후 30일 이내: 사용하지 않은 크레딧에 한해 환불</li>
            <li>- 30일 이후: 환불 불가 (다음 월 크레딧으로 지급)</li>
          </ul>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-800">
            정확한 환불 규정은 서비스 약관에서 확정될 예정입니다.
          </p>
        </div>
      </div>

      {/* 지원 */}
      <div className="mt-8 mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">지원</h2>
        <p className="mt-2 text-sm text-gray-600">
          문제가 발생하거나 문의사항이 있으신가요?
        </p>
        <div className="mt-4 space-y-2">
          <Link
            href="/pricing"
            className="block rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
          >
            요금제 & 기능 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
