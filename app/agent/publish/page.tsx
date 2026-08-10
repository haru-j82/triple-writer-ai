"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import { PublishMode } from "@/lib/agentTypes";
import { renderMarkdown } from "@/lib/markdown";
import { uid } from "@/lib/uid";
import { publishToNaver, publishToGoogle, saveSyncHistory } from "@/lib/blogSync";

const TIMEZONES = [
  { value: "Asia/Seoul", label: "서울 (UTC+9)" },
  { value: "UTC", label: "협정 세계시 (UTC)" },
  { value: "America/New_York", label: "뉴욕 (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "로스앤젤레스 (UTC-8/-7)" },
  { value: "Europe/London", label: "런던 (UTC+0/+1)" },
];

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function PublishPage() {
  const { state: appState, hydrated, addPost } = useStore();
  const { state, setPublishOptions, markPublished, resetAgent } = useAgentStore();
  const router = useRouter();

  const [mode, setMode] = useState<PublishMode>(state.publish.mode);
  const [date, setDate] = useState(state.publish.scheduledDate ?? todayStr());
  const [time, setTime] = useState(state.publish.scheduledTime ?? "09:00");
  const [timezone, setTimezone] = useState(state.publish.timezone ?? "Asia/Seoul");

  const [publishToNaver_, setPublishToNaver] = useState(false);
  const [naverCategory, setNaverCategory] = useState("");
  const [publishToGoogle_, setPublishToGoogle] = useState(false);
  const [googleTags, setGoogleTags] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!appState.user?.connectedBlogs) return;
    const blogs = appState.user.connectedBlogs;
    if (blogs.naver) {
      setNaverCategory(blogs.naver.category);
    }
    if (blogs.google) {
      setGoogleTags(blogs.google.tags.join(", "));
    }
  }, [appState.user?.connectedBlogs]);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.synthesis) router.replace(state.topic ? "/agent/synthesis" : "/agent");
  }, [hydrated, state.synthesis, state.topic, router]);

  const thumbnail = state.images.find((im) => im.role === "thumbnail");
  const inlineImages = state.images.filter((im) => im.role === "inline" && im.position !== undefined);

  const bodyHtml = useMemo(() => {
    if (!state.synthesis) return "";
    const paragraphs = state.synthesis.content.split(/\n\n+/);
    return paragraphs
      .map((p, i) => {
        const html = renderMarkdown(p);
        const img = inlineImages.find((im) => im.position === i);
        const imgHtml = img
          ? `<img src="${img.url}" alt="본문 이미지" class="my-4 w-full rounded-lg object-cover" />`
          : "";
        return html + imgHtml;
      })
      .join("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.synthesis, state.images]);

  // 필드가 모두 채워졌는지만 렌더링 중 순수하게 판단 (실제 "미래 시각" 검증은 제출 시점에 수행)
  const hasScheduleFields = mode === "now" || (!!date && !!time);

  const isFutureDateTime = (d: string, t: string) => {
    const target = new Date(`${d}T${t}:00`);
    return target.getTime() > new Date().getTime();
  };

  const handlePublish = async () => {
    if (!state.synthesis) return;
    if (mode === "scheduled" && (!date || !time || !isFutureDateTime(date, time))) {
      setError("예약 발행 시간은 현재 시각 이후로 설정해주세요.");
      return;
    }
    setError(null);
    setPublishing(true);

    const publishOptions =
      mode === "now"
        ? { mode: "now" as const }
        : { mode: "scheduled" as const, scheduledDate: date, scheduledTime: time, timezone };
    setPublishOptions(publishOptions);

    try {
      const res = await fetch("/api/agent/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: state.blogId,
          publish: publishOptions,
          title: state.synthesis.title,
          metaDescription: state.synthesis.metaDescription,
          content: state.synthesis.content,
          images: state.images,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "발행에 실패했습니다.");
      }

      markPublished(mode === "now" ? "published" : "scheduled", data.blog?.publishedAt);

      const postId = uid();
      const blogSyncStatus = [];

      // 네이버 블로그에 발행
      if (publishToNaver_ && appState.user?.connectedBlogs?.naver) {
        try {
          const naverResult = await publishToNaver(
            {
              title: state.synthesis.title,
              content: state.synthesis.content,
              metaDescription: state.synthesis.metaDescription,
              scheduledDate: mode === "scheduled" ? date : undefined,
              scheduledTime: mode === "scheduled" ? time : undefined,
              category: naverCategory || appState.user.connectedBlogs.naver.category,
            },
            appState.user.connectedBlogs.naver.blogUrl
          );

          if (naverResult.success) {
            blogSyncStatus.push({
              platform: "naver",
              status: mode === "now" ? "published" : "scheduled",
              publishedAt: naverResult.scheduledPublishAt || new Date().toISOString(),
            });

            saveSyncHistory({
              postId,
              postTitle: state.synthesis.title,
              platform: "naver",
              status: mode === "now" ? "published" : "scheduled",
              publishedAt: naverResult.scheduledPublishAt || new Date().toISOString(),
              postUrl: naverResult.postUrl,
            });
          }
        } catch (e) {
          blogSyncStatus.push({
            platform: "naver",
            status: "failed",
            errorMessage: e instanceof Error ? e.message : "발행 실패",
            publishedAt: new Date().toISOString(),
          });

          saveSyncHistory({
            postId,
            postTitle: state.synthesis.title,
            platform: "naver",
            status: "failed",
            publishedAt: new Date().toISOString(),
            errorMessage: e instanceof Error ? e.message : "발행 실패",
          });
        }
      }

      // 구글 블로그에 발행
      if (publishToGoogle_ && appState.user?.connectedBlogs?.google) {
        try {
          const tags = googleTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);

          const googleResult = await publishToGoogle(
            {
              title: state.synthesis.title,
              content: state.synthesis.content,
              metaDescription: state.synthesis.metaDescription,
              scheduledDate: mode === "scheduled" ? date : undefined,
              scheduledTime: mode === "scheduled" ? time : undefined,
              tags: tags.length > 0 ? tags : appState.user.connectedBlogs.google.tags,
            },
            appState.user.connectedBlogs.google.blogUrl
          );

          if (googleResult.success) {
            blogSyncStatus.push({
              platform: "google",
              status: mode === "now" ? "published" : "scheduled",
              publishedAt: googleResult.scheduledPublishAt || new Date().toISOString(),
            });

            saveSyncHistory({
              postId,
              postTitle: state.synthesis.title,
              platform: "google",
              status: mode === "now" ? "published" : "scheduled",
              publishedAt: googleResult.scheduledPublishAt || new Date().toISOString(),
              postUrl: googleResult.postUrl,
            });
          }
        } catch (e) {
          blogSyncStatus.push({
            platform: "google" as const,
            status: "failed" as const,
            errorMessage: e instanceof Error ? e.message : "발행 실패",
            publishedAt: new Date().toISOString(),
          });

          saveSyncHistory({
            postId,
            postTitle: state.synthesis.title,
            platform: "google",
            status: "failed",
            publishedAt: new Date().toISOString(),
            errorMessage: e instanceof Error ? e.message : "발행 실패",
          });
        }
      }

      addPost({
        id: postId,
        mode: "agent",
        title: state.synthesis.title,
        content: state.synthesis.content,
        createdAt: new Date().toISOString(),
        topic: state.topic?.title ?? state.synthesis.title,
        metaDescription: state.synthesis.metaDescription,
        keyword: state.topic?.seo.focusKeyword,
        hashtags: state.topic?.keywords.map((k) => `#${k.replace(/\s+/g, "")}`),
        blogSync: blogSyncStatus.length > 0 ? blogSyncStatus : undefined,
      });

      setDone(true);
      setTimeout(() => {
        resetAgent();
        router.push("/dashboard");
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setPublishing(false);
    }
  };

  if (!hydrated || !appState.user) return null;
  if (!state.synthesis) return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-6">
      <h2 className="text-lg font-bold">Step 5. 발행 & 예약</h2>
      <p className="mt-1 text-sm text-gray-500">최종 결과를 확인하고 지금 바로, 또는 원하는 시간에 발행하세요.</p>

      {done && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
          {mode === "now" ? "발행이 완료되었습니다!" : "예약이 완료되었습니다!"} 대시보드로 이동합니다...
        </div>
      )}

      {/* 최종 미리보기 */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail.url} alt="썸네일" className="h-56 w-full object-cover" />
        )}
        <div className="p-5">
          <h1 className="text-xl font-bold">{state.synthesis.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{state.synthesis.metaDescription}</p>
          <div
            className="prose prose-sm mt-4 max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </div>

      {/* 발행 옵션 */}
      <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold">발행 옵션</p>
        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "now"}
              onChange={() => setMode("now")}
              className="accent-violet-600"
            />
            지금 발행
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "scheduled"}
              onChange={() => setMode("scheduled")}
              className="accent-violet-600"
            />
            예약 발행
          </label>
        </div>

        {mode === "scheduled" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">날짜</label>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">시간</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">타임존</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-violet-500 focus:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            {!hasScheduleFields && (
              <p className="sm:col-span-3 text-xs text-red-500">날짜와 시간을 모두 입력해주세요.</p>
            )}
          </div>
        )}
      </div>

      {/* 외부 블로그 동기화 옵션 */}
      <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold">연동된 블로그에도 발행</p>
        <p className="mt-1 text-xs text-gray-500">
          선택한 블로그 플랫폼에도 같은 내용으로 발행합니다.
        </p>

        <div className="mt-4 space-y-3">
          {appState.user?.connectedBlogs?.naver && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={publishToNaver_}
                  onChange={(e) => setPublishToNaver(e.target.checked)}
                  className="mt-1 accent-green-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-green-900">네이버 블로그</p>
                  <p className="text-xs text-green-700">{appState.user.connectedBlogs.naver.blogUrl}</p>
                  {publishToNaver_ && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-green-800">카테고리</label>
                      <input
                        type="text"
                        value={naverCategory}
                        onChange={(e) => setNaverCategory(e.target.value)}
                        placeholder={appState.user.connectedBlogs.naver.category}
                        className="mt-1 w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-xs focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          {appState.user?.connectedBlogs?.google && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={publishToGoogle_}
                  onChange={(e) => setPublishToGoogle(e.target.checked)}
                  className="mt-1 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">구글 블로그</p>
                  <p className="text-xs text-blue-700">{appState.user.connectedBlogs.google.blogUrl}</p>
                  {publishToGoogle_ && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-blue-800">태그</label>
                      <input
                        type="text"
                        value={googleTags}
                        onChange={(e) => setGoogleTags(e.target.value)}
                        placeholder={appState.user.connectedBlogs.google.tags.join(", ")}
                        className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          {!appState.user?.connectedBlogs?.naver && !appState.user?.connectedBlogs?.google && (
            <p className="text-xs text-gray-400">
              연동된 블로그가 없습니다.{" "}
              <a href="/settings/blog-sync" className="font-medium text-violet-600 hover:underline">
                설정하기
              </a>
            </p>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/agent/images")}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
        >
          이전
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing || done || (mode === "scheduled" && !hasScheduleFields)}
          className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {publishing ? "처리 중..." : "발행"}
        </button>
      </div>
    </div>
  );
}
