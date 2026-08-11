"use client";

import Link from "next/link";

/**
 * 황금 키워드 - 검색량 높고 경쟁 낮은 키워드
 */

const GOLDEN_KEYWORDS = [
  {
    rank: 1,
    keyword: "다이소 3만원대 제품 5천원",
    volume: 3048600,
    competition: 92,
    freshness: "매일 갱신",
    goldScore: 98,
  },
  {
    rank: 2,
    keyword: "편의점 new 상품",
    volume: 2456000,
    competition: 78,
    freshness: "매일 갱신",
    goldScore: 95,
  },
  {
    rank: 3,
    keyword: "초저가 노브랜드 찐템",
    volume: 1823400,
    competition: 65,
    freshness: "매일 갱신",
    goldScore: 92,
  },
  {
    rank: 4,
    keyword: "쿠팡 로켓배송 핫딜",
    volume: 1654300,
    competition: 85,
    freshness: "매일 갱신",
    goldScore: 88,
  },
  {
    rank: 5,
    keyword: "아마존 한국 구매",
    volume: 1245600,
    competition: 72,
    freshness: "매일 갱신",
    goldScore: 85,
  },
];

export default function GoldenKeywordsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">✨ 황금 키워드</h1>
          <p className="text-gray-400">
            검색량이 높으면서 경쟁이 낮은 키워드를 매일 추천해드립니다
          </p>
        </div>

        {/* 설명 */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 p-6">
          <p className="text-gray-300 text-sm">
            황금점수는 검색량·경쟁·신선도·꾸준함을 종합적으로 평가합니다. 이 키워드들로
            글을 쓰면 검색 유입이 좋을 가능성이 높습니다.
          </p>
        </div>

        {/* 키워드 리스트 */}
        <div className="space-y-3">
          {GOLDEN_KEYWORDS.map((item) => (
            <div
              key={item.rank}
              className="group relative rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/30 p-6 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-3xl font-bold text-purple-400">
                      #{item.rank}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {item.keyword}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-400">
                          검색량: <span className="text-white font-semibold">
                            {(item.volume / 1000000).toFixed(2)}M
                          </span>
                        </span>
                        <span className="text-gray-400">
                          경쟁도: <span className="text-orange-400 font-semibold">
                            {item.competition}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          신선도: <span className="text-green-400 font-semibold">
                            {item.freshness}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 황금점수 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      {item.goldScore}
                    </div>
                    <div className="text-xs text-gray-400">황금점수</div>
                  </div>

                  {/* 이 키워드로 글쓰기 버튼 */}
                  <Link
                    href={`/studio/blog/info-v2?keyword=${encodeURIComponent(item.keyword)}`}
                    className="mt-3 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition whitespace-nowrap"
                  >
                    이 키워드로 글쓰기
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 정보 */}
        <div className="mt-12 rounded-xl bg-gray-800/50 border border-gray-700 p-6">
          <p className="text-gray-300 text-sm">
            💡 <span className="font-semibold">팁:</span> 황금 키워드로 작성한 글은 검색 엔진에서 상위
            노출될 확률이 높습니다. 매일 새로운 키워드가 업데이트됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
