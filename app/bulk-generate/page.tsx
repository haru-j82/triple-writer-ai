"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/uid";
import { CreditDisplay } from "@/components/CreditDisplay";
import { BULK_TONE_OPTIONS, BULK_DEPTH_OPTIONS } from "@/lib/options";
import { generateBulkDetail, BulkPostDetail } from "@/lib/bulkTemplates";

interface BulkResult extends BulkPostDetail {
  id: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function BulkGeneratePage() {
  const { state, hydrated, consumeCredit, addPost } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [topics, setTopics] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState(BULK_TONE_OPTIONS[0]);
  const [depth, setDepth] = useState(BULK_DEPTH_OPTIONS[0]);
  const [extra, setExtra] = useState("");

  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [openIndex, setOpenIndex] = useState<number>(0);

  useEffect(() => {
    if (hydrated && !state.user) router.push("/login");
  }, [hydrated, state.user, router]);

  const topicLines = topics
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const canSubmit = topicLines.length > 0 && audience.trim().length > 0;

  const runBulk = async () => {
    const ok = consumeCredit("대량 생성 모드 - 30개 SEO 블로그 글 생성");
    if (!ok) {
      alert("남은 사용 횟수가 없습니다. 요금제를 업그레이드해주세요.");
      router.push("/pricing");
      return;
    }

    setStep(2);
    setRunning(true);
    setResults([]);
    setProgress(0);
    setOpenIndex(0);

    const total = 30;
    const baseTopics = topicLines.length > 0 ? topicLines : [topics];
    const items: BulkResult[] = [];
    const batchId = uid();

    for (let i = 0; i < total; i++) {
      const base = baseTopics[i % baseTopics.length];
      const detail = generateBulkDetail(base, audience, tone, i);
      items.push({ id: uid(), ...detail });
      setProgress(Math.round(((i + 1) / total) * 100));
      setResults([...items]);
      await delay(45);
    }

    items.forEach((item) => {
      addPost({
        id: item.id,
        mode: "bulk",
        title: item.title,
        content: `${item.metaDescription}\n\n${item.excerpt}`,
        createdAt: new Date().toISOString(),
        topic: item.title,
        batchId,
        subtitle: item.subtitle,
        metaDescription: item.metaDescription,
        excerpt: item.excerpt,
        keyword: item.keyword,
        relatedTags: item.relatedTags,
        hashtags: item.hashtags,
        outline: item.outline,
      });
    });

    setRunning(false);
    setDone(true);
  };

  if (!hydrated || !state.user) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <CreditDisplay />

      <div className="mt-6 mb-6 flex items-center gap-2 text-sm font-semibold text-violet-600">
        대량 생성 모드
      </div>

      {step === 1 && (
        <div className="rounded-2xl border border-violet-200 bg-white p-6">
          <h2 className="text-lg font-bold">Step 1: 정보 입력</h2>
          <p className="mt-1 text-sm text-gray-500">
            어떤 주제로 30개의 블로그 글을 생성하시겠습니까?
          </p>

          <label className="mt-5 block text-sm font-medium">주제 및 키워드 *</label>
          <textarea
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder={
              "예: 블로그 수익화 및 애드센스\n애드센스 승인 조건\n블로그 수익 전략\n티스토리 애드센스\n워드프레스 수익화"
            }
            rows={5}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            한 줄에 하나씩 입력하면 각 줄을 순환하며 30개 글을 생성합니다.
          </p>

          <label className="mt-4 block text-sm font-medium">타겟 독자 *</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="예: 20대 직장인, 블로그 초보자, 부업 관심자, 투자 입문자 등"
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />

          <p className="mt-5 text-sm font-medium">톤앤매너</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BULK_TONE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  tone === t
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium">콘텐츠 깊이</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BULK_DEPTH_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  depth === d
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <label className="mt-5 block text-sm font-medium">
            추가 정보 <span className="text-gray-400">(선택)</span>
          </label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="예: 실제 사례 위주로 작성, 통계 데이터 포함, 특정 브랜드 언급 제외, 비교 분석 포함 등"
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:outline-none"
          />

          <div className="mt-6 flex justify-end">
            <button
              disabled={!canSubmit}
              onClick={runBulk}
              className="w-full rounded-lg bg-violet-600 py-3 font-semibold text-white disabled:opacity-40 sm:w-auto sm:px-8"
            >
              입력 완료 &middot; 30개 생성 시작 (1 크레딧 차감)
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-center">
            <h2 className="text-lg font-bold">
              {done ? "30개 주제 생성 완료!" : "30개 블로그 글을 생성하고 있습니다..."}
            </h2>
            <p className="text-sm text-gray-500">
              {done
                ? "제목을 클릭하면 상세 정보를 확인할 수 있습니다"
                : `진행률 ${progress}%`}
            </p>
          </div>

          {running && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {results.map((r, i) => {
              const isOpen = openIndex === i;
              return (
                <li
                  key={r.id}
                  className="overflow-hidden rounded-xl border border-violet-100 bg-white"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-semibold">{r.title}</span>
                    </span>
                    <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-gray-100 px-5 py-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-400">부제목</p>
                        <p className="mt-1">{r.subtitle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400">메타 디스크립션</p>
                        <p className="mt-1 text-gray-600">{r.metaDescription}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400">발췌문</p>
                        <p className="mt-1 text-gray-600">{r.excerpt}</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-400">🔑 핵심 키워드</p>
                          <span className="mt-1 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                            {r.keyword}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400">🏷️ 관련 태그</p>
                          <p className="mt-1 text-gray-600">{r.relatedTags.join(", ")}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400">📌 추천 해시태그</p>
                        <p className="mt-1 text-violet-600">{r.hashtags.join(" ")}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400">📄 글 구조</p>
                        <p className="mt-1 font-medium">H1: {r.outline.h1}</p>
                        <p className="mt-1 text-gray-500">H2:</p>
                        <ul className="ml-4 mt-1 list-disc space-y-0.5 text-gray-600">
                          {r.outline.h2.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {done && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
              >
                대시보드로 이동
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
