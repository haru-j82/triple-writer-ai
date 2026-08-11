"use client";

/**
 * 실시간 검색어 - 이슈 키워드 순위
 */

const TRENDING = [
  { rank: 1, keyword: "최신 뉴스", volume: "↑ 25%" },
  { rank: 2, keyword: "핫딜 정보", volume: "↑ 18%" },
  { rank: 3, keyword: "AI 기술", volume: "↑ 14%" },
  { rank: 4, keyword: "건강 팁", volume: "↑ 12%" },
  { rank: 5, keyword: "요리 레시피", volume: "↑ 10%" },
];

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">🔥 실시간 검색어</h1>

        <div className="space-y-3">
          {TRENDING.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border-2 border-gray-700 hover:border-purple-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-purple-400">
                  #{item.rank}
                </div>
                <div className="text-lg font-bold text-white">
                  {item.keyword}
                </div>
              </div>
              <div className="text-green-400 font-bold">{item.volume}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
