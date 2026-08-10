"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { FAQS } from "@/lib/faqs";

const PROBLEMS = [
  {
    title: "모델 선택 고민",
    body: "ChatGPT는 자연스럽지만 부정확할 때가 있고, Claude는 정확하지만 딱딱하고, Gemini는 최신 정보에 강하지만 스타일이 아쉽죠.",
  },
  {
    title: "범용 도구의 한계",
    body: "블로그 전용이 아닌 범용 LLM은 SEO 키워드, 타깃 독자, 톤앤매너까지 매번 직접 조율해야 합니다.",
  },
  {
    title: "품질 검증의 어려움",
    body: "사실 확인, 가독성, CTA 배치까지 일일이 점검하려면 결국 시간이 배로 듭니다.",
  },
];

const BENEFITS = [
  { title: "3개 모델 동시 생성", body: "하나의 입력으로 ChatGPT · Claude · Gemini 초안을 한 번에" },
  { title: "자동 장단점 분석", body: "톤 · 구조 · 사실성 기준으로 각 초안을 교차 비교" },
  { title: "맞춤 톤 적용", body: "브랜드 보이스를 프리셋으로 저장하고 재사용" },
  { title: "SEO 자동 점검", body: "키워드 · 메타 · 헤딩 구조를 자동으로 체크" },
  { title: "예시/표 자동 보강", body: "가독성을 높이는 예시와 표를 자동 제안" },
  { title: "원클릭 합성", body: "3개 초안의 강점만 모아 최종 원고 완성" },
];

const AGENT_STEPS = [
  { n: 1, title: "주제 입력", body: "주제, 타깃 독자, 톤앤매너를 입력합니다." },
  { n: 2, title: "초안 생성", body: "3개 AI가 동시에 초안을 작성합니다." },
  { n: 3, title: "장단점 분석", body: "통합 AI가 각 초안의 강점과 약점을 분석합니다." },
  { n: 4, title: "최종 합성", body: "강점만 결합해 하나의 완성된 글로 합칩니다." },
];

const BULK_STEPS = [
  { n: 1, title: "주제/키워드 대량 입력", body: "여러 줄의 주제와 타깃 독자를 한 번에 입력합니다." },
  { n: 2, title: "톤 & 깊이 설정", body: "톤앤매너와 콘텐츠 깊이를 선택합니다." },
  { n: 3, title: "자동 생성", body: "AI가 제목 패턴을 다양화해 30개 글을 생성합니다." },
  { n: 4, title: "결과 확인", body: "제목·구조·해시태그까지 정리된 결과를 확인합니다." },
];

const MODEL_BADGES = [
  { label: "GPT", color: "#10A37F" },
  { label: "Claude", color: "#D97757" },
  { label: "Gemini", color: "#4285F4" },
];

