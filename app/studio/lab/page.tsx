"use client";

/**
 * AI 실험실
 */

export default function LabPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">⚗️ AI 실험실</h1>

        <div className="grid grid-cols-2 gap-6">
          {[
            { name: "요약 생성", icon: "📋" },
            { name: "이미지 생성", icon: "🎨" },
            { name: "SEO 분석", icon: "📈" },
            { name: "태그 생성", icon: "🏷️" },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-xl bg-gray-800 border-2 border-gray-700 hover:border-purple-500 p-8 text-center cursor-pointer transition"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="font-bold text-white">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
