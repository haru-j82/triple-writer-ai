// Part B: 대량 생성(배치) 5단계 위저드 전용 타입 정의
// 에이전트 모드(agentTypes.ts)와 동일한 설계 원칙을 따르되, "30개 글 배치" 단위로 확장했습니다.

import { ToneStyle } from "./agentTypes";

export type BatchCount = 5 | 10 | 15 | 20 | 25 | 30;
export const BATCH_COUNT_OPTIONS: BatchCount[] = [5, 10, 15, 20, 25, 30];

export type BatchCategory = "기술" | "마케팅" | "라이프스타일" | "기타";
export const BATCH_CATEGORY_OPTIONS: BatchCategory[] = [
  "기술",
  "마케팅",
  "라이프스타일",
  "기타",
];

export type ScheduleInterval = "daily" | "every-other-day" | "weekly-3x" | "weekly";
export const SCHEDULE_INTERVAL_OPTIONS: ScheduleInterval[] = [
  "daily",
  "every-other-day",
  "weekly-3x",
  "weekly",
];
export const SCHEDULE_INTERVAL_LABEL: Record<ScheduleInterval, string> = {
  daily: "매일",
  "every-other-day": "격일",
  "weekly-3x": "주 3회",
  weekly: "주 1회",
};

export interface BatchScheduleSettings {
  interval: ScheduleInterval;
  startDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  timezone: string;
}

export interface BulkBatchSettings {
  count: BatchCount;
  categories: BatchCategory[];
  tone: ToneStyle;
  includeImages: boolean;
  schedule: BatchScheduleSettings;
}

export interface BulkBatchKeywords {
  primaryKeywords: string[]; // 최대 30개, 쉼표 구분 입력
  longtailKeywords: string[]; // 최대 10개, 줄바꿈 구분 입력
  excludeKeywords: string[]; // 쉼표 구분 입력
}

export type BulkBatchPostStatus = "pending" | "scheduled" | "published";

export interface BulkBatchPost {
  id: string;
  title: string;
  category: BatchCategory;
  metaDescription: string;
  excerpt: string;
  content: string; // markdown
  wordCount: number;
  thumbnailUrl?: string;
  status: BulkBatchPostStatus;
  scheduledDate: string; // yyyy-mm-dd
  scheduledTime: string; // HH:mm
  timezone: string;
  keyword: string;
  hashtags: string[];
}

export interface BulkBatchState {
  batchId: string;
  settings: BulkBatchSettings | null;
  keywords: BulkBatchKeywords | null;
  posts: BulkBatchPost[];
  maxStepReached: number;
  publishedAt?: string;
}
