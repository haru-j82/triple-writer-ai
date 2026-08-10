"use client";

import { useMemo, useRef, useState, useEffect, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import {
  ImageResolution,
  ImageStyle,
  IMAGE_STYLE_LABEL,
} from "@/lib/agentTypes";
import { uid } from "@/lib/uid";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const STYLES: ImageStyle[] = ["realistic", "illustration", "diagram", "abstract"];
const RESOLUTIONS: ImageResolution[] = ["720x480", "1024x768", "1200x800"];
const GENERATE_CREDIT_LIMIT = 20; // 삽입 위치별 이미지 생성용 (최대 20개)

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    reader.readAsDataURL(file);
  });
}

export default function ImagesPage() {
  const { state: appState, hydrated } = useStore();
  const { state, addImage, removeImage, updateImage, setThumbnail, markStepReached } = useAgentStore();
  const router = useRouter();

  const [tab, setTab] = useState<"upload" | "generate">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 프롬프트는 제목/키워드에서 자동 생성하되, 사용자가 직접 수정하면 그 값을 우선합니다.
  const [promptOverride, setPromptOverride] = useState<string | null>(null);
  const [style, setStyle] = useState<ImageStyle>("realistic");
  const [resolution, setResolution] = useState<ImageResolution>("1024x768");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);

  const [nextError, setNextError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.synthesis) router.replace(state.topic ? "/agent/synthesis" : "/agent");
  }, [hydrated, state.synthesis, state.topic, router]);

  // 페이지 로드 시 이미지 초기화 (새로 고침 시 작업 중인 이미지 삭제)
  useEffect(() => {
    if (!hydrated) return;

    // 페이지가 처음 로드될 때만 실행
    const IMAGES_CLEARED_KEY = "agent_images_cleared_" + state.blogId;
    const alreadyCleared = sessionStorage.getItem(IMAGES_CLEARED_KEY);

    if (!alreadyCleared && state.images.length > 0) {
      // 상태의 이미지 초기화
      state.images.forEach((img) => removeImage(img.id));
      sessionStorage.setItem(IMAGES_CLEARED_KEY, "true");
    }
  }, [hydrated, state.blogId]); // blogId가 변경되면 새로운 이미지 세션 시작

  const autoPrompt = useMemo(() => {
    if (!state.topic) return "";
    const kw = state.topic.seo.focusKeyword || state.topic.keywords[0] || "";
    return `${state.topic.title}${kw ? `, ${kw}` : ""} 관련 블로그 대표 이미지`;
  }, [state.topic]);
  const prompt = promptOverride ?? autoPrompt;

  // 본문을 문단 단위로 분리해 삽입 위치 선택지를 만듭니다.
  const paragraphOptions = useMemo(() => {
    if (!state.synthesis) return [];
    return state.synthesis.content
      .split(/\n\n+/)
      .map((p, i) => ({ index: i, preview: p.replace(/\n/g, " ").slice(0, 30) }))
      .filter((p) => p.preview.trim().length > 0);
  }, [state.synthesis]);

  const thumbnail = state.images.find((im) => im.role === "thumbnail");

  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const list = Array.from(files);
    for (const file of list) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError("jpg, png, webp 형식만 업로드할 수 있습니다.");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setUploadError("파일 크기는 최대 5MB까지 업로드할 수 있습니다.");
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        addImage({
          id: uid(),
          url: dataUrl,
          source: "upload",
          role: state.images.length === 0 ? "thumbnail" : "inline",
          fileName: file.name,
          createdAt: new Date().toISOString(),
        });
      } catch {
        setUploadError("파일 업로드 중 오류가 발생했습니다.");
      }
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleGenerate = () => {
    if (creditsUsed >= GENERATE_CREDIT_LIMIT) {
      setGenerateError("이미지 생성 크레딧을 모두 사용했습니다.");
      return;
    }
    // 삽입 위치 선택 모달 열기
    setShowPositionModal(true);
    setSelectedPositions(new Set());
  };

  const handleTogglePosition = (index: number) => {
    const newSet = new Set(selectedPositions);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedPositions(newSet);
  };

  const handleConfirmPosition = async () => {
    // 첫 이미지인 경우 - 바로 생성 후 삽입 위치 선택 모달로 전환
    if (state.images.length === 0) {
      setGenerating(true);
      setGenerateError(null);
      try {
        const positionPrompt = prompt + " (대표 이미지)";
        await generateSingleImage(positionPrompt, null);
        // 첫 이미지 생성 완료 후 모달 내용 변경 (자동으로 삽입 위치 선택 모달로)
        // 모달은 열린 상태 유지
        setSelectedPositions(new Set());
      } catch (e) {
        setGenerateError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        setShowPositionModal(false);
      } finally {
        setGenerating(false);
      }
      return;
    }

    // 본문 이미지: 선택된 위치 확인
    if (selectedPositions.size === 0) {
      setGenerateError("최소 하나 이상의 삽입 위치를 선택해주세요.");
      return;
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      let successCount = 0;
      // 선택된 각 위치마다 이미지 생성
      for (const position of Array.from(selectedPositions).sort((a, b) => a - b)) {
        // 해당 문단의 내용을 기반으로 더 구체적인 프롬프트 생성
        let enhancedPrompt = prompt;

        if (state.synthesis?.content) {
          const paragraphs = state.synthesis.content.split(/\n\n+/).filter(p => p.trim());
          if (position < paragraphs.length) {
            const paragraphText = paragraphs[position];
            // 문단에서 주요 키워드 추출 (첫 50글자)
            const keywordsFromParagraph = paragraphText
              .substring(0, 100)
              .split(/[\s,\.\-#*]+/)
              .filter(w => w.length > 2 && w.length < 20)
              .slice(0, 3)
              .join(' ');

            if (keywordsFromParagraph) {
              enhancedPrompt = `${keywordsFromParagraph}, ${prompt}`;
            }
          }
        }

        // 각 위치마다 고유한 프롬프트 수정자 추가
        const positionPrompt = enhancedPrompt + ` (문단 ${position + 1})`;
        await generateSingleImage(positionPrompt, position);
        successCount++;
      }

      if (successCount > 0) {
        setShowPositionModal(false);
        setSelectedPositions(new Set());
      }
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleImage = async (positionPrompt: string, position: number | null) => {
    if (creditsUsed >= GENERATE_CREDIT_LIMIT) {
      throw new Error("이미지 생성 크레딧을 모두 사용했습니다.");
    }

    const userId = appState.user?.id || "mock-user-123";
    const blogId = state.blogId || "mock-blog-123";

    const res = await fetch("/api/agent/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: positionPrompt,
        style,
        userId,
        blogId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error ?? "이미지 생성에 실패했습니다.");
    }

    const newImage = {
      id: uid(),
      url: data.imageUrl,
      source: "generated" as const,
      role: (state.images.length === 0 ? "thumbnail" : "inline") as const,
      prompt: positionPrompt,
      style,
      resolution,
      position,
      createdAt: new Date().toISOString(),
    };

    addImage(newImage);
    setCreditsUsed((c) => c + 1);
  };

  const handleRegenerateImage = async (imageId: string) => {
    if (creditsUsed >= GENERATE_CREDIT_LIMIT) {
      setGenerateError("이미지 생성 크레딧을 모두 사용했습니다.");
      return;
    }

    setRegeneratingId(imageId);
    try {
      const userId = appState.user?.id || "mock-user-123";
      const blogId = state.blogId || "mock-blog-123";

      // 기존 이미지 정보 사용해서 재생성
      const image = state.images.find((im) => im.id === imageId);
      if (!image || !image.prompt) {
        throw new Error("이미지 정보를 찾을 수 없습니다.");
      }

      // 매번 다른 이미지를 받기 위해 프롬프트에 고유 수정자 추가
      const regenerationMarker = `[v${Math.random().toString(36).substring(2, 8)}]`;
      const newPrompt = `${image.prompt} ${regenerationMarker}`;

      const res = await fetch("/api/agent/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newPrompt,
          style: image.style || style,
          userId,
          blogId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "이미지 재생성에 실패했습니다.");
      }

      // 기존 이미지 업데이트
      updateImage(imageId, {
        url: data.imageUrl,
      });
      setCreditsUsed((c) => c + 1);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleNext = async () => {
    if (!thumbnail) {
      setNextError("썸네일 이미지를 최소 1개 지정해주세요.");
      return;
    }
    setNavigating(true);
    setNextError(null);
    try {
      const res = await fetch("/api/agent/save-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: state.blogId, images: state.images }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      markStepReached(5);
      router.push("/agent/publish");
    } catch (e) {
      setNextError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setNavigating(false);
    }
  };

  if (!hydrated || !appState.user) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 4. 이미지 추가</h2>
      <p className="mt-1 text-sm text-gray-500">
        썸네일 이미지는 필수이며, 본문 중간에 삽입할 이미지는 선택 사항입니다.
      </p>

      {/* 탭 */}
      <div className="mt-5 flex gap-2 border-b border-gray-200">
        {(["upload", "generate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "upload" ? "이미지 업로드" : "AI 이미지 생성"}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <div className="mt-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragOver ? "border-violet-500 bg-violet-50" : "border-gray-300 hover:border-violet-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <p className="text-sm font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP · 최대 5MB</p>
          </div>
          {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
        </div>
      )}

      {tab === "generate" && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              프롬프트 (제목/키워드 기반 자동 생성, 수정 가능)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPromptOverride(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-600">스타일</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      style === s
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {IMAGE_STYLE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">해상도</p>
              <div className="mt-1.5 flex flex-col gap-2">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      resolution === r
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
            <span>
              이미지 생성 크레딧: {GENERATE_CREDIT_LIMIT - creditsUsed} / {GENERATE_CREDIT_LIMIT}
            </span>
          </div>

          {generateError && <p className="text-xs text-red-500">{generateError}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim() || creditsUsed >= GENERATE_CREDIT_LIMIT}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {generating ? "생성 중..." : "생성"}
          </button>

          {/* 삽입 위치 선택 모달 */}
          {showPositionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-xl bg-white p-6">
                {state.images.length === 0 ? (
                  // 첫 이미지: 바로 생성
                  <>
                    <h3 className="text-lg font-bold">대표 이미지 생성</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      블로그 대표 이미지를 생성합니다. 생성 후 썸네일로 설정할 수 있습니다.
                    </p>
                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => {
                          setShowPositionModal(false);
                          setSelectedPositions(new Set());
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleConfirmPosition}
                        disabled={generating}
                        className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {generating ? "생성 중..." : "생성"}
                      </button>
                    </div>
                  </>
                ) : (
                  // 본문 이미지: 위치 선택
                  <>
                    <h3 className="text-lg font-bold">삽입 위치 선택</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      본문 중 삽입할 위치를 선택하세요 (다중 선택 가능)
                    </p>

                    {paragraphOptions.length > 0 && (
                      <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                        {paragraphOptions.map((p) => (
                          <label
                            key={p.index}
                            className={`flex cursor-pointer items-center rounded-lg border-2 p-3 text-left text-sm transition ${
                              selectedPositions.has(p.index)
                                ? "border-violet-600 bg-violet-50"
                                : "border-gray-200 hover:border-violet-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPositions.has(p.index)}
                              onChange={() => handleTogglePosition(p.index)}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-violet-600"
                            />
                            <div className="ml-3 flex-1">
                              <p className="font-medium">문단 {p.index + 1}</p>
                              <p className="mt-1 text-xs text-gray-500">{p.preview}...</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedPositions.size > 0 && (
                      <div className="mt-3 rounded-lg bg-violet-50 p-2 text-xs text-violet-700">
                        선택된 위치: {Array.from(selectedPositions)
                          .sort((a, b) => a - b)
                          .map((i) => `문단 ${i + 1}`)
                          .join(", ")}
                      </div>
                    )}

                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => {
                          setShowPositionModal(false);
                          setSelectedPositions(new Set());
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleConfirmPosition}
                        disabled={generating || selectedPositions.size === 0}
                        className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {generating ? "생성 중..." : `확인 (${selectedPositions.size}개)`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 이미지 목록 & 배치 설정 */}
      {state.images.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold">이미지 배치</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.images.map((im) => (
              <div key={im.id} className="overflow-hidden rounded-xl border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={im.fileName ?? im.prompt ?? "image"} className="h-36 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        im.role === "thumbnail"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {im.role === "thumbnail" ? "썸네일" : "본문 삽입"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {im.source === "upload" ? "업로드" : "AI 생성"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setThumbnail(im.id)}
                      disabled={im.role === "thumbnail"}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium disabled:opacity-40"
                    >
                      썸네일로 설정
                    </button>
                    {im.source === "generated" && (
                      <button
                        onClick={() => handleRegenerateImage(im.id)}
                        disabled={regeneratingId === im.id || creditsUsed >= GENERATE_CREDIT_LIMIT}
                        className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-600 hover:bg-violet-100 disabled:opacity-40"
                      >
                        {regeneratingId === im.id ? "재생성 중..." : "🔄 AI 생성"}
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(im.id)}
                      className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-500"
                    >
                      삭제
                    </button>
                  </div>

                  {im.role === "inline" && paragraphOptions.length > 0 && (
                    <select
                      value={im.position ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateImage(im.id, { position: val === "" ? undefined : Number(val) });
                      }}
                      className="w-full rounded-md border border-gray-300 p-1.5 text-[11px]"
                    >
                      <option value="">삽입 위치 선택 안 함</option>
                      {paragraphOptions.map((p) => (
                        <option key={p.index} value={p.index}>
                          문단 {p.index + 1}: {p.preview}...
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nextError && <p className="mt-4 text-sm text-red-500">{nextError}</p>}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/agent/synthesis")}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={navigating}
          className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {navigating ? "저장 중..." : "다음"}
        </button>
      </div>
    </div>
  );
}