export default function LandingPage() {
  const [howTab, setHowTab] = useState<"agent" | "bulk">("agent");
  const [yearly, setYearly] = useState(false);
  const steps = howTab === "agent" ? AGENT_STEPS : BULK_STEPS;

  return (
    <main id="top">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center">
        <span className="inline-block rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
          1,200+ 이용자의 AI 블로그 자동 생성 솔루션 (데모)
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          ChatGPT · Claude · Gemini,
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            셋 다 쓰는 블로그 자동 생성
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          3개의 AI 엔진으로 초안을 동시에 생성하고, 장단점을 비교 분석한 뒤
          강점만 합성해 SEO 최적화된 블로그 글을 완성합니다.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white shadow hover:bg-violet-700"
          >
            무료로 시작하기
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            작동 방식 보기
          </a>
        </div>

        {/* 모델 로고 대신 텍스트 뱃지 */}
        <div className="mt-10 flex justify-center gap-3">
          {MODEL_BADGES.map((m) => (
            <span
              key={m.label}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* 히어로 목업 이미지 대체 (실제 스크린샷 대신 UI 목업) */}
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          </div>
          <div className="grid grid-cols-3 gap-3 p-5 text-left">
            {MODEL_BADGES.map((m) => (
              <div key={m.label} className="rounded-lg border border-gray-100 p-3">
                <p
                  className="text-xs font-bold"
                  style={{ color: m.color }}
                >
                  {m.label}
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="h-2 w-full rounded bg-gray-100" />
                  <div className="h-2 w-4/5 rounded bg-gray-100" />
                  <div className="h-2 w-full rounded bg-gray-100" />
                  <div className="h-2 w-3/5 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems */}
      <section id="intro" className="border-t border-black/5 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">
            AI 블로그 글쓰기, 이제 선택하지 마세요
          </h2>
          <p className="mt-2 text-center text-gray-500">
            어떤 모델을 쓸지 고민하는 대신, 트리플로그는 세 모델을 모두 사용합니다.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{p.body}</p>
              </div>
            ))}
          </div>

          {/* 통합 에이전트 요약 섹션 */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-8 text-center">
            <h3 className="text-lg font-bold">고민을 날려버릴 통합 블로그 에이전트!</h3>
            <p className="mt-2 text-sm text-gray-600">
              트리플로그 AI는 3개 모델을 동시에 실행하고, 각각의 장단점을
              자동으로 분석한 뒤, 최고의 요소만 합성해서 단 한 편의 완벽한
              블로그 글을 만들어냅니다.
            </p>
            <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 text-sm">
                <p className="font-semibold text-violet-700">✅ 선택 고민 해결</p>
                <p className="mt-1 text-gray-500">3개 모델을 동시에 사용하니 고민 끝!</p>
              </div>
              <div className="rounded-lg bg-white p-4 text-sm">
                <p className="font-semibold text-violet-700">✅ 시간 절약</p>
                <p className="mt-1 text-gray-500">비교·분석·합성을 자동으로 처리!</p>
              </div>
              <div className="rounded-lg bg-white p-4 text-sm">
                <p className="font-semibold text-violet-700">✅ 품질 보장</p>
                <p className="mt-1 text-gray-500">3개 모델의 강점만 모아 최고 품질!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">서비스 장점</h2>
          <p className="mt-2 text-center text-gray-500">
            기능보다 결과, 사용자가 얻는 가치에 집중합니다.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <h3 className="font-semibold text-violet-700">{b.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-black/5 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">어떻게 작동하나요?</h2>
          <p className="mt-2 text-center text-gray-500">
            실제 워크플로우를 단계별로 보여드립니다.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm font-medium">
              <button
                onClick={() => setHowTab("agent")}
                className={`rounded-full px-4 py-1.5 ${
                  howTab === "agent" ? "bg-white shadow" : "text-gray-500"
                }`}
              >
                에이전트 모드
              </button>
              <button
                onClick={() => setHowTab("bulk")}
                className={`rounded-full px-4 py-1.5 ${
                  howTab === "bulk" ? "bg-white shadow" : "text-gray-500"
                }`}
              >
                대량 생성 모드
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border border-gray-200 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>

          {/* 모델이 합쳐지는 다이어그램 */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
            {MODEL_BADGES.map((m, i) => (
              <span key={m.label} className="flex items-center gap-3">
                <span
                  className="rounded-full px-4 py-2 text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.label}
                </span>
                {i < MODEL_BADGES.length - 1 && <span className="text-gray-400">+</span>}
              </span>
            ))}
            <span className="text-gray-400">=</span>
            <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-white">
              트리플로그 AI 최종본
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">요금제</h2>
            <p className="mt-2 text-gray-500">무료로 체험하고, 필요할 때 업그레이드하세요.</p>
            <div className="mt-6 inline-flex rounded-full bg-gray-100 p-1 text-sm font-medium">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-full px-4 py-1.5 ${!yearly ? "bg-white shadow" : "text-gray-500"}`}
              >
                월간
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`rounded-full px-4 py-1.5 ${yearly ? "bg-white shadow" : "text-gray-500"}`}
              >
                연간
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price = yearly ? plan.priceYearly : plan.priceMonthly;
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
                  <ul className="mt-4 flex-1 space-y-1 text-sm text-gray-600">
                    <li>월 서비스 {plan.monthlyCredits}회 이용</li>
                    <li className="text-xs text-gray-400">
                      대량생성 {plan.monthlyCredits * plan.bulkPostsPerCredit}개 생성 가능
                    </li>
                  </ul>
                  <Link
                    href="/login"
                    className={`mt-6 rounded-lg px-4 py-2 text-center text-sm font-semibold ${
                      plan.id === "pro"
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    시작하기
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-black/5 bg-white py-16">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-bold">자주 묻는 질문</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white py-12 text-sm text-gray-500">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
          <div>
            <p className="font-bold text-gray-800">트리플로그 AI</p>
            <p className="mt-2 text-xs leading-relaxed">
              모든 AI 모델을 통합하여 최고의 콘텐츠를 생성합니다. (데모 프로젝트)
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">서비스</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li><a href="#intro" className="hover:text-violet-600">소개</a></li>
              <li><a href="#benefits" className="hover:text-violet-600">서비스</a></li>
              <li><a href="#how" className="hover:text-violet-600">사용방법</a></li>
              <li><a href="#pricing" className="hover:text-violet-600">요금제</a></li>
              <li><a href="#faq" className="hover:text-violet-600">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-700">고객지원</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>이메일: hello@triplelog.ai (예시)</li>
              <li>연락처: 02-0000-0000 (예시)</li>
              <li>평일 09:00 - 18:00</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-gray-100 px-4 pt-6 text-xs text-gray-400">
          <p>
            회사명: (주)트리플로그 (예시) | 사업자등록번호: 000-00-00000 (예시) |
            통신판매업신고번호: 제0000-서울강남-0000호 (예시)
          </p>
          <p className="mt-1">대표: 홍길동 (예시) | 주소: 서울특별시 강남구 테헤란로 (예시)</p>
          <p className="mt-1">© {new Date().getFullYear()} TripleLog AI — 데모 프로젝트 (실제 서비스가 아닙니다)</p>
        </div>
      </footer>
    </main>
  );
}
