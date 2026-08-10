"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import { LlmDraft, LlmId, LLM_META } from "@/lib/agentTypes";
import { getMockUser, consumeCredit as consumeMockCredit } from "@/lib/mockUserStore";

const LLM_IDS: LlmId[] = ["chatgpt", "gemini", "claude"];

export default function LlmDraftsPage() {
  const { state: appState, hydrated, creditsRemaining, consumeCredit } = useStore();
  const { state, setDrafts, markStepReached } = useAgentStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LlmId>("chatgpt");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<Record<LlmId, boolean>>({
    chatgpt: false,
    gemini: false,
    claude: false,
  });
  const [drafts, setLocalDrafts] = useState<LlmDraft[]>(state.drafts);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.topic) {
      router.replace("/agent");
    }
  }, [hydrated, state.topic, router]);

  const runGeneration = async () => {
    if (!state.topic) return;
    setError(null);

    // Mock 사용자 크레딧 확인
    const mockUser = getMockUser("tooissss0919@gmail.com");
    if (mockUser.blog_credits <= 0) {
      alert("크레딧이 부족합니다! 요금제를 업그레이드하세요.");
      router.push("/pricing");
      return;
    }

    // 크레딧 차감
    const creditOk = consumeMockCredit("tooissss0919@gmail.com", "blog", 1);
    if (!creditOk) {
      alert("크레딧 차감에 실패했습니다.");
      return;
    }

    setLoading(true);
    setLoadingLabel({ chatgpt: true, gemini: true, claude: true });

    try {
      const res = await fetch("/api/agent/generate-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: state.blogId, topic: state.topic }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "초안 생성에 실패했습니다.");
      }
      const result: LlmDraft[] = data.drafts;
      setLocalDrafts(result);
      setDrafts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setLoadingLabel({ chatgpt: false, gemini: false, claude: false });
    }
  };

  useEffect(() => {
    if (!hydrated || !state.topic) return;
    if (drafts.length === 3) return; // 이미 생성됨 (이전 단계에서 돌아온 경우)
    if (startedRef.current) return;
    startedRef.current = true;
    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.topic]);

  const allDone = drafts.length === 3;

  const handleNext = () => {
    markStepReached(3);
    router.push("/agent/synthesis");
  };

  if (!hydrated || !appState.user) return null;

  const activeDraft = drafts.find((d) => d.id === activeTab);

  return (
    <div>
      <div className="rounded-2xl border border-violet-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Step 2. 3개 LLM 초안 생성</h2>
            <p className="mt-1 text-sm text-gray-500">
              {state.topic?.title}에 대한 초안을 ChatGPT, Gemini, Claude가 동시에 작성합니다.
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 sm:inline">
            남은 사용 횟수 {creditsRemaining}회
          </span>
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <span>{error}</span>
            <button
              onClick={() => {
                startedRef.current = false;
                runGeneration();
              }}
              className="font-semibold underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 탭 */}
        <div className="mt-5 flex gap-2 border-b border-gray-200">
          {LLM_IDS.map((id) => {
            const d = drafts.find((x) => x.id === id);
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === id
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: LLM_META[id].color }}
                />
                {LLM_META[id].label}
                {loadingLabel[id] && !d && (
                  <span className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
                )}
                {d && <span className="ml-1 text-green-500">✓</span>}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="min-h-[320px] rounded-xl border border-gray-200 bg-gray-50 p-4">
            {activeDraft ? (
              <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {activeDraft.content}
              </div>
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-gray-400">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
                <p className="text-sm">
                  {LLM_META[activeTab].label}가 초안을 작성하고 있습니다...
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">메트릭</p>
            {activeDraft ? (
              <>
                <MetricRow label="단어 수" value={`${activeDraft.metrics.wordCount}자`} />
                <MetricRow label="읽기 시간" value={`${activeDraft.metrics.readingTimeMin}분`} />
                <MetricRow label="SEO 점수" value={`${activeDraft.metrics.seoScore.toFixed(1)} / 10`} />
                <MetricRow
                  label="창의성 점수"
                  value={`${activeDraft.metrics.creativityScore.toFixed(1)} / 10`}
                />
                <div className="mt-4 rounded-lg bg-violet-600 p-3 text-center text-white">
                  <p className="text-[11px] opacity-80">종합 점수</p>
                  <p className="text-2xl font-bold">
                    {activeDraft.metrics.overallScore.toFixed(1)}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400">생성이 완료되면 표시됩니다.</p>
            )}
          </div>
        </div>

        {/* 전체 요약 카드 */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {LLM_IDS.map((id) => {
            const d = drafts.find((x) => x.id === id);
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`rounded-lg border p-3 text-left transition ${
                  activeTab === id ? "border-violet-500 ring-1 ring-violet-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: LLM_META[id].color }}>
                    {LLM_META[id].label}
                  </span>
                  <span className="text-sm font-bold text-violet-700">
                    {d ? d.metrics.overallScore.toFixed(1) : "-"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {d ? `${d.metrics.wordCount}자 · ${d.metrics.readingTimeMin}분` : "생성 중..."}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/agent")}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
          >
            이전
          </button>
          <button
            disabled={!allDone || loading}
            onClick={handleNext}
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            분석 & 합성
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
