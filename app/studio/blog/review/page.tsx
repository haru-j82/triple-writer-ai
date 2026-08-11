"use client";

import BlogWriteFlow from "@/components/BlogWriteFlow";

export default function ReviewBlogPage() {
  return (
    <BlogWriteFlow
      templateName="제품 사용후기"
      templateIcon="⭐"
      blogTypes={{
        product: "제품 리뷰",
        service: "서비스 리뷰",
        app: "앱 리뷰",
      }}
    />
  );
}
