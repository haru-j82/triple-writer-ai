"use client";

/**
 * 가제트 스쿨 - 교육 콘텐츠
 */

export default function SchoolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-white mb-8">🎓 가제트 스쿨</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            "블로그 SEO 기초",
            "키워드 연구법",
            "글쓰기 팁",
            "이미지 최적화",
            "발행 전략",
            "수익화 가이드",
          ].map((course) => (
            <div
              key={course}
              className="rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 p-6 cursor-pointer hover:border-purple-500 transition"
            >
              <div className="font-bold text-white">{course}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
