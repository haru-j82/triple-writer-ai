"use client";

import { useState } from "react";
import { Trash2, Plus, Minus, Copy, Save, RotateCcw } from "lucide-react";

/**
 * 가제트AI 정보성 v2 (이미지 생성 포함) - 3-Step 블로그 글쓰기
 * Step 1: 주제 설정
 * Step 2: 아웃라인 구성
 * Step 3: 글쓰기 완료
 */

type BlogType = "info" | "review" | "travel" | "food";
type Tone = "전문가" | "일반인" | "초보자" | "친근한";
type ContentType = "기술" | "라이프" | "비즈니스" | "건강";

interface Section {
  id: string;
  title: string;
  description: string;
}

interface FormData {
  author: string;
  blogType: BlogType;
  topic: string;
  title: string;
  keywords: string[];
  tone: Tone;
  contentType: ContentType;
  imageEnabled: boolean;
  imageStyle: "사진" | "일러스트" | "3D";
  imageCount: number;
  thumbnailEnabled: boolean;
  webSearchEnabled: boolean;
  focusKeyword: string;
  metaDescription: string;
  blogUrl: string;
}

const BLOG_TYPES = {
  info: "정보성 블로그",
  review: "제품 사용후기",
  travel: "여행 후기",
  food: "음식 리뷰",
};

const TONES = ["전문가", "일반인", "초보자", "친근한"] as const;
const CONTENT_TYPES = ["기술", "라이프", "비즈니스", "건강"] as const;

