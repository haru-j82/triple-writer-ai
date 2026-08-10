"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import {
  AgentTopicInput,
  AudienceLevel,
  AUDIENCE_LABEL,
  ToneStyle,
  TONE_LABEL,
} from "@/lib/agentTypes";

const AUDIENCES: AudienceLevel[] = ["expert", "general", "beginner"];
const TONES: ToneStyle[] = ["professional", "friendly", "academic"];

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface FieldErrors {
  title?: string;
  keywords?: string;
  slug?: string;
  metaDescription?: string;
}

export default function AgentTopicPage() {
  const { state: appState, hydrated } = useStore();
  const { state, setTopic, markStepReached } = useAgentStore();
  const router = useRouter();

  const [title, setTitle] = useState(state.topic?.title ?? "");
  const [keywordsRaw, setKeywordsRaw] = useState(state.topic?.keywords.join(", ") ?? "");
  const [audience, setAudience] = useState<AudienceLevel>(state.topic?.audience ?? "general");
  const [tone, setTone] = useState<ToneStyle>(state.topic?.tone ?? "professional");
  const [metaDescription, setMetaDescription] = useState(state.topic?.seo.metaDescription ?? "");
  // 슬러그는 제목에서 자동 생성하되, 사용자가 직접 수정하면 그 값을 우선합니다.
  const [slugOverride, setSlugOverride] = useState<string | null>(state.topic?.seo.slug ?? null);
  const [focusKeyword, setFocusKeyword] = useState(state.topic?.seo.focusKeyword ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  const slug = slugOverride ?? slugify(title);

  const keywordList = useMemo(
    () =>
      keywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    [keywordsRaw]
  );

  const validateTitle = () => {
    setErrors((prev) => ({
      ...prev,
      title: title.trim().length === 0 ? "제목을 입력해주세요." : undefined,
    }));
  };

  const validateKeywords = () => {
    setErrors((prev) => ({
      ...prev,
      keywords:
        keywordList.length > 10 ? "키워드는 최대 10개까지 입력할 수 있습니다." : undefined,
    }));
  };

  const generateSeoKeywords = async () => {
    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: "먼저 제목을 입력해주세요." }));
      return;
    }

    setGeneratingKeywords(true);
    try {
      // SEO 최적화된 키워드 자동 생성 (Mock)
      const generatedKeywords = generateKeywordsFromTitle(title);
      setKeywordsRaw(generatedKeywords.join(", "));
      setErrors((prev) => ({ ...prev, keywords: undefined }));
    } catch (error) {
      console.error("Keyword generation failed:", error);
    } finally {
      setGeneratingKeywords(false);
    }
  };

  const generateKeywordsFromTitle = (titleText: string): string[] => {
    // SEO 최적화된 키워드 자동 생성 로직
    const titleWords = titleText
      .toLowerCase()
      .split(/[\s,\-]+/)
      .filter((w) => w.length > 2 && !/[0-9]+/.test(w));

    // 한글/영문 키워드 추가
    const seoKeywords: Record<string, string[]> = {
      블로그: ["블로그 마케팅", "블로그 수익화", "블로그 SEO"],
      seo: ["SEO 최적화", "검색 엔진 최적화", "키워드 리서치"],
      콘텐츠: ["콘텐츠 마케팅", "콘텐츠 전략", "글쓰기 팁"],
      마케팅: ["디지털 마케팅", "마케팅 전략", "브랜드 마케팅"],
      여행: ["여행지 추천", "여행 팁", "국내 여행"],
      카페: ["카페 추천", "카페 문화", "핸드드립 커피"],
      기술: ["기술 트렌드", "프로그래밍", "개발 가이드"],
      음식: ["음식 리뷰", "요리 팁", "음식 문화"],
      건강: ["건강 정보", "운동 팁", "건강 관리"],
    };

    // 제목에 포함된 주제로 키워드 생성
    let keywords: string[] = [];
    for (const [topic, relatedKeywords] of Object.entries(seoKeywords)) {
      if (titleWords.join(" ").includes(topic)) {
        keywords = relatedKeywords;
        break;
      }
    }

    // 기본값 (제목 + 관련 키워드)
    if (keywords.length === 0) {
      const mainKeyword = titleWords.slice(0, 2).join(" ");
      keywords = [
        mainKeyword,
        `${mainKeyword} 팁`,
        `${mainKeyword} 가이드`,
      ];
    }

    return keywords.slice(0, 3); // 최대 3개
  };

  const validateSlug = () => {
    setErrors((prev) => ({
      ...prev,
      slug:
        slug.length > 0 && !/^[a-z0-9가-힣-]+$/.test(slug)
          ? "슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다."
          : undefined,
    }));
  };

  const validateMetaDescription = () => {
    setErrors((prev) => ({
      ...prev,
      metaDescription:
        metaDescription.length > 160
          ? "메타 설명은 160자 이내를 권장합니다 (검색 결과에서 잘릴 수 있어요)."
          : undefined,
    }));
  };

  const canSubmit =
    title.trim().length > 0 &&
    keywordList.length <= 10 &&
    (slug.length === 0 || /^[a-z0-9가-힣-]+$/.test(slug));

  const handleSubmit = async () => {
    validateTitle();
    validateKeywords();
    validateSlug();
    if (!canSubmit) return;

    const topic: AgentTopicInput = {
      title: title.trim(),
      keywords: keywordList,
      audience,
      tone,
      seo: {
        metaDescription: metaDescription.trim(),
        slug: slug || slugify(title),
        focusKeyword: focusKeyword.trim(),
      },
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/agent/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: state.blogId, topic }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      setTopic(topic);
      markStepReached(2);
      router.push("/agent/llm-drafts");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !appState.user) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 1. 주제 입력</h2>
      <p className="mt-1 text-sm text-gray-500">
        어떤 주제로 블로그 글을 작성할지 알려주세요. 입력한 내용은 다음 단계로 그대로 전달됩니다.
      </p>

      {/* 제목 */}
      <label className="mt-6 block text-sm font-medium">
        제목 <span className="text-red-500">*</span>
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={validateTitle}
        placeholder="예: 블로그 수익화 첫 달에 해야 할 7가지"
        className={`mt-1 w-full rounded-lg border p-3 text-sm focus:outline-none ${
          errors.title ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-violet-500"
        }`}
      />
      {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}

      {/* 키워드 */}
      <div className="mt-4 flex items-center justify-between">
        <label className="block text-sm font-medium">
          키워드 <span className="text-gray-400">(쉼표로 구분, 최대 10개)</span>
        </label>
        <button
          type="button"
          onClick={generateSeoKeywords}
          disabled={generatingKeywords || !title.trim()}
          className="rounded bg-violet-100 px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-200 disabled:opacity-50"
        >
          {generatingKeywords ? "생성 중..." : "🤖 자동 생성"}
        </button>
      </div>
      <input
        value={keywordsRaw}
        onChange={(e) => setKeywordsRaw(e.target.value)}
        onBlur={validateKeywords}
        placeholder="예: SEO 최적화, 구글 애널리틱스, 키워드 리서치"
        className={`mt-1 w-full rounded-lg border p-3 text-sm focus:outline-none ${
          errors.keywords ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-violet-500"
        }`}
      />
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-gray-400">{keywordList.length} / 10개</p>
        {errors.keywords && <p className="text-xs text-red-500">{errors.keywords}</p>}
      </div>
      {keywordList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {keywordList.slice(0, 10).map((k) => (
            <span
              key={k}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {/* 타겟 독자층 */}
      <p className="mt-5 text-sm font-medium">타겟 독자층</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {AUDIENCES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAudience(a)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              audience === a
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {AUDIENCE_LABEL[a]}
          </button>
        ))}
      </div>

      {/* 톤 */}
      <p className="mt-5 text-sm font-medium">톤</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TONES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              tone === t
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {TONE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* SEO 설정 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold">SEO 설정</p>

        <label className="mt-3 block text-xs font-medium text-gray-600">메타 설명</label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          onBlur={validateMetaDescription}
          rows={2}
          placeholder="검색 결과에 노출될 요약 설명 (160자 이내 권장)"
          className={`mt-1 w-full rounded-lg border bg-white p-2.5 text-sm focus:outline-none ${
            errors.metaDescription
              ? "border-amber-400 focus:border-amber-500"
              : "border-gray-300 focus:border-violet-500"
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">{metaDescription.length} / 160자</p>
          {errors.metaDescription && (
            <p className="text-[11px] text-amber-600">{errors.metaDescription}</p>
          )}
        </div>

        <label className="mt-3 block text-xs font-medium text-gray-600">슬러그(URL)</label>
        <input
          value={slug}
          onChange={(e) => setSlugOverride(e.target.value)}
          onBlur={validateSlug}
          placeholder="예: blog-monetization-first-month"
          className={`mt-1 w-full rounded-lg border bg-white p-2.5 text-sm focus:outline-none ${
            errors.slug ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-violet-500"
          }`}
        />
        {errors.slug && <p className="mt-1 text-[11px] text-red-500">{errors.slug}</p>}

        <label className="mt-3 block text-xs font-medium text-gray-600">포커스 키워드</label>
        <input
          value={focusKeyword}
          onChange={(e) => setFocusKeyword(e.target.value)}
          placeholder="예: 블로그 수익화"
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-violet-500 focus:outline-none"
        />
      </div>

      {submitError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white transition disabled:opacity-40"
        >
          {submitting ? "저장 중..." : "다음"}
        </button>
      </div>
    </div>
  );
}
