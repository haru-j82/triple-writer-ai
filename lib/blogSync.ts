/**
 * 블로그 발행 옵션
 *
 * 참고: blogApi.ts의 타입 정의와 일치합니다.
 * blogApi.ts를 사용하는 새로운 코드는 BlogPublishParams를 사용하세요.
 */
export interface BlogPublishOptions {
  title: string;
  content: string;
  metaDescription?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  timezone?: string;
}

export interface NaverPublishOptions extends BlogPublishOptions {
  category: string;
}

export interface GooglePublishOptions extends BlogPublishOptions {
  tags: string[];
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  scheduledPublishAt?: string;
  error?: string;
}

// Mock: 네이버 블로그에 발행 (실제 API 연동 전 Mock)
export async function publishToNaver(
  options: NaverPublishOptions,
  blogUrl: string
): Promise<PublishResult> {
  // 실제 환경에서는 Naver Blog API를 호출하지만, 현재는 Mock
  const delay = Math.random() * 500 + 200; // 200-700ms
  await new Promise((r) => setTimeout(r, delay));

  const isScheduled = !!options.scheduledDate && !!options.scheduledTime;
  const postId = Math.random().toString(36).substring(2, 11);
  const scheduledDate = isScheduled
    ? new Date(`${options.scheduledDate}T${options.scheduledTime}:00`).toISOString()
    : undefined;

  return {
    success: true,
    postUrl: `https://blog.naver.com${blogUrl}/${postId}`,
    scheduledPublishAt: scheduledDate,
  };
}

// Mock: 구글 블로그(Blogger)에 발행
export async function publishToGoogle(
  options: GooglePublishOptions,
  blogUrl: string
): Promise<PublishResult> {
  // 실제 환경에서는 Google Blogger API를 호출하지만, 현재는 Mock
  const delay = Math.random() * 500 + 200; // 200-700ms
  await new Promise((r) => setTimeout(r, delay));

  const isScheduled = !!options.scheduledDate && !!options.scheduledTime;
  const postId = Math.random().toString(36).substring(2, 11);
  const scheduledDate = isScheduled
    ? new Date(`${options.scheduledDate}T${options.scheduledTime}:00`).toISOString()
    : undefined;

  return {
    success: true,
    postUrl: `${blogUrl}/search/label/${postId}`,
    scheduledPublishAt: scheduledDate,
  };
}

// Mock: 발행 이력 저장 (localStorage에 저장하는 Mock)
export interface SyncHistory {
  postId: string;
  postTitle: string;
  platform: "naver" | "google";
  status: "published" | "scheduled" | "failed";
  publishedAt: string;
  postUrl?: string;
  errorMessage?: string;
}

const SYNC_HISTORY_KEY = "triplewriter_sync_history_v1";

export function saveSyncHistory(entry: SyncHistory): void {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SYNC_HISTORY_KEY) : null;
    const history: SyncHistory[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    // 최근 200개만 유지
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
    }
  } catch {
    // ignore
  }
}

export function getSyncHistory(): SyncHistory[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SYNC_HISTORY_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSyncHistory(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SYNC_HISTORY_KEY);
    }
  } catch {
    // ignore
  }
}
