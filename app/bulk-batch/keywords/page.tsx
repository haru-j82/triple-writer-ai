"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBulkBatchStore } from "@/lib/bulkBatchStore";
import { BulkBatchKeywords } from "@/lib/bulkBatchTypes";

const MAX_PRIMARY = 30;
const MAX_LONGTAIL = 10;

// 쉼표 구분 입력값을 정리(trim, 빈값 제거, 중복 제거)
function parseCommaList(raw: string, max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const v = part.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

// 줄바꿈 구분 입력값을 정리(trim, 빈값 제거, 중복 제거)
function parseLineList(raw: string, max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split("\n")) {
    const v = part.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

export default function BulkBatchKeywordsPage() {
  const { state: appState, hydrated } = useStore();
  const { state, setKeywords, markStepReached } = useBulkBatchStore();
  const router = useRouter();

  const [primaryRaw, setPrimaryRaw] = useState(
    state.keywords?.primaryKeywords.join(", ") ?? ""
  );
  const [longtailRaw, setLongtailRaw] = useState(
    state.keywords?.longtailKeywords.join("\n") ?? ""
  );
  const [excludeRaw, setExcludeRaw] = useState(
    state.keywords?.excludeKeywords.join(", ") ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.settings) router.replace("/bulk-batch");
  }, [hydrated, state.settings, router]);

  const primaryKeywords = useMemo(() => parseCommaList(primaryRaw, MAX_PRIMARY), [primaryRaw]);
  const longtailKeywords = useMemo(() => parseLineList(longtailRaw, MAX_LONGTAIL), [longtailRaw]);
  const excludeKeywords = useMemo(() => parseCommaList(excludeRaw, 50), [excludeRaw]);

  const canSubmit = primaryKeywords.length > 0;

  const handleNext = () => {
    if (!canSubmit) {
      setError("주요 키워드를 최소 1개 이상 입력해주세요.");
      return;
    }
    setError(null);
    const keywords: BulkBatchKeywords = { primaryKeywords, longtailKeywords, excludeKeywords };
    setKeywords(keywords);
    markStepReached(3);
    router.push("/bulk-batch/generating");
  };

  if (!hydrated || !appState.user) return null;
  if (!state.settings) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 2. 키워드 입력</h2>
      <p className="mt-1 text-sm text-gray-500">
        생성될 {state.settings.count}개 글에 사용할 키워드를 입력하세요. 중복/빈 값은 자동으로 제거됩니다.
      </p>

      {/* 주요 키워드 */}
      <label className="mt-6 block text-sm font-medium">
        주요 키워드 <span className="text-gray-400">(쉼표로 구분, 최대 {MAX_PRIMARY}개)</span>
      </label>
      <input
        value={primaryRaw}
        onChange={(e) => setPrimaryRaw(e.target.value)}
        placeholder="예: SEO 최적화, 블로그 수익화, 콘텐츠 마케팅"
        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
      />
      <p className="mt-1 text-xs text-gray-400">
        {primaryKeywords.length} / {MAX_PRIMARY}개
      </p>
      {primaryKeywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {primaryKeywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {/* 장문 키워드 */}
      <label className="mt-5 block text-sm font-medium">
        장문 키워드 <span className="text-gray-400">(한 줄에 하나, 최대 {MAX_LONGTAIL}개)</span>
      </label>
      <textarea
        value={longtailRaw}
        onChange={(e) => setLongtailRaw(e.target.value)}
        placeholder={"예: 블로그 애드센스 승인 조건 총정리\n초보자를 위한 티스토리 수익화 방법"}
        rows={5}
        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
      />
      <p className="mt-1 text-xs text-gray-400">
        {longtailKeywords.length} / {MAX_LONGTAIL}개
      </p>

      {/* 제외 키워드 */}
      <label className="mt-5 block text-sm font-medium">
        제외 키워드 <span className="text-gray-400">(쉼표로 구분)</span>
      </label>
      <input
        value={excludeRaw}
        onChange={(e) => setExcludeRaw(e.target.value)}
        placeholder="예: 도박, 특정 브랜드명"
        className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
      />
      {excludeKeywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {excludeKeywords.map((k) => (
            <span
              key={k}
              className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/bulk-batch")}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
        >
          이전
        </button>
        <button
          disabled={!canSubmit}
          onClick={handleNext}
          className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white transition disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
