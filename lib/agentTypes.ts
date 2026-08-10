// Part A: 에이전트 모드(5단계 위저드) 전용 타입 정의
// 실제 서비스 전환 시 Supabase 테이블 스키마와 1:1로 매핑되도록 설계했습니다.

export type AudienceLevel = "expert" | "general" | "beginner";
export type ToneStyle = "professional" | "friendly" | "academic";

export const AUDIENCE_LABEL: Record<AudienceLevel, string> = {
  expert: "전문가",
  general: "일반인",
  beginner: "초보자",
};

export const TONE_LABEL: Record<ToneStyle, string> = {
  professional: "전문적",
  friendly: "친근한",
  academic: "학술적",
};

export interface SeoSettings {
  metaDescription: string;
  slug: string;
  focusKeyword: string;
}

export interface AgentTopicInput {
  title: string;
  keywords: string[];
  audience: AudienceLevel;
  tone: ToneStyle;
  seo: SeoSettings;
}

export type LlmId = "chatgpt" | "gemini" | "claude";

export const LLM_META: Record<LlmId, { label: string; color: string }> = {
  chatgpt: { label: "ChatGPT", color: "#10A37F" },
  gemini: { label: "Gemini", color: "#4285F4" },
  claude: { label: "Claude", color: "#D97757" },
};

export interface LlmMetrics {
  wordCount: number;
  readingTimeMin: number;
  seoScore: number; // 1-10
  creativityScore: number; // 1-10
  overallScore: number; // 1-10
}

export interface LlmDraft {
  id: LlmId;
  label: string;
  content: string;
  metrics: LlmMetrics;
}

export interface AnalysisMetrics {
  clarity: number;
  seoOptimization: number;
  creativity: number;
  accuracy: number;
  engagement: number;
}

export const ANALYSIS_METRIC_LABEL: Record<keyof AnalysisMetrics, string> = {
  clarity: "명확성",
  seoOptimization: "SEO 최적화",
  creativity: "창의성",
  accuracy: "정확성",
  engagement: "참여도",
};

export interface AnalysisRow {
  id: LlmId;
  label: string;
  metrics: AnalysisMetrics;
  overall: number;
}

export interface SynthesisResult {
  title: string;
  metaDescription: string;
  content: string;
}

export type ImageSourceType = "upload" | "generated";
export type ImageRole = "thumbnail" | "inline";
export type ImageStyle = "realistic" | "illustration" | "diagram" | "abstract";
export type ImageResolution = "720x480" | "1024x768" | "1200x800";

export const IMAGE_STYLE_LABEL: Record<ImageStyle, string> = {
  realistic: "사실적",
  illustration: "일러스트",
  diagram: "다이어그램",
  abstract: "추상적",
};

export interface ImageAsset {
  id: string;
  url: string;
  source: ImageSourceType;
  role: ImageRole;
  position?: number; // 본문 삽입 위치 (문단 인덱스)
  prompt?: string;
  style?: ImageStyle;
  resolution?: ImageResolution;
  fileName?: string;
  createdAt: string;
}

export type PublishMode = "now" | "scheduled";

export interface PublishOptions {
  mode: PublishMode;
  scheduledDate?: string; // yyyy-mm-dd
  scheduledTime?: string; // HH:mm
  timezone?: string;
}

export type AgentBlogStatus = "draft" | "scheduled" | "published";

export interface AgentBlogState {
  blogId: string;
  topic: AgentTopicInput | null;
  drafts: LlmDraft[];
  analysis: AnalysisRow[];
  synthesis: SynthesisResult | null;
  images: ImageAsset[];
  publish: PublishOptions;
  maxStepReached: number;
  status: AgentBlogStatus;
  publishedAt?: string;
  updatedAt?: string;
}
