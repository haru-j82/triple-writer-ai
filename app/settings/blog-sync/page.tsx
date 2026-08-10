"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function BlogSyncSettingsPage() {
  const { state: appState, hydrated, connectBlog, disconnectBlog } = useStore();
  const router = useRouter();

  const [naverBlogUrl, setNaverBlogUrl] = useState("");
  const [naverCategory, setNaverCategory] = useState("");
  const [googleBlogUrl, setGoogleBlogUrl] = useState("");
  const [googleTags, setGoogleTags] = useState("");
  const [naverConnected, setNaverConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!appState.user?.connectedBlogs) return;
    const blogs = appState.user.connectedBlogs;
    if (blogs.naver) {
      setNaverConnected(true);
      setNaverBlogUrl(blogs.naver.blogUrl);
      setNaverCategory(blogs.naver.category);
    }
    if (blogs.google) {
      setGoogleConnected(true);
      setGoogleBlogUrl(blogs.google.blogUrl);
      setGoogleTags(blogs.google.tags.join(", "));
    }
  }, [appState.user?.connectedBlogs]);

  const handleNaverConnect = async () => {
    if (!naverBlogUrl.trim() || !naverCategory.trim()) {
      setMessage({ type: "error", text: "블로그 주소와 카테고리를 입력해주세요." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Mock: 실제 환경에서는 네이버 OAuth 연동
      await new Promise((r) => setTimeout(r, 300));

      connectBlog("naver", {
        blogUrl: naverBlogUrl,
        category: naverCategory,
      });

      setNaverConnected(true);
      setMessage({ type: "success", text: "네이버 블로그가 연동되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: "연동에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleNaverDisconnect = () => {
    disconnectBlog("naver");
    setNaverConnected(false);
    setNaverBlogUrl("");
    setNaverCategory("");
    setMessage({ type: "success", text: "네이버 블로그 연동이 해제되었습니다." });
  };

  const handleGoogleConnect = async () => {
    if (!googleBlogUrl.trim() || !googleTags.trim()) {
      setMessage({ type: "error", text: "블로그 주소와 태그를 입력해주세요." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Mock: 실제 환경에서는 구글 OAuth 연동
      await new Promise((r) => setTimeout(r, 300));

      const tags = googleTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      connectBlog("google", {
        blogUrl: googleBlogUrl,
        tags,
      });

      setGoogleConnected(true);
      setMessage({ type: "success", text: "구글 블로그가 연동되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: "연동에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleDisconnect = () => {
    disconnectBlog("google");
    setGoogleConnected(false);
    setGoogleBlogUrl("");
    setGoogleTags("");
    setMessage({ type: "success", text: "구글 블로그 연동이 해제되었습니다." });
  };

  if (!hydrated || !appState.user) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
          대시보드
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">블로그 연동 설정</h1>
      </div>

      <p className="text-gray-600">
        네이버 블로그와 구글 블로그(Blogger)를 연동하여 한 번에 여러 플랫폼으로 글을 발행할 수
        있습니다.
      </p>

      {message && (
        <div
          className={`mt-6 rounded-lg p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 네이버 블로그 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">네이버 블로그</h2>
            <p className="mt-1 text-sm text-gray-500">
              {naverConnected ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  연동됨
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-300"></span>
                  미연동
                </span>
              )}
            </p>
          </div>
          {naverConnected && (
            <button
              onClick={handleNaverDisconnect}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              연동 해제
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">블로그 주소</label>
            <input
              type="text"
              placeholder="예: https://blog.naver.com/yourname"
              value={naverBlogUrl}
              onChange={(e) => setNaverBlogUrl(e.target.value)}
              disabled={naverConnected}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:bg-gray-50 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">기본 카테고리</label>
            <input
              type="text"
              placeholder="예: 마케팅, 기술 블로그"
              value={naverCategory}
              onChange={(e) => setNaverCategory(e.target.value)}
              disabled={naverConnected}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:bg-gray-50 focus:border-violet-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">발행 시 이 카테고리로 게시됩니다.</p>
          </div>

          {!naverConnected && (
            <button
              onClick={handleNaverConnect}
              disabled={saving}
              className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            >
              {saving ? "연동 중..." : "네이버 블로그 연동"}
            </button>
          )}
        </div>
      </div>

      {/* 구글 블로그 */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">구글 블로그 (Blogger)</h2>
            <p className="mt-1 text-sm text-gray-500">
              {googleConnected ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  연동됨
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-300"></span>
                  미연동
                </span>
              )}
            </p>
          </div>
          {googleConnected && (
            <button
              onClick={handleGoogleDisconnect}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              연동 해제
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">블로그 주소</label>
            <input
              type="text"
              placeholder="예: https://yourblog.blogspot.com"
              value={googleBlogUrl}
              onChange={(e) => setGoogleBlogUrl(e.target.value)}
              disabled={googleConnected}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:bg-gray-50 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">기본 태그</label>
            <input
              type="text"
              placeholder="예: AI, 블로그, 마케팅 (쉼표로 구분)"
              value={googleTags}
              onChange={(e) => setGoogleTags(e.target.value)}
              disabled={googleConnected}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:bg-gray-50 focus:border-violet-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">여러 태그는 쉼표로 구분하세요.</p>
          </div>

          {!googleConnected && (
            <button
              onClick={handleGoogleConnect}
              disabled={saving}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
            >
              {saving ? "연동 중..." : "구글 블로그 연동"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium"
        >
          돌아가기
        </Link>
      </div>
    </main>
  );
}
