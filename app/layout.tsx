import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Nav from "@/components/Nav";
import FloatingWidgets from "@/components/FloatingWidgets";

export const metadata: Metadata = {
  title: "트리플로그 AI | ChatGPT·Claude·Gemini 통합 블로그 자동 생성",
  description:
    "3개의 AI 모델을 동시에 활용해 초안을 비교·분석하고 최고의 요소만 합성하는 블로그 자동 생성 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <StoreProvider>
          <Nav />
          {children}
          <FloatingWidgets />
        </StoreProvider>
      </body>
    </html>
  );
}