export default function InfoV2BlogPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    author: "하루",
    blogType: "info",
    topic: "",
    title: "",
    keywords: [],
    tone: "일반인",
    contentType: "기술",
    imageEnabled: false,
    imageStyle: "사진",
    imageCount: 1,
    thumbnailEnabled: false,
    webSearchEnabled: true,
    focusKeyword: "",
    metaDescription: "",
    blogUrl: "blog-title-url",
  });

  const [outline, setOutline] = useState<Section[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [recommendedTitles, setRecommendedTitles] = useState<string[]>([]);
  const [recommendedKeywords, setRecommendedKeywords] = useState<
    { keyword: string; volume: number; competition: number }[]
  >([]);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);

  // Step 1: 주제 설정
  const handleGenerateOutline = async () => {
    if (!formData.topic || !formData.title) {
      alert("주제와 제목을 입력하세요");
      return;
    }
    setLoading(true);
    try {
      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const sampleOutline: Section[] = [
        {
          id: "1",
          title: "머릿말",
          description: formData.title + "에 대한 소개 및 배경",
        },
        {
          id: "2",
          title: "주요 특징 1",
          description: "첫 번째 특징에 대한 설명",
        },
        {
          id: "3",
          title: "주요 특징 2",
          description: "두 번째 특징에 대한 설명",
        },
        {
          id: "4",
          title: "사용 방법",
          description: "실제 사용 방법 및 팁",
        },
        {
          id: "5",
          title: "장점",
          description: "이 제품/주제의 장점",
        },
        {
          id: "6",
          title: "단점",
          description: "개선이 필요한 부분",
        },
        {
          id: "7",
          title: "가격 및 구매처",
          description: "가격 정보 및 구매 링크",
        },
        {
          id: "8",
          title: "결론",
          description: "종합 평가 및 추천",
        },
      ];
      setOutline(sampleOutline);
      setStep(2);
    } catch (error) {
      alert("아웃라인 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 아웃라인 수정
  const handleReorderOutline = (draggedId: string, targetId: string) => {
    const draggedIndex = outline.findIndex((s) => s.id === draggedId);
    const targetIndex = outline.findIndex((s) => s.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOutline = [...outline];
    [newOutline[draggedIndex], newOutline[targetIndex]] = [
      newOutline[targetIndex],
      newOutline[draggedIndex],
    ];
    setOutline(newOutline);
  };

  const addSection = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setOutline([
      ...outline,
      {
        id: newId,
        title: "새로운 섹션",
        description: "섹션 설명을 입력하세요",
      },
    ]);
  };

  const deleteSection = (id: string) => {
    setOutline(outline.filter((s) => s.id !== id));
  };

  // Step 3: 글 생성
  const handleGenerateContent = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const sampleContent = `# ${formData.title}

${outline.map((s) => `## ${s.title}\n${s.description}\n`).join("\n")}

---

작성자: ${formData.author}
주제: ${formData.topic}
톤: ${formData.tone}
내용 유형: ${formData.contentType}
`;
      setGeneratedContent(sampleContent);
      setStep(3);
    } catch (error) {
      alert("글 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // AI 추천 제목 모달
  const generateTitles = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRecommendedTitles([
        `${formData.topic}, 초보자도 쉽게 이해하는 가이드`,
        `${formData.topic} 완벽 비교분석 2024`,
        `${formData.topic}, 이것만 알면 충분합니다`,
        `${formData.topic}로 생산성 높이는 5가지 방법`,
        `${formData.topic} 구매 전 꼭 봐야 할 체크리스트`,
      ]);
      setShowTitleModal(true);
    } finally {
      setLoading(false);
    }
  };

  const applyTitle = (title: string) => {
    setFormData({ ...formData, title });
    setShowTitleModal(false);
  };

  // AI 추천 키워드 모달
  const generateKeywords = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRecommendedKeywords([
        { keyword: formData.topic, volume: 50000, competition: 45 },
        { keyword: `${formData.topic} 추천`, volume: 32000, competition: 32 },
        { keyword: `${formData.topic} 리뷰`, volume: 28000, competition: 38 },
        { keyword: `${formData.topic} 비교`, volume: 18000, competition: 25 },
        { keyword: `${formData.topic} 구매`, volume: 15000, competition: 22 },
      ]);
      setShowKeywordModal(true);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = (keyword: string) => {
    if (!formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword],
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl font-bold text-purple-600">🚀 가제트 AI</div>
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              정보성 v2
            </span>
          </div>
          <p className="text-gray-600">
            작성자: <span className="font-semibold">{formData.author}</span>
          </p>
        </div>

        {/* 3-Step 진행도 */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setStep(1)}
            disabled={step === 1}
            className={`flex h-14 w-14 items-center justify-center rounded-full font-bold text-lg transition ${
              step >= 1
                ? step === 1
                  ? "bg-purple-600 text-white ring-4 ring-purple-300"
                  : "bg-green-500 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </button>
          <div
            className={`h-1 w-32 rounded ${step >= 2 ? "bg-purple-600" : "bg-gray-300"}`}
          />
          <button
            onClick={() => step >= 2 && setStep(2)}
            disabled={step < 2}
            className={`flex h-14 w-14 items-center justify-center rounded-full font-bold text-lg transition ${
              step >= 2
                ? step === 2
                  ? "bg-purple-600 text-white ring-4 ring-purple-300"
                  : "bg-green-500 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {step > 2 ? "✓" : "2"}
          </button>
          <div
            className={`h-1 w-32 rounded ${step >= 3 ? "bg-purple-600" : "bg-gray-300"}`}
          />
          <button
            onClick={() => step >= 3 && setStep(3)}
            disabled={step < 3}
            className={`flex h-14 w-14 items-center justify-center rounded-full font-bold text-lg transition ${
              step === 3
                ? "bg-purple-600 text-white ring-4 ring-purple-300"
                : step > 3
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-500"
            }`}
          >
            {step > 3 ? "✓" : "3"}
          </button>
        </div>

        <div className="mb-4 flex justify-center gap-12 text-xs font-semibold text-gray-600">
          <span>주제 설정</span>
          <span>아웃라인 구성</span>
          <span>글쓰기 완료</span>
        </div>

        {/* Step 1: 주제 설정 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
              <h2 className="mb-8 text-3xl font-bold text-gray-900">블로그 글쓰기</h2>
              <p className="mb-8 text-gray-600">
                어떤 주제로 블로그 글을 작성할지 알려주세요.
              </p>

              <div className="space-y-7">
                {/* 블로그 유형 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    블로그 유형 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.blogType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        blogType: e.target.value as BlogType,
                      })
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    {Object.entries(BLOG_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 주제 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    주제/제품명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 노이즈 캔슬링 무선 이어폰"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* 블로그 제목 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    블로그 제목 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="블로그 제목을 입력하세요"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <button
                      onClick={generateTitles}
                      disabled={loading || !formData.topic}
                      className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      AI 추천
                    </button>
                  </div>
                </div>

                {/* 핵심 키워드 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    핵심 키워드 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="키워드를 입력하거나 AI 추천을 사용하세요"
                      value={formData.focusKeyword}
                      onChange={(e) =>
                        setFormData({ ...formData, focusKeyword: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && formData.focusKeyword) {
                          addKeyword(formData.focusKeyword);
                          setFormData({ ...formData, focusKeyword: "" });
                        }
                      }}
                      className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <button
                      onClick={generateKeywords}
                      disabled={loading || !formData.topic}
                      className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      AI 추천
                    </button>
                  </div>

                  {/* 선택된 키워드 */}
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((kw) => (
                      <div
                        key={kw}
                        className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2"
                      >
                        <span className="text-sm font-semibold text-purple-700">
                          {kw}
                        </span>
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="text-purple-700 hover:text-purple-900"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 톤 & 컨텐츠 유형 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      톤 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setFormData({ ...formData, tone })}
                          className={`rounded-lg px-4 py-2 font-semibold transition ${
                            formData.tone === tone
                              ? "bg-purple-600 text-white ring-2 ring-purple-300"
                              : "border-2 border-gray-300 text-gray-700 hover:border-purple-500"
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      컨텐츠 유형 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CONTENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setFormData({ ...formData, contentType: type })
                          }
                          className={`rounded-lg px-4 py-2 font-semibold transition ${
                            formData.contentType === type
                              ? "bg-purple-600 text-white ring-2 ring-purple-300"
                              : "border-2 border-gray-300 text-gray-700 hover:border-purple-500"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 이미지 생성 옵션 */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-2 border-blue-200">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.imageEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          imageEnabled: e.target.checked,
                        })
                      }
                      className="h-6 w-6 rounded border-gray-300 text-purple-600 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-900">
                      이미지 생성 (+1 코인)
                    </span>
                  </label>

                  {formData.imageEnabled && (
                    <div className="space-y-4 ml-9">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          이미지 스타일
                        </label>
                        <select
                          value={formData.imageStyle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              imageStyle: e.target.value as any,
                            })
                          }
                          className="w-full rounded-lg border-2 border-blue-300 px-3 py-2 text-sm"
                        >
                          <option>사진</option>
                          <option>일러스트</option>
                          <option>3D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          이미지 개수 ({formData.imageCount}개)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.imageCount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              imageCount: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.thumbnailEnabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnailEnabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                          썸네일 생성 별도 (+0.5 코인)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* SEO 설정 */}
                <div className="rounded-xl bg-amber-50 p-6 border-2 border-amber-200">
                  <div className="text-sm font-bold text-amber-900 mb-4">
                    📊 SEO 설정
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        포커스 키워드
                      </label>
                      <input
                        type="text"
                        value={formData.focusKeyword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            focusKeyword: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border-2 border-amber-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        메타 설명 (0 / 160자)
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value.slice(0, 160),
                          })
                        }
                        maxLength={160}
                        className="w-full rounded-lg border-2 border-amber-300 px-3 py-2 text-sm resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        블로그 URL
                      </label>
                      <input
                        type="text"
                        value={formData.blogUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, blogUrl: e.target.value })
                        }
                        className="w-full rounded-lg border-2 border-amber-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 웹 검색 옵션 */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.webSearchEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        webSearchEnabled: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-purple-600 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    최신 검색정보 활용 (실시간 웹 정보 반영)
                  </span>
                </label>

                {/* 다음 버튼 */}
                <button
                  onClick={handleGenerateOutline}
                  disabled={loading || !formData.topic || !formData.title}
                  className="w-full rounded-xl bg-purple-600 px-6 py-4 font-bold text-white hover:bg-purple-700 disabled:bg-gray-400 transition text-lg"
                >
                  {loading ? "생성 중..." : "아웃라인 생성 →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 아웃라인 구성 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                아웃라인 구성
              </h2>
              <p className="mb-8 text-gray-600">
                각 섹션을 드래그로 순서를 변경하거나 +/− 버튼으로 추가/삭제할 수 있습니다.
              </p>

              {/* 아웃라인 목록 */}
              <div className="mb-8 space-y-3">
                {outline.map((section, idx) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => setDraggedItem(section.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() =>
                      draggedItem && handleReorderOutline(draggedItem, section.id)
                    }
                    onDragEnd={() => setDraggedItem(null)}
                    className={`flex items-center gap-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-4 cursor-move transition ${
                      draggedItem === section.id
                        ? "opacity-50 bg-purple-100"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl cursor-grab">⋮⋮</span>

                    <div className="flex-1">
                      <div className="font-bold text-gray-900">
                        {idx + 1}. {section.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {section.description}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newOutline = [...outline];
                          newOutline.splice(idx, 0, {
                            id: Math.random().toString(36).substr(2, 9),
                            title: "새로운 섹션",
                            description: "설명을 입력하세요",
                          });
                          setOutline(newOutline);
                        }}
                        className="text-gray-400 hover:text-purple-600 text-xl"
                        title="섹션 추가"
                      >
                        +
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="text-gray-400 hover:text-red-600 text-xl"
                        title="섹션 삭제"
                      >
                        −
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 재생성 버튼 */}
              <button
                onClick={handleGenerateOutline}
                disabled={loading}
                className="mb-4 w-full rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                ↻ 아웃라인 다시 생성
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={handleGenerateContent}
                disabled={loading || outline.length === 0}
                className="w-full rounded-xl bg-purple-600 px-6 py-4 font-bold text-white hover:bg-purple-700 disabled:bg-gray-400 transition text-lg"
              >
                {loading ? "생성 중..." : "글쓰기 생성 → (5 코인)"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 글쓰기 완료 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                {formData.title}
              </h2>
              <div className="mb-8 flex gap-6 text-sm text-gray-500">
                <span>글자수: {generatedContent.length.toLocaleString()}</span>
                <span>
                  바이트: {new TextEncoder().encode(generatedContent).length.toLocaleString()}
                </span>
              </div>

              {/* 생성된 글 */}
              <div className="mb-8 max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-6 text-sm leading-relaxed text-gray-800 font-mono">
                {generatedContent || "글이 생성되는 중입니다..."}
              </div>

              {/* 버튼 그룹 */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-50 transition">
                  <Copy size={18} />
                  복사
                </button>
                <button className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 transition">
                  <Save size={18} />
                  보관함에 저장
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setFormData({
                      ...formData,
                      topic: "",
                      title: "",
                      keywords: [],
                    });
                    setOutline([]);
                    setGeneratedContent("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300 transition"
                >
                  <RotateCcw size={18} />
                  처음부터 시작
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI 추천 제목 모달 */}
      {showTitleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-2xl bg-white p-8 shadow-xl max-w-md w-full mx-4">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">
              AI 추천 제목
            </h3>
            <div className="space-y-3 mb-6">
              {recommendedTitles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTitle(title)}
                  className="w-full text-left p-4 rounded-lg border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition font-semibold text-gray-900"
                >
                  {title}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTitleModal(false)}
              className="w-full rounded-lg bg-gray-200 py-2 font-bold text-gray-700 hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* AI 추천 키워드 모달 */}
      {showKeywordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="rounded-2xl bg-white p-8 shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">
              AI 추천 키워드
            </h3>
            <div className="mb-6 space-y-3">
              {recommendedKeywords.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addKeyword(item.keyword);
                    setShowKeywordModal(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition"
                >
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{item.keyword}</div>
                    <div className="text-sm text-gray-600">
                      검색량: {item.volume.toLocaleString()} | 경쟁도: {item.competition}
                    </div>
                  </div>
                  <span className="text-purple-600 font-bold">+</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowKeywordModal(false)}
              className="w-full rounded-lg bg-gray-200 py-2 font-bold text-gray-700 hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
