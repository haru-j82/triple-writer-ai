"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import {
  BatchCancelledError,
  estimateTotalMs,
  generateBatch,
  GenStage,
  STAGE_LABEL,
} from "@/lib/bulkMock";

export default function BulkBatchGeneratingPage() {
  const { state: appState, hydrated } = useStore();
  const { state, setPosts, markStepReached } = useBulkBatchStore();
  const router = useRouter();

  const [stage, setStage] = useState<GenStage>("titles");
  const [percent, setPercent] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [total, setTotal] = useState(state.settings?.count ?? 0);
  const [running, setRunning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.settings || !state.keywords) {
      router.replace(state.settings ? "/bulk-batch/keywords" : "/bulk-batch");
    }
  }, [hydrated, state.settings, state.keywords, router]);

  // 진행 경과 시간 타이머 (예상 완료 시간 계산용)
  useEffect(() => {
    if (!running || startedAt === null) return;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 200);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  const runGeneration = useCallback(() => {
    if (!state.settings || !state.keywords) return;
    const settings = state.settings;
    const keywords = state.keywords;

    setCancelled(false);
    setError(null);
    setPercent(0);
    setStage("titles");
    setDoneCount(0);
    setTotal(settings.count);
    setRunning(true);
    setStartedAt(Date.now());
    setElapsedMs(0);
    cancelledRef.current = false;

    generateBatch({
      settings,
      keywords,
      onProgress: (s, pct, doneCnt, tot) => {
        setStage(s);
        setPercent(pct);
        setDoneCount(doneCnt);
        setTotal(tot);
      },
      isCancelled: () => cancelledRef.current,
    })
      .then((posts) => {
        setPosts(posts);
        markStepReached(4);
        setRunning(false);
        window.setTimeout(() => router.push("/bulk-batch/preview"), 700);
      })
      .catch((e) => {
        setRunning(false);
        if (e instanceof BatchCancelledError) {
          setCancelled(true);
        } else {
          setError(e instanceof Error ? e.message : "생성 중 알 수 없는 오류가 발생했습니다.");
        }
      });
  }, [state.settings, state.keywords, setPosts, markStepReached, router]);

  useEffect(() => {
    if (!hydrated || !state.settings || !state.keywords) return;
    if (startedRef.current) return;
    startedRef.current = true;
    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.settings, state.keywords]);

  const handleCancel = () => {
    cancelledRef.current = true;
  };

  const handleRetry = () => {
    runGeneration();
  };

  const estimateMs = state.settings ? estimateTotalMs(state.settings) : 0;
  const remainingMs = Math.max(0, estimateMs - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);

  if (!hydrated || !appState.user) return null;
  if (!state.settings || !state.keywords) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-8">
      <h2 className="text-lg font-bold">Step 3. 생성 프로세스</h2>
      <p className="mt-1 text-sm text-gray-500">
        {state.settings.count}개의 블로그 글을 자동으로 생성하고 있습니다. 잠시만 기다려주세요.
      </p>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#ede9fe" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - percent / 100)}
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <span className="absolute text-2xl font-bold text-violet-700">{percent}%</span>
        </div>

        <p className="mt-5 text-sm font-semibold text-violet-700">{STAGE_LABEL[stage]}</p>
        <p className="mt-1 text-xs text-gray-400">
          {doneCount} / {total} 글 처리 완료
        </p>

        {running && (
          <p className="mt-2 text-xs text-gray-400">
            예상 완료까지 약 {remainingSec > 0 ? remainingSec : 1}초 남음
          </p>
        )}
      </div>

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {cancelled && (
        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          생성이 취소되었습니다. 설정을 변경한 뒤 다시 시도해주세요.
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
            >
              다시 시도
            </button>
            <button
              onClick={() => router.push("/bulk-batch/keywords")}
              className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700"
            >
              키워드 수정
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
          <div className="mt-3">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleCancel}
          disabled={!running}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-40"
        >
          취소
        </button>
      </div>
    </div>
  );
}
