"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import {
  AnalysisRow,
  ANALYSIS_METRIC_LABEL,
  AnalysisMetrics,
  LLM_META,
} from "@/lib/agentTypes";
import { renderMarkdown } from "@/lib/markdown";

const METRIC_KEYS = Object.keys(ANALYSIS_METRIC_LABEL) as (keyof AnalysisMetrics)[];

function RadarChart({ rows }: { rows: AnalysisRow[] }) {
  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 36;
  const axisCount = METRIC_KEYS.length;

  const pointFor = (axisIndex: number, value: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axisCount;
    const r = (Math.max(0, Math.min(10, value)) / 10) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const labelPointFor = (axisIndex: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axisCount;
    const r = radius + 20;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[280px]">
      {rings.map((ratio) => {
        const pts = METRIC_KEYS.map((_, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axisCount;
          const r = radius * ratio;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={ratio} points={pts} fill="none" stroke="#e5e7eb" strokeWidth={1} />;
      })}
      {METRIC_KEYS.map((key, i) => {
        const p = pointFor(i, 10);
        return (
          <line key={key} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth={1} />
        );
      })}
      {METRIC_KEYS.map((key, i) => {
        const p = labelPointFor(i);
        return (
          <text
            key={key}
            x={p.x}
            y={p.y}
            fontSize={10}
            fill="#6b7280"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {ANALYSIS_METRIC_LABEL[key]}
          </text>
        );
      })}
      {rows.map((row) => {
        const pts = METRIC_KEYS.map((key, i) => {
          const p = pointFor(i, row.metrics[key]);
          return `${p.x},${p.y}`;
        }).join(" ");
        const color = LLM_META[row.id].color;
        return (
          <polygon
            key={row.id}
            points={pts}
            fill={color}
            fillOpacity={0.12}
            stroke={color}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
}

export default function SynthesisPage() {
  const { state: appState, hydrated } = useStore();
  const { state, setAnalysisAndSynthesis, updateSynthesis, markStepReached } = useAgentStore();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const [title, setTitle] = useState(state.synthesis?.title ?? "");
  const [metaDescription, setMetaDescription] = useState(state.synthesis?.metaDescription ?? "");
  const [content, setContent] = useState(state.synthesis?.content ?? "");
  const [savingNext, setSavingNext] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.topic || state.drafts.length < 3) {
      router.replace(state.topic ? "/agent/llm-drafts" : "/agent");
    }
  }, [hydrated, state.topic, state.drafts.length, router]);

  const runSynthesis = async () => {
    if (!state.topic || state.drafts.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: state.blogId,
          topic: state.topic,
          drafts: state.drafts,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "분석/합성에 실패했습니다.");
      }
      setAnalysisAndSynthesis(data.analysis, data.synthesis);
      setTitle(data.synthesis.title);
      setMetaDescription(data.synthesis.metaDescription);
      setContent(data.synthesis.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !state.topic || state.drafts.length < 3) return;
    if (state.synthesis) return;
    if (startedRef.current) return;
    startedRef.current = true;
    runSynthesis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.topic, state.drafts.length]);

  const handleNext = async () => {
    setSavingNext(true);
    setError(null);
    try {
      updateSynthesis({ title, metaDescription, content });
      const res = await fetch("/api/agent/save-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: state.blogId,
          synthesis: { title, metaDescription, content },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      markStepReached(4);
      router.push("/agent/images");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSavingNext(false);
    }
  };

  if (!hydrated || !appState.user) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 3. AI 분석 & 합성</h2>
      <p className="mt-1 text-sm text-gray-500">
        3개 초안을 5개 지표로 분석하고, 강점만 모아 최종 글을 합성합니다.
      </p>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <span>{error}</span>
          <button
            onClick={() => {
              startedRef.current = false;
              runSynthesis();
            }}
            className="font-semibold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {loading && !state.analysis.length ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          <p className="text-sm">트리플로그 AI가 초안을 분석하고 합성하는 중입니다...</p>
        </div>
      ) : (
        <>
          {/* 분석 결과 표 */}
          {state.analysis.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-2">모델</th>
                    {METRIC_KEYS.map((key) => (
                      <th key={key} className="px-2 py-2 text-center">
                        {ANALYSIS_METRIC_LABEL[key]}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center">종합</th>
                  </tr>
                </thead>
                <tbody>
                  {state.analysis.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2 font-semibold" style={{ color: LLM_META[row.id].color }}>
                        {row.label}
                      </td>
                      {METRIC_KEYS.map((key) => (
                        <td key={key} className="px-2 py-2 text-center text-gray-700">
                          {row.metrics[key].toFixed(1)}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-bold text-violet-700">
                        {row.overall.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 레이더 차트 */}
          {state.analysis.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 p-4">
              <p className="mb-2 text-center text-sm font-semibold text-gray-600">모델별 비교</p>
              <RadarChart rows={state.analysis} />
              <div className="mt-2 flex justify-center gap-4 text-xs">
                {state.analysis.map((row) => (
                  <span key={row.id} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: LLM_META[row.id].color }}
                    />
                    {row.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 합성된 최종 글 편집 */}
          {content && (
            <div className="mt-8">
              <h3 className="text-sm font-bold">합성된 최종 글 (수정 가능)</h3>

              <label className="mt-3 block text-xs font-medium text-gray-600">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm font-semibold focus:border-violet-500 focus:outline-none"
              />

              <label className="mt-3 block text-xs font-medium text-gray-600">메타 설명</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />

              <label className="mt-3 block text-xs font-medium text-gray-600">
                본문 (마크다운 에디터 · 실시간 미리보기)
              </label>
              <div className="mt-1 grid gap-3 lg:grid-cols-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={18}
                  className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs leading-6 focus:border-violet-500 focus:outline-none"
                />
                <div
                  className="max-h-[420px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => router.push("/agent/llm-drafts")}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
            >
              이전
            </button>
            <button
              disabled={!content || savingNext}
              onClick={handleNext}
              className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {savingNext ? "저장 중..." : "다음"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
