"use client";

import Link from "next/link";

/**
 * AI 글쓰기 메인 페이지 - 블로그 템플릿 선택
 */

const TEMPLATES = [
  {
    name: "정보성",
    description: "일반적인 정보를 담은 블로그 글",
    href: "/studio/blog/info",
    icon: "📖",
    newBadge: false,
  },
  {
    name: "정보성 v2",
    description: "이미지 생성이 포함된 고급 정보성 블로그",
    href: "/studio/blog/info-v2",
    icon: "🎨",
    newBadge: true,
  },
  {
    name: "N홈판 블로그 쓰기",
    description: "네이버 홈판 최적화 글쓰기",
    href: "/studio/blog/naver",
    icon: "🏠",
    newBadge: false,
  },
  {
    name: "제품 사용후기",
    description: "제품/서비스에 대한 리뷰 글쓰기",
    href: "/studio/blog/review",
    icon: "⭐",
    newBadge: false,
  },
  {
    name: "방문후기",
    description: "장소/시설 방문 후기 글쓰기",
    href: "/studio/blog/visit",
    icon: "📍",
    newBadge: false,
  },
  {
    name: "여행후기",
    description: "여행지 소개 및 여행 후기",
    href: "/studio/blog/travel",
    icon: "✈️",
    newBadge: false,
  },
  {
    name: "쿠팡 파트너스 홍보",
    description: "쿠팡 제품 홍보 최적화",
    href: "/studio/blog/coupang",
    icon: "🛍️",
    newBadge: false,
  },
  {
    name: "스마트스토어 홍보",
    description: "네이버 스마트스토어 상품 홍보",
    href: "/studio/blog/smartstore",
    icon: "🏪",
    newBadge: false,
  },
  {
    name: "새로운 글로 바꾸기",
    description: "기존 글을 새로운 방식으로 재작성",
    href: "/studio/blog/rewrite",
    icon: "🔄",
    newBadge: false,
  },
  {
    name: "유튜브로 블로그 쓰기",
    description: "유튜브 영상을 블로그 글로 변환",
    href: "/studio/blog/youtube",
    icon: "🎬",
    newBadge: false,
  },
  {
    name: "뉴스로 블로그 쓰기",
    description: "뉴스 기사를 블로그용으로 재작성",
    href: "/studio/blog/news",
    icon: "📰",
    newBadge: false,
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 AI 글쓰기
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            여러분의 블로그 스타일에 맞는 템플릿을 선택하세요
          </p>
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => (
            <Link
              key={template.href}
              href={template.href}
              className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 border-2 border-gray-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300" />

              {/* NEW 배지 */}
              {template.newBadge && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  NEW
                </div>
              )}

              {/* 콘텐츠 */}
              <div className="relative z-10">
                <div className="text-5xl mb-4">{template.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {template.description}
                </p>

                <div className="flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-4 transition-all">
                  <span>시작하기</span>
                  <span className="text-xl">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 유용한 도구 섹션 */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            📚 유용한 도구
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: "형태소 분석기", icon: "🔍" },
              { name: "금칙어 검사기", icon: "🚫" },
              { name: "글자수 계산", icon: "📊" },
              { name: "이미지 생성", icon: "🎨" },
              { name: "요약 생성", icon: "📝" },
              { name: "SEO 분석", icon: "📈" },
            ].map((tool) => (
              <button
                key={tool.name}
                className="flex items-center gap-3 p-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 transition text-white"
              >
                <span className="text-2xl">{tool.icon}</span>
                <span className="text-sm font-semibold">{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
