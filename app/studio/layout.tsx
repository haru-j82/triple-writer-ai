"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

/**
 * 가제트AI 스타일 메인 대시보드 레이아웃
 * 왼쪽 사이드바 + 오른쪽 콘텐츠
 */

interface NavItem {
  label: string;
  icon: string;
  badge?: string;
  items?: { label: string; href: string; icon?: string }[];
  collapsed?: boolean;
}

const SIDEBAR_ITEMS: NavItem[] = [
  {
    label: "AI 글쓰기",
    icon: "✍️",
    items: [
      { label: "블로그", icon: "📝" },
      { label: "정보성", href: "/studio/blog/info" },
      { label: "정보성 v2", href: "/studio/blog/info-v2" },
      { label: "N홈판 블로그 쓰기", href: "/studio/blog/naver" },
      { label: "제품 사용후기", href: "/studio/blog/review" },
      { label: "방문후기", href: "/studio/blog/visit" },
      { label: "여행후기", href: "/studio/blog/travel" },
      { label: "쿠팡 파트너스 홍보", href: "/studio/blog/coupang" },
      { label: "스마트스토어 홍보", href: "/studio/blog/smartstore" },
      { label: "새로운 글로 바꾸기", href: "/studio/blog/rewrite" },
      { label: "유튜브로 블로그 쓰기", href: "/studio/blog/youtube" },
      { label: "뉴스로 블로그 쓰기", href: "/studio/blog/news" },
    ],
  },
  {
    label: "대량 글생성 v2",
    icon: "🔄",
    href: "/studio/bulk-generate",
  },
  {
    label: "보관함",
    icon: "📂",
    href: "/studio/archive",
  },
  {
    label: "키워드",
    icon: "🔑",
    items: [
      { label: "황금 키워드", href: "/studio/keywords/gold" },
      { label: "스마트블록 키워드", href: "/studio/keywords/smartblock" },
      { label: "형태소 분석기", href: "/studio/keywords/morpheme" },
      { label: "실시간 검색어", href: "/studio/keywords/trending" },
      { label: "금칙어 검사기", href: "/studio/keywords/banned" },
    ],
  },
  {
    label: "AI 이미지",
    icon: "🖼️",
    items: [
      { label: "AI 이미지 생성", href: "/studio/images/generate" },
      { label: "AI 이미지 편집", href: "/studio/images/edit" },
      { label: "무료 이미지", href: "/studio/images/free" },
      { label: "썸네일 만들기", href: "/studio/images/thumbnail" },
      { label: "이미지 분할기", href: "/studio/images/splitter" },
    ],
  },
  {
    label: "AI 실험실",
    icon: "⚗️",
    href: "/studio/lab",
  },
  {
    label: "가제트 스쿨",
    icon: "🎓",
    href: "/studio/school",
  },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["AI 글쓰기"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-950">
      {/* 사이드바 */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden bg-gray-900 text-white transition-all duration-300 border-r border-gray-800`}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="px-6 py-6 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">
                G
              </div>
              <div>
                <div className="font-bold text-white">Gazet</div>
                <div className="text-xs text-gray-400">AI 글쓰기 플랫폼</div>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => (
                <div key={item.label}>
                  {item.items ? (
                    <>
                      {/* 그룹 헤더 */}
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition text-sm font-medium"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-xs">
                          {expandedItems.includes(item.label) ? "▼" : "▶"}
                        </span>
                      </button>

                      {/* 서브 메뉴 */}
                      {expandedItems.includes(item.label) && (
                        <div className="ml-4 space-y-1 border-l border-gray-800 pl-0">
                          {item.items.map((subitem) => (
                            <button
                              key={subitem.label}
                              onClick={() => router.push(subitem.href)}
                              className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                                isActive(subitem.href)
                                  ? "bg-purple-600 text-white font-semibold"
                                  : "text-gray-400 hover:text-white hover:bg-gray-800"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {subitem.icon && <span>{subitem.icon}</span>}
                                {subitem.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* 단일 메뉴 */
                    <button
                      onClick={() => router.push(item.href || "/")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                        isActive(item.href || "")
                          ? "bg-purple-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* 하단 배너 */}
          <div className="p-4 border-t border-gray-800">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-center">
              <div className="text-sm font-bold text-white mb-2">크롬 확장</div>
              <div className="text-xs text-gray-100 mb-3">
                자동포스팅을 크롬에서 원클릭으로
              </div>
              <button className="w-full bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-gray-100 transition text-xs">
                설치하기
              </button>
            </div>
            <div className="mt-4 text-center">
              <button className="text-xs text-gray-400 hover:text-gray-300">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
        {/* 상단 바 */}
        <div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white text-xl mr-4"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-400">
            <span>남은 코인: </span>
            <span className="text-white font-semibold">20</span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
