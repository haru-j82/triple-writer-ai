// Part B: 대량 생성(배치) 모의(mock) 생성 엔진.
// 30개 글 x 3개 LLM 호출(90회 병렬)을 시뮬레이션하고, 진행률 콜백으로 단계를 알려줍니다.
// 실제 서비스 전환 시 이 파일 내부만 실제 LLM/이미지 API 호출로 교체하면 됩니다.

import { TONE_LABEL, ToneStyle } from "./agentTypes";
import { generateMockImage } from "./agentMock";
import {
  BatchCategory,
  BatchScheduleSettings,
  BulkBatchKeywords,
  BulkBatchPost,
  BulkBatchSettings,
} from "./bulkBatchTypes";
import { uid } from "./uid";

export class BatchCancelledError extends Error {
  constructor() {
    super("배치 생성이 취소되었습니다.");
    this.name = "BatchCancelledError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GenStage = "titles" | "drafts" | "synthesis" | "images" | "done";

export const STAGE_LABEL: Record<GenStage, string> = {
  titles: "제목 생성 중...",
  drafts: "초안 생성 중...",
  synthesis: "분석 & 합성 중...",
  images: "이미지 생성 중...",
  done: "완료!",
};

// 스펙에 명시된 단계별 진행률 앵커 (%)
export const STAGE_ANCHOR: Record<GenStage, number> = {
  titles: 5,
  drafts: 30,
  synthesis: 60,
  images: 85,
  done: 100,
};

const CATEGORY_HINT: Record<BatchCategory, string> = {
  기술: "최신 기술 트렌드와 실무 적용 사례",
  마케팅: "마케팅 전략과 성과를 높이는 실전 팁",
  라이프스타일: "일상에 바로 적용할 수 있는 라이프스타일 노하우",
  기타: "폭넓은 독자층이 관심을 가질 만한 유용한 정보",
};

const TITLE_PATTERNS: Array<(t: string, category: BatchCategory) => string> = [
  (t) => `${t} 완벽 가이드: 처음이라도 쉽게 따라하는 방법`,
  (t, c) => `${t} 추천: ${c} 담당자가 꼭 알아야 할 핵심 포인트`,
  (t) => `${t} 비교: 상황별 최적의 선택 기준`,
  (t) => `${t} 체크리스트: 놓치기 쉬운 포인트 총정리`,
  (t, c) => `${t}, ${c} 관점에서 다시 보기`,
  (t) => `${t} Q&A: 자주 묻는 질문 모음`,
  (t) => `${t} 활용법: 오늘부터 바로 쓰는 실전 팁`,
  (t) => `${t}, 이것만 알면 끝: 핵심 요약 정리`,
];

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 발행 스케줄 간격에 따른 예약 날짜 배열 계산
export function computeScheduleDates(count: number, schedule: BatchScheduleSettings): string[] {
  const dates: string[] = [];
  let cursor = schedule.startDate;
  const threeAWeekPattern = [2, 2, 3]; // 월/수/금 스타일 간격
  let patternIdx = 0;

  for (let i = 0; i < count; i++) {
    dates.push(cursor);
    switch (schedule.interval) {
      case "daily":
        cursor = addDays(cursor, 1);
        break;
      case "every-other-day":
        cursor = addDays(cursor, 2);
        break;
      case "weekly":
        cursor = addDays(cursor, 7);
        break;
      case "weekly-3x":
        cursor = addDays(cursor, pick(threeAWeekPattern, patternIdx));
        patternIdx++;
        break;
    }
  }
  return dates;
}

function buildTitles(
  count: number,
  keywords: BulkBatchKeywords,
  categories: BatchCategory[]
): { title: string; category: BatchCategory; keyword: string }[] {
  const primary = keywords.primaryKeywords.length > 0 ? keywords.primaryKeywords : ["블로그 주제"];
  const excludeSet = new Set(keywords.excludeKeywords.map((k) => k.toLowerCase()));
  const cats = categories.length > 0 ? categories : (["기타"] as BatchCategory[]);

  const items: { title: string; category: BatchCategory; keyword: string }[] = [];
  for (let i = 0; i < count; i++) {
    const category = pick(cats, i);
    // 장문 키워드를 우선 섞고, 부족하면 주요 키워드를 순환
    const longtail = keywords.longtailKeywords[i % Math.max(keywords.longtailKeywords.length, 1)];
    let keyword = (longtail && i < keywords.longtailKeywords.length ? longtail : pick(primary, i)).trim();
    if (excludeSet.has(keyword.toLowerCase())) {
      keyword = pick(primary, i + 1);
    }
    const title = pick(TITLE_PATTERNS, i)(keyword, category);
    items.push({ title, category, keyword });
  }
  return items;
}

function buildContent(
  title: string,
  keyword: string,
  category: BatchCategory,
  tone: ToneStyle
): string {
  const toneLabel = TONE_LABEL[tone];
  const hint = CATEGORY_HINT[category];

  return `# ${title}

${hint}를 ${toneLabel} 톤으로 정리했습니다. 핵심 키워드: **${keyword}**

## ${keyword}란 무엇인가

${category} 분야에서 ${keyword}가 최근 주목받는 이유와 배경을 짚어봅니다.

## 실전 적용 방법

1. 현재 상태를 객관적으로 진단하기
2. 우선순위에 따라 단계적으로 실행하기
3. 결과를 주기적으로 점검하고 보완하기

## 자주 하는 실수와 주의할 점

- 검증되지 않은 정보에 의존하는 것
- 자신의 상황을 고려하지 않고 그대로 따라 하는 것

## 마무리

${title}, 오늘부터 하나씩 실천해보시길 바랍니다.`;
}

export function buildBatchPost(
  index: number,
  info: { title: string; category: BatchCategory; keyword: string },
  settings: BulkBatchSettings,
  scheduledDate: string
): BulkBatchPost {
  const content = buildContent(info.title, info.keyword, info.category, settings.tone);
  const metaDescription = `${info.category} 관련 ${info.keyword}에 대해 ${TONE_LABEL[settings.tone]} 방식으로 정리한 글입니다.`;
  const excerpt = `${info.keyword}, 어디서부터 시작해야 할지 막막하셨죠? 이 글에서는 실질적으로 도움이 되는 내용만 골라 소개합니다.`;
  const hashtags = [
    `#${info.keyword.replace(/\s+/g, "")}`,
    `#${info.category}`,
    "#가이드",
    "#정보",
  ];

  return {
    id: uid(),
    title: info.title,
    category: info.category,
    metaDescription,
    excerpt,
    content,
    wordCount: wordCount(content),
    status: "pending",
    scheduledDate,
    scheduledTime: settings.schedule.startTime,
    timezone: settings.schedule.timezone,
    keyword: info.keyword,
    hashtags,
  };
}

export interface GenerateBatchParams {
  settings: BulkBatchSettings;
  keywords: BulkBatchKeywords;
  onProgress: (stage: GenStage, percent: number, doneCount: number, total: number) => void;
  isCancelled: () => boolean;
}

// 전체 배치 생성 파이프라인: 제목 -> 초안(LLM x3 병렬) -> 분석/합성 -> 이미지 -> 완료
export async function generateBatch(params: GenerateBatchParams): Promise<BulkBatchPost[]> {
  const { settings, keywords, onProgress, isCancelled } = params;
  const total = settings.count;
  const checkCancel = () => {
    if (isCancelled()) throw new BatchCancelledError();
  };

  // 1) 제목 생성 (5%)
  onProgress("titles", STAGE_ANCHOR.titles, 0, total);
  await delay(500);
  checkCancel();
  const titleInfos = buildTitles(total, keywords, settings.categories);
  const scheduledDates = computeScheduleDates(total, settings.schedule);

  // 2) 초안 생성: 글마다 3개 LLM 호출(총 total*3 병렬 호출)을 시뮬레이션 (5% -> 30%)
  const draftStart = STAGE_ANCHOR.titles;
  const draftEnd = STAGE_ANCHOR.drafts;
  for (let i = 0; i < total; i++) {
    checkCancel();
    // 글 1개당 ChatGPT/Gemini/Claude 3개 호출을 병렬로 흉내
    await Promise.all([delay(25), delay(30), delay(20)]);
    const pct = Math.round(draftStart + ((i + 1) / total) * (draftEnd - draftStart));
    onProgress("drafts", pct, i + 1, total);
  }

  // 3) 분석 & 합성 (30% -> 60%)
  onProgress("synthesis", (draftEnd + STAGE_ANCHOR.synthesis) / 2, total, total);
  await delay(500);
  checkCancel();
  const posts = titleInfos.map((info, i) => buildBatchPost(i, info, settings, scheduledDates[i]));
  onProgress("synthesis", STAGE_ANCHOR.synthesis, total, total);

  // 4) 이미지 생성 (60% -> 85%, 선택적)
  const imgStart = STAGE_ANCHOR.synthesis;
  const imgEnd = STAGE_ANCHOR.images;
  if (settings.includeImages) {
    for (let i = 0; i < posts.length; i++) {
      checkCancel();
      await delay(15);
      posts[i].thumbnailUrl = generateMockImage(posts[i].title, "illustration", "1024x768");
      const pct = Math.round(imgStart + ((i + 1) / posts.length) * (imgEnd - imgStart));
      onProgress("images", pct, i + 1, posts.length);
    }
  } else {
    await delay(300);
    checkCancel();
    onProgress("images", imgEnd, posts.length, posts.length);
  }

  // 5) 완료 (100%)
  await delay(300);
  checkCancel();
  onProgress("done", STAGE_ANCHOR.done, posts.length, posts.length);

  return posts;
}

// Step3 진행 화면에서 예상 소요 시간 표기용 (대략치)
export function estimateTotalMs(settings: BulkBatchSettings): number {
  const perPostMs = 75 + (settings.includeImages ? 15 : 0);
  return 500 + settings.count * perPostMs + 500 + 300 + 300;
}
