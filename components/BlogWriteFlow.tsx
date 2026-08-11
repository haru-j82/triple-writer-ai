"use client";

import { useState } from "react";
import { Copy, Save, RotateCcw } from "lucide-react";

interface BlogFlowProps {
  templateName: string;
  templateIcon: string;
  blogTypes?: { [key: string]: string };
}

interface Section {
  id: string;
  title: string;
  description: string;
}

export default function BlogWriteFlow({
  templateName,
  templateIcon,
  blogTypes = {},
}: BlogFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    author: "하루",
    topic: "",
    title: "",
    keywords: [] as string[],
    selectedBlogType: Object.keys(blogTypes)[0] || "general",
  });

  const [outline, setOutline] = useState<Section[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [recommendedTitles, setRecommendedTitles] = useState<string[]>([]);
  const [recommendedKeywords, setRecommendedKeywords] = useState<
    { keyword: string; volume: number; competition: number }[]
  >([]);

  const handleGenerateOutline = async () => {
    if (!formData.topic || !formData.title) {
      alert("주제와 제목을 입력하세요");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const sampleOutline: Section[] = [
        {
          id: "1",
          title: "머릿말",
          description: formData.title + "에 대한 소개",
        },
        {
          id: "2",
          title: "주요 포인트 1",
          description: "첫 번째 핵심",
        },
        {
          id: "3",
          title: "주요 포인트 2",
          description: "두 번째 핵심",
        },
        {
          id: "4",
          title: "주요 포인트 3",
          description: "세 번째 핵심",
        },
        {
          id: "5",
          title: "활용법",
          description: "실제 활용 방법",
        },
        {
          id: "6",
          title: "추가 정보",
          description: "보충 정보",
        },
        {
          id: "7",
          title: "결론",
          description: "종합 평가",
        },
      ];
      setOutline(sampleOutline);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const content = `# ${formData.title}\n\n${outline
        .map((s) => `## ${s.title}\n${s.description}\n`)
        .join("\n")}\n\n작성자: ${formData.author}\n주제: ${formData.topic}`;
      setGeneratedContent(content);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const generateTitles = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRecommendedTitles([
        `${formData.topic}, 모두가 알아야 할 사실`,
        `${formData.topic} 완벽 가이드 2024`,
        `${formData.topic}로 시작하는 스마트한 생활`,
        `${formData.topic}, 이것만 알면 끝!`,
        `${formData.topic} vs 다른 선택지, 어떤 게 나을까?`,
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

  const generateKeywords = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRecommendedKeywords([
        { keyword: formData.topic, volume: 50000, competition: 45 },
        { keyword: `${formData.topic} 추천`, volume: 32000, competition: 32 },
        { keyword: `${formData.topic} 리뷰`, volume: 28000, competition: 38 },
        { keyword: `${formData.topic} 가이드`, volume: 18000, competition: 25 },
        { keyword: `${formData.topic} 팁`, volume: 15000, competition: 22 },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">{templateIcon}</div>
            <div>
              <div className="text-3xl font-bold text-purple-600">가제트 AI</div>
              <div className="text-sm text-gray-600">{templateName}</div>
            </div>
          </div>
        </div>

        {/* 3-Step 진행도 */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setStep(1)}
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

        <div className="mb-8 flex justify-center gap-12 text-xs font-bold text-gray-600">
          <span>주제 설정</span>
          <span>아웃라인 구성</span>
          <span>글쓰기 완료</span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">블로그 글쓰기</h2>

            <div className="space-y-6">
              {Object.keys(blogTypes).length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    블로그 유형
                  </label>
                  <select
                    value={formData.selectedBlogType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selectedBlogType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    {Object.entries(blogTypes).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  주제/제품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="주제를 입력하세요"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  블로그 제목 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="제목을 입력하세요"
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

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  핵심 키워드
                </label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="키워드를 입력하거나 AI 추천 사용"
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
                        onClick={() =>
                          setFormData({
                            ...formData,
                            keywords: formData.keywords.filter(
                              (k) => k !== kw
                            ),
                          })
                        }
                        className="text-purple-700 hover:text-purple-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateOutline}
                disabled={loading || !formData.topic || !formData.title}
                className="w-full rounded-xl bg-purple-600 px-6 py-4 font-bold text-white hover:bg-purple-700 disabled:bg-gray-400 transition text-lg"
              >
                {loading ? "생성 중..." : "아웃라인 생성 →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
            <h2 className="mb-8 text-3xl font-bold text-gray-900">
              아웃라인 구성
            </h2>

            <div className="mb-8 space-y-3">
              {outline.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-4"
                >
                  <span className="text-2xl cursor-grab">⋮⋮</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">
                      {section.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {section.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateContent}
              disabled={loading || outline.length === 0}
              className="w-full rounded-xl bg-purple-600 px-6 py-4 font-bold text-white hover:bg-purple-700 disabled:bg-gray-400 transition text-lg"
            >
              {loading ? "생성 중..." : "글쓰기 생성 → (4 코인)"}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-200">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              {formData.title}
            </h2>
            <div className="mb-8 flex gap-6 text-sm text-gray-500">
              <span>글자수: {generatedContent.length}</span>
              <span>
                바이트:{" "}
                {new TextEncoder().encode(generatedContent).length}
              </span>
            </div>

            <div className="mb-8 max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-6 text-sm leading-relaxed text-gray-800">
              {generatedContent || "글이 생성되는 중입니다..."}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-50">
                <Copy size={18} />
                복사
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700">
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
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300"
              >
                <RotateCcw size={18} />
                처음부터 시작
              </button>
            </div>
          </div>
        )}

        {/* 제목 모달 */}
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

        {/* 키워드 모달 */}
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
                      <div className="font-bold text-gray-900">
                        {item.keyword}
                      </div>
                      <div className="text-sm text-gray-600">
                        검색량: {item.volume.toLocaleString()} | 경쟁도:{" "}
                        {item.competition}
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
    </div>
  );
}
