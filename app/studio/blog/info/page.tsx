"use client";

import BlogWriteFlow from "@/components/BlogWriteFlow";

export default function InfoBlogPage() {
  return (
    <BlogWriteFlow
      templateName="정보성 블로그"
      templateIcon="📖"
      blogTypes={{
        tech: "기술/IT",
        lifestyle: "라이프스타일",
        business: "비즈니스",
        health: "건강/의료",
      }}
    />
  );
}
