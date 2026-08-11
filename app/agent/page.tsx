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
  const [slugOverride, setSlugOverride] = useState<string | null>(state.topic?.seo.slug ?? null);
  const [focusKeyword, setFocusKeyword] = useState(state.topic?.seo.focusKeyword ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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
    const titleWords = titleText
      .toLowerCase()
      .split(/[\s,\-]+/)
      .filter((w) => w.length > 2 && !/[0-9]+/.test(w));

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

    let keywords: string[] = [];
    for (const [topic, relatedKeywords] of Object.entries(seoKeywords)) {
      if (titleWords.join(" ").includes(topic)) {
        keywords = relatedKeywords;
        break;
      }
    }

    if (keywords.length === 0) {
      const mainKeyword = titleWords.slice(0, 2).join(" ");
      keywords = [
        mainKeyword,
        `${mainKeyword} 팁`,
        `${mainKeyword} 가이드`,
      ];
    }

    return keywords.slice(0, 3);
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
          ? "메타 설명은 160자 이내를 권장합니다."
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
      setCurrentStep(2);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !appState.user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-purple-600">🚀 Triple Writer</div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              Gazet Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              사용자: <strong>{appState.user?.email}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex h-12 w-12 items-center justify-center rounded-full font-bold transition ${
              currentStep >= 1
                ? currentStep === 1
                  ? "bg-purple-600 text-white ring-2 ring-purple-300"
                  : "bg-green-500 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            1
          </button>
          <div
            className={`h-1 flex-1 rounded ${currentStep >= 2 ? "bg-purple-600" : "bg-gray-200"}`}
          />
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
              currentStep > 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
            }`}
          >
            2
          </div>
          <div
            className={`h-1 flex-1 rounded ${currentStep >= 3 ? "bg-purple-600" : "bg-gray-200"}`}
          />
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
              currentStep > 2 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
            }`}
          >
            3
          </div>
        </div>

        <div className="mb-8 flex justify-center gap-8 text-xs font-semibold text-gray-600">
          <span>주제 설정</span>
          <span>아웃라인</span>
          <span>글쓰기 완료</span>
        </div>

        {currentStep === 1 && (
          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">블로그 글쓰기</h2>
            <p className="mb-8 text-gray-600">어떤 주제로 블로그 글을 작성할지 알려주세요.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  블로그 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={validateTitle}
                  placeholder="예: 블로그 수익화 첫 달에 해야 할 7가지"
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
                    errors.title
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    핵심 키워드 <span className="text-red-500">*</span>
                    <span className="text-gray-400"> (최대 10개)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSeoKeywords}
                    disabled={generatingKeywords || !title.trim()}
                    className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-200 disabled:opacity-50 transition"
                  >
                    {generatingKeywords ? "생성 중..." : "🤖 AI 추천"}
                  </button>
                </div>
                <input
                  type="text"
                  value={keywordsRaw}
                  onChange={(e) => setKeywordsRaw(e.target.value)}
                  onBlur={validateKeywords}
                  placeholder="쉼표로 구분해 입력하세요"
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
                    errors.keywords
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  }`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{keywordList.length} / 10개</p>
                  {errors.keywords && <p className="text-xs text-red-500">{errors.keywords}</p>}
                </div>
                {keywordList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywordList.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    타겟 독자층
                  </label>
                  <div className="space-y-2">
                    {AUDIENCES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAudience(a)}
                        className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                          audience === a
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-700 hover:border-purple-300"
                        }`}
                      >
                        {AUDIENCE_LABEL[a]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    작성 톤
                  </label>
                  <div className="space-y-2">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                          tone === t
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-700 hover:border-purple-300"
                        }`}
                      >
                        {TONE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-3">📊 SEO 설정</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      포커스 키워드
                    </label>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="예: 블로그 수익화"
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      메타 설명 <span className="text-amber-600">({metaDescription.length} / 160자)</span>
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      onBlur={validateMetaDescription}
                      rows={2}
                      placeholder="검색 결과에 노출될 설명"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none ${
                        errors.metaDescription
                          ? "border-red-400 focus:border-red-500"
                          : "border-amber-200 focus:border-amber-400"
                      }`}
                    />
                    {errors.metaDescription && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.metaDescription}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      슬러그 (URL)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlugOverride(e.target.value)}
                      onBlur={validateSlug}
                      placeholder="blog-monetization-first-month"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none ${
                        errors.slug
                          ? "border-red-400 focus:border-red-500"
                          : "border-amber-200 focus:border-amber-400"
                      }`}
                    />
                    {errors.slug && <p className="text-[11px] text-red-500 mt-1">{errors.slug}</p>}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <button
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
                className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:bg-gray-400"
              >
                {submitting ? "저장 중..." : "아웃라인 생성 → (2단계로)"}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200 text-center">
            <p className="text-gray-600">다음 단계로 이동 중...</p>
            <p className="text-sm text-gray-500 mt-2">페이지를 새로고침해주세요.</p>
          </div>
        )}
      </div>
    </main>
  );
}