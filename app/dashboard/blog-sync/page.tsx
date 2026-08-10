"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getSyncHistory, SyncHistory } from "@/lib/blogSync";

export default function BlogSyncHistoryPage() {
  const { state: appState, hydrated } = useStore();
  const router = useRouter();
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (hydrated && !appState.user) router.push("/login");
  }, [hydrated, appState.user, router]);

  useEffect(() => {
    if (!hydrated) return;
    setHistory(getSyncHistory());
    setLoaded(true);
  }, [hydrated]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            발행됨
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            예약됨
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            실패
          </span>
        );
      default:
        return null;
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "naver":
        return (
          <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            네이버 블로그
          </span>
        );
      case "google":
        return (
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            구글 블로그
          </span>
        );
      default:
        return null;
    }
  };

  if (!hydrated || !appState.user) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
          대시보드
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">블로그 발행 내역</h1>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
        <div>
          <p className="font-semibold">네이버/구글 블로그 발행 내역</p>
          <p className="mt-1 text-sm text-gray-600">
            에이전트 및 대량생성 모드에서 발행한 모든 글의 플랫폼별 발행 상태를 확인합니다.
          </p>
        </div>
        <Link
          href="/settings/blog-sync"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          연동 설정
        </Link>
      </div>

      {!loaded && (
        <div className="mt-8 flex h-40 items-center justify-center">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      )}

      {loaded && history.length === 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-400">발행 내역이 없습니다.</p>
          <p className="mt-2 text-sm text-gray-400">
            네이버/구글 블로그를 연동한 후 글을 발행하면 여기에 표시됩니다.
          </p>
        </div>
      )}

      {loaded && history.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3">글 제목</th>
                  <th className="px-6 py-3">플랫폼</th>
                  <th className="px-6 py-3">발행 상태</th>
                  <th className="px-6 py-3">발행 날짜</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.postTitle}</p>
                        <p className="mt-1 text-xs text-gray-400">ID: {item.postId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPlatformBadge(item.platform)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(item.status)}
                        {item.errorMessage && (
                          <p className="text-xs text-red-600">{item.errorMessage}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">
                        {new Date(item.publishedAt).toLocaleString("ko-KR")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.postUrl && (
                        <a
                          href={item.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                        >
                          보기 →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium"
        >
          돌아가기
        </Link>
      </div>
    </main>
  );
}
