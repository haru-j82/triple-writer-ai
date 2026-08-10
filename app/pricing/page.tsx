"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { PlanId } from "@/lib/types";

const FAQS = [
  {
    q: "사용량은 어떻게 차감되나요?",
    a: "에이전트 모드와 대량 생성 모드 모두 1회 실행마다 크레딧 1회가 차감됩니다.",
  },
  {
    q: "크레딧 이월이 가능한가요?",
    a: "데모 버전에서는 플랜 변경 시 새 크레딧이 누적 지급됩니다. 실제 서비스 정책은 별도 설계가 필요합니다.",
  },
  {
    q: "환불이 가능한가요?",
    a: "이 프로젝트는 결제 연동이 포함되지 않은 데모입니다. 실 서비스 전환 시 PG사 정책에 맞춰 환불 규정을 마련해야 합니다.",
  },
  {
    q: "콘텐츠 저작권은 누구에게 있나요?",
    a: "생성된 콘텐츠의 저작권은 원칙적으로 이용자에게 귀속되도록 설계하는 것이 일반적입니다. 정확한 표현은 약관에서 확정하세요.",
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const { state, hydrated, changePlan, creditsRemaining } = useStore();
  const router = useRouter();

  const handleSubscribe = (planId: PlanId) => {
    if (!hydrated || !state.user) {
      router.push("/login");
      return;
    }
    changePlan(planId);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold">요금제 선택</h1>
        <p className="mt-2 text-gray-500">필요한 만큼만, 부담 없이 시작하세요.</p>

        {hydrated && state.user && (
          <div className="mt-4 inline-block rounded-lg bg-violet-50 px-4 py-2 text-sm text-violet-700">
            현재 플랜: <span className="font-semibold">{PLANS.find((p) => p.id === state.plan)?.name}</span>
            <span className="mx-2 text-violet-300">|</span>
            남은 크레딧: <span className="font-semibold">{creditsRemaining}</span>회
          </div>
        )}

        <div className="mt-6 inline-flex rounded-full bg-gray-100 p-1 text-sm font-medium">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-1.5 ${
              !yearly ? "bg-white shadow" : "text-gray-500"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-4 py-1.5 ${
              yearly ? "bg-white shadow" : "text-gray-500"
            }`}
          >
            연간
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = yearly ? plan.priceYearly : plan.priceMonthly;
          const isCurrent = hydrated && state.user && state.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.id === "pro"
                  ? "border-violet-600 ring-2 ring-violet-600"
                  : "border-gray-200"
              }`}
            >
              <h3 className="font-semibold text-gray-500">{plan.name}</h3>
              <p className="mt-2 text-3xl font-extrabold">
                ₩{price.toLocaleString()}
                <span className="text-sm font-normal text-gray-400">
                  {" "}
                  / {yearly ? "년" : "월"}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-400">{plan.description}</p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
                <li>
                  월 서비스 {plan.monthlyCredits}회 이용
                  <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-gray-500">
                    <li>에이전트 모드 고품질 글 {plan.monthlyCredits}회 생성</li>
                    <li>
                      대량생성 모드 {plan.monthlyCredits * plan.bulkPostsPerCredit}개
                      SEO 블로그 글 생성
                    </li>
                  </ul>
                </li>
                <li>3개월간 데이터 저장</li>
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!isCurrent}
                className={`mt-6 rounded-lg px-4 py-2 text-sm font-semibold ${
                  isCurrent
                    ? "cursor-default bg-gray-100 text-gray-400"
                    : plan.id === "pro"
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isCurrent ? "현재 플랜" : "시작하기"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        모든 플랜은 무제한 편집을 포함하며, 에이전트 모드는 고품질 글 1회,
        대량생성 모드는 30개 SEO 블로그 글 1세트를 생성합니다. (데모 버전:
        실제 결제는 이루어지지 않습니다)
      </p>

      {/* 요금제 비교표 */}
      <div className="mt-12 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">기능</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="px-6 py-3 text-left font-semibold text-gray-900">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 font-medium text-gray-900">월 크레딧</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-6 py-3 text-gray-600">
                    {p.monthlyCredits}회
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">에이전트 모드 글 생성</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-6 py-3 text-gray-600">
                    {p.monthlyCredits}개 (1회 = 1크레딧)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-gray-900">대량생성 모드 글 생성</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-6 py-3 text-gray-600">
                    {p.monthlyCredits * p.bulkPostsPerCredit}개 (1회 = {p.bulkPostsPerCredit}글)
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">데이터 저장</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-6 py-3 text-gray-600">
                    3개월
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-gray-900">무제한 편집</td>
                {PLANS.map((p) => (
                  <td key={p.id} className="px-6 py-3">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                      <span className="text-xs font-bold text-green-700">✓</span>
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center text-xl font-bold">자주 묻는 질문</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-lg border border-gray-200 p-4"
            >
              <summary className="cursor-pointer list-none font-medium">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
