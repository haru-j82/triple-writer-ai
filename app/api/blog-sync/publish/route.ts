/**
 * 블로그 발행 이력 저장 API
 *
 * POST /api/blog-sync/publish
 * - 블로그 발행 결과를 Supabase에 저장
 * - 네이버/구글 블로그 동기화 이력 기록
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveBlogSyncHistory } from '@/lib/supabaseDb';
import { BlogSyncRequest } from '@/lib/blogApi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 요청 검증
    const { postId, postTitle, platform, result } = body as BlogSyncRequest & {
      userId?: string;
    };

    if (!postId || !postTitle || !platform || !result) {
      return NextResponse.json(
        {
          success: false,
          error: 'postId, postTitle, platform, result 정보가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!['naver', 'google'].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "platform은 'naver' 또는 'google'이어야 합니다.",
        },
        { status: 400 }
      );
    }

    // Supabase에 이력 저장
    try {
      const syncHistory = await saveBlogSyncHistory({
        postId,
        platform,
        postUrl: result.postUrl,
        syncStatus: result.success ? result.status : 'failed',
        errorMessage: result.error,
      });

      return NextResponse.json(
        {
          success: true,
          data: syncHistory,
          message: `${platform === 'naver' ? '네이버' : '구글'} 블로그 발행 이력이 저장되었습니다.`,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Failed to save blog sync history:', dbError);

      // DB 저장 실패는 경고하지만 API 응답은 성공으로 처리
      // (클라이언트 로컬 저장을 믿음)
      return NextResponse.json(
        {
          success: true,
          warning: 'Supabase 저장 실패, 클라이언트 로컬 저장으로 폴백',
          error: dbError instanceof Error ? dbError.message : '데이터베이스 오류',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Blog sync publish error:', error);

    return NextResponse.json(
      {
        success: false,
        error: '블로그 발행 이력 저장 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * 라이브 테스트용 GET 엔드포인트
 * 예시 URL: /api/blog-sync/publish?postId=test&postTitle=Test&platform=naver&status=published
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postId = url.searchParams.get('postId');
  const postTitle = url.searchParams.get('postTitle');
  const platform = url.searchParams.get('platform') as 'naver' | 'google' | null;
  const status = url.searchParams.get('status');

  if (!postId || !postTitle || !platform || !status) {
    return NextResponse.json(
      {
        success: false,
        error: 'postId, postTitle, platform, status 파라미터가 필요합니다.',
        example: '/api/blog-sync/publish?postId=123&postTitle=Test&platform=naver&status=published',
      },
      { status: 400 }
    );
  }

  // POST로 재라우팅
  const mockRequest: BlogSyncRequest & { userId?: string } = {
    postId,
    postTitle,
    platform,
    result: {
      success: status === 'failed' ? false : true,
      platform,
      status: status as 'published' | 'scheduled' | 'failed',
      postUrl: `https://example.com/${postId}`,
      message: `Mock ${platform} publish: ${status}`,
    },
  };

  // 다시 POST로 요청
  const postReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify(mockRequest),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return POST(postReq);
}
