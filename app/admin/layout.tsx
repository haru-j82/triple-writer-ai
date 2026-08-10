"use client";

import { useStore } from "@/lib/store";
import { isAdmin } from "@/lib/adminAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, hydrated } = useStore();
  const router = useRouter();
  const userEmail = state.user?.email;
  const isAdminUser = isAdmin(userEmail);

  useEffect(() => {
    if (hydrated && !isAdminUser) {
      router.push("/");
    }
  }, [hydrated, isAdminUser, router]);

  if (!hydrated || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">관리자 접근이 필요합니다</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">관리자 패널</h1>
        </div>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            대시보드
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            사용자 관리
          </Link>
          <Link
            href="/admin/content"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            콘텐츠 관리
          </Link>
          <Link
            href="/admin/settings"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            시스템 설정
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
