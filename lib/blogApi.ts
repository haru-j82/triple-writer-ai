/**
 * 블로그 API 통합 모듈
 * 네이버/구글 블로그 발행 및 예약 기능
 *
 * 실제 API 연동 준비 단계: 현재는 Mock 구현, API 키 추가 시 실제 구현으로 전환
 */

// ============ 타입 정의 ============

export interface BlogPublishParams {
  title: string;
  content: string;
  metaDescription?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  timezone?: string;
  tags?: string[];
  category?: string;
}

export interface NaverPublishParams extends BlogPublishParams {
  category: string;
}

export interface GooglePublishParams extends BlogPublishParams {
  tags: string[];
}

export interface BlogPublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  scheduledPublishAt?: string;
  error?: string;
  platform: 'naver' | 'google';
  status: 'published' | 'scheduled' | 'failed';
  message?: string;
}

export interface BlogSyncRequest {
  postId: string;
  postTitle: string;
  platform: 'naver' | 'google';
  result: BlogPublishResult;
}

// ============ Mock 구현 (실제 API 연동 전단계) ============

/**
 * 네이버 블로그 발행 (현재: Mock)
 *
 * 실제 연동 시:
 * - API 엔드포인트: https://openapi.naver.com/blog
 * - 필요한 정보:
 *   - Client ID: process.env.NAVER_CLIENT_ID
 *   - Client Secret: process.env.NAVER_CLIENT_SECRET
 *   - 사용자 블로그 ID: appState.user.connectedBlogs.naver.blogUrl에서 추출
 *
 * 호출 예시:
 * POST https://openapi.naver.com/blog/v1/posts
 * Headers:
 *   X-Naver-Client-Id: {CLIENT_ID}
 *   X-Naver-Client-Secret: {CLIENT_SECRET}
 * Body: {
 *   title, content, category, tags, visibility (public/protected),
 *   publishedDate (ISO 8601)
 * }
 */
export async function publishToNaver(
  params: NaverPublishParams,
  blogUrl: string
): Promise<BlogPublishResult> {
  // Mock 구현: 네트워크 지연 시뮬레이션
  const delay = Math.random() * 500 + 200; // 200-700ms
  await new Promise((r) => setTimeout(r, delay));

  const isScheduled = !!params.scheduledDate && !!params.scheduledTime;
  const postId = Math.random().toString(36).substring(2, 11);
  const scheduledDate = isScheduled
    ? new Date(`${params.scheduledDate}T${params.scheduledTime}:00`).toISOString()
    : undefined;

  const result: BlogPublishResult = {
    success: true,
    platform: 'naver',
    status: isScheduled ? 'scheduled' : 'published',
    postUrl: `https://blog.naver.com${blogUrl}/${postId}`,
    postId,
    scheduledPublishAt: scheduledDate,
    message: isScheduled
      ? `네이버 블로그 예약 발행: ${scheduledDate}`
      : '네이버 블로그에 즉시 발행되었습니다.',
  };

  // Mock 로깅
  console.log(`[Naver Blog Mock] ${result.message}`, {
    title: params.title,
    category: params.category,
    status: result.status,
  });

  return result;
}

/**
 * 구글 블로그(Blogger) 발행 (현재: Mock)
 *
 * 실제 연동 시:
 * - API 엔드포인트: https://www.googleapis.com/blogger/v3
 * - 필요한 정보:
 *   - Google API Key: process.env.GOOGLE_API_KEY
 *   - OAuth 2.0 Token: 사용자 인증 필요
 *   - 블로그 ID: appState.user.connectedBlogs.google.blogUrl에서 추출
 *
 * 호출 예시:
 * POST https://www.googleapis.com/blogger/v3/blogs/{blogId}/posts
 * Headers:
 *   Authorization: Bearer {ACCESS_TOKEN}
 * Query:
 *   key={API_KEY}
 * Body: {
 *   title, content, labels (tags), isDraft (false = publish, true = draft),
 *   published (ISO 8601 for scheduling)
 * }
 */
export async function publishToGoogle(
  params: GooglePublishParams,
  blogUrl: string
): Promise<BlogPublishResult> {
  // Mock 구현: 네트워크 지연 시뮬레이션
  const delay = Math.random() * 500 + 200; // 200-700ms
  await new Promise((r) => setTimeout(r, delay));

  const isScheduled = !!params.scheduledDate && !!params.scheduledTime;
  const postId = Math.random().toString(36).substring(2, 11);
  const scheduledDate = isScheduled
    ? new Date(`${params.scheduledDate}T${params.scheduledTime}:00`).toISOString()
    : undefined;

  const result: BlogPublishResult = {
    success: true,
    platform: 'google',
    status: isScheduled ? 'scheduled' : 'published',
    postUrl: `${blogUrl}/search/label/${postId}`,
    postId,
    scheduledPublishAt: scheduledDate,
    message: isScheduled
      ? `구글 블로그(Blogger) 예약 발행: ${scheduledDate}`
      : '구글 블로그(Blogger)에 즉시 발행되었습니다.',
  };

  // Mock 로깅
  console.log(`[Google Blog Mock] ${result.message}`, {
    title: params.title,
    tags: params.tags,
    status: result.status,
  });

  return result;
}

/**
 * 블로그 발행 결과 로깅 (콘솔)
 * 실제 환경: Supabase blog_sync_history 테이블에 저장됨
 */
export function logBlogPublishResult(request: BlogSyncRequest): void {
  const { platform, result } = request;
  const icon = result.success ? '✓' : '✗';
  const status = result.success ? result.status : 'failed';

  console.log(
    `${icon} [${platform.toUpperCase()}] ${status.toUpperCase()} | ${request.postTitle}`,
    result.message || result.error
  );
}

/**
 * 블로그 발행 에러 처리
 */
export function handleBlogPublishError(
  platform: 'naver' | 'google',
  error: unknown
): BlogPublishResult {
  const message = error instanceof Error ? error.message : '알 수 없는 오류';

  return {
    success: false,
    platform,
    status: 'failed',
    error: message,
    message: `${platform === 'naver' ? '네이버' : '구글'} 블로그 발행 실패: ${message}`,
  };
}

// ============ 타입 가드 ============

export function isNaverPublishParams(params: any): params is NaverPublishParams {
  return params && typeof params.category === 'string';
}

export function isGooglePublishParams(params: any): params is GooglePublishParams {
  return params && Array.isArray(params.tags);
}
