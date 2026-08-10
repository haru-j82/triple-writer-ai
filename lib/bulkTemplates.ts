export interface BulkPostDetail {
  title: string;
  subtitle: string;
  metaDescription: string;
  excerpt: string;
  keyword: string;
  relatedTags: string[];
  hashtags: string[];
  outline: { h1: string; h2: string[] };
}

const YEAR = new Date().getFullYear();

// 실제 사이트의 "제목 패턴 다양화" 동작을 흉내낸 템플릿 목록.
// 하나의 주제를 넣어도 매번 다른 각도의 제목/구조가 나오도록 순환시킵니다.
const TITLE_PATTERNS: Array<(t: string) => string> = [
  (t) => `${t} 추천: ${YEAR}년 꼭 알아야 할 핵심 포인트`,
  (t) => `${t} 완벽 가이드: 처음이라도 쉽게 따라하는 방법`,
  (t) => `${t} 후기: 실제 경험자들이 말하는 장단점`,
  (t) => `${t} 비교: 상황별 최적의 선택 기준`,
  (t) => `${t} 체크리스트: 놓치기 쉬운 포인트 총정리`,
  (t) => `${t} 트렌드: ${YEAR}년 최신 동향 분석`,
  (t) => `${t} Q&A: 자주 묻는 질문 모음`,
  (t) => `${t} 활용법: 오늘부터 바로 쓰는 실전 팁`,
  (t) => `${t} 순위: 이번 달 인기 TOP 10`,
  (t) => `${t}, 이것만 알면 끝: 핵심 요약 정리`,
];

const SUBTITLE_PATTERNS: Array<(t: string, audience: string) => string> = [
  (t, a) => `${a}를 위한 ${t} 실전 정보를 한 번에 정리했어요`,
  (t, a) => `${a}가 가장 궁금해하는 ${t} 이야기`,
  (t) => `${t}, 더 이상 헤매지 마세요`,
  (t, a) => `${a} 눈높이에 맞춘 ${t} 총정리`,
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function generateBulkDetail(
  baseTopic: string,
  audience: string,
  tone: string,
  index: number
): BulkPostDetail {
  const title = pick(TITLE_PATTERNS, index)(baseTopic);
  const subtitle = pick(SUBTITLE_PATTERNS, index)(baseTopic, audience);
  const metaDescription = `${YEAR}년 기준 ${baseTopic}에 대해 ${audience}가 알아야 할 핵심 정보를 ${tone} 방식으로 정리했습니다.`;
  const excerpt = `${baseTopic}, 어디서부터 시작해야 할지 막막하셨죠? 이 글에서는 ${audience} 관점에서 실질적으로 도움이 되는 내용만 골라 소개합니다.`;
  const keyword = `${baseTopic} 추천`;
  const relatedTags = [baseTopic, audience, "가이드", "추천", "정리"];
  const hashtags = [
    `#${baseTopic.replace(/\s+/g, "")}`,
    `#${baseTopic.replace(/\s+/g, "")}추천`,
    "#가이드",
    "#정보",
    `#${YEAR}`,
    "#총정리",
  ];
  const outline = {
    h1: title,
    h2: [
      `${baseTopic}란 무엇인가`,
      `${audience}가 주목해야 할 이유`,
      `실전 적용 방법 3가지`,
      `자주 하는 실수와 주의사항`,
      `마무리 및 요약`,
    ],
  };

  return {
    title,
    subtitle,
    metaDescription,
    excerpt,
    keyword,
    relatedTags,
    hashtags,
    outline,
  };
}
