/**
 * Phase 2-1 LLM API + Supabase 실제 연동 - 통합 테스트 예제
 *
 * 실제 환경에서 테스트하기 위한 가이드:
 *
 * 1. 환경 변수 확인:
 *    - OPENAI_API_KEY, GOOGLE_AI_API_KEY, ANTHROPIC_API_KEY
 *    - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * 2. 의존성 설치:
 *    npm install
 *
 * 3. 테스트 실행:
 *    npm run dev
 *    curl -X POST http://localhost:3000/api/agent/generate-llm \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "blogId": "blog_test_001",
 *        "userId": "user_test_001",
 *        "topic": {
 *          "title": "AI 시대의 블로그 작성법",
 *          "keywords": ["AI", "블로그", "작성"],
 *          "audience": "general",
 *          "tone": "friendly",
 *          "seo": {
 *            "metaDescription": "AI를 활용하여 효율적으로 블로그를 작성하는 방법",
 *            "slug": "ai-blog-writing",
 *            "focusKeyword": "AI 블로그"
 *          }
 *        }
 *      }'
 *
 * 4. 대량 배치 테스트:
 *    curl -X POST http://localhost:3000/api/bulk-batch/generate-llm \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "userId": "user_test_001",
 *        "batchId": "batch_test_001",
 *        "settings": {
 *          "count": 5,
 *          "categories": ["기술"],
 *          "tone": "professional",
 *          "includeImages": false,
 *          "schedule": {
 *            "interval": "daily",
 *            "startDate": "2026-08-15",
 *            "startTime": "09:00",
 *            "timezone": "Asia/Seoul"
 *          }
 *        },
 *        "keywords": {
 *          "primaryKeywords": ["Python", "JavaScript", "TypeScript", "React", "Next.js"],
 *          "longtailKeywords": [],
 *          "excludeKeywords": []
 *        }
 *      }'
 */

import {
  generateBlogContent,
  generateContentByModel,
  calculateTotalCost,
  estimateTokenCount,
} from './llmApi';
import {
  getOrCreateUser,
  getUserCredits,
  savePost,
  getUserPosts,
} from './supabaseDb';

// ========== 테스트 케이스 1: 단일 LLM API 호출 ==========

export async function testSingleLLMCall() {
  console.log('=== Test 1: Single LLM Call ===');

  try {
    const result = await generateContentByModel(
      'gpt',
      '2026년 기술 트렌드',
      ['AI', 'Web3', 'Blockchain'],
      'general',
      'professional'
    );

    console.log('✓ GPT-4 호출 성공');
    console.log(`  - Content length: ${result.content.length}`);
    console.log(`  - Tokens: ${result.tokenCount}`);
    console.log(`  - Finish reason: ${result.finishReason}`);

    return result;
  } catch (error) {
    console.error('✗ GPT-4 호출 실패:', error);
    throw error;
  }
}

// ========== 테스트 케이스 2: 3개 LLM 병렬 호출 ==========

export async function testParallelLLMCalls() {
  console.log('\n=== Test 2: Parallel LLM Calls (3 models) ===');

  try {
    const startTime = Date.now();

    const result = await generateBlogContent(
      'AI 시대의 콘텐츠 마케팅 전략',
      ['AI', '콘텐츠', '마케팅'],
      'general',
      'friendly'
    );

    const duration = Date.now() - startTime;

    console.log('✓ 3개 LLM 병렬 호출 성공');
    console.log(`  - Duration: ${duration}ms`);
    console.log(`  - GPT tokens: ${result.gpt.tokenCount}`);
    console.log(`  - Gemini tokens: ${result.gemini.tokenCount}`);
    console.log(`  - Claude tokens: ${result.claude.tokenCount}`);
    console.log(`  - Total tokens: ${result.totalTokens}`);

    const totalCost = calculateTotalCost(result);
    console.log(`  - Estimated cost: $${totalCost.toFixed(4)}`);

    return result;
  } catch (error) {
    console.error('✗ 병렬 호출 실패:', error);
    throw error;
  }
}

// ========== 테스트 케이스 3: Supabase 사용자 관리 ==========

export async function testSupabaseUserManagement(email: string) {
  console.log('\n=== Test 3: Supabase User Management ===');

  try {
    // 사용자 생성 또는 조회
    const user = await getOrCreateUser(email);
    console.log('✓ User created/retrieved:', user.id);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Credits: ${user.credits}`);

    // 크레딧 조회
    const credits = await getUserCredits(user.id);
    console.log(`  - Current credits: ${credits}`);

    return user;
  } catch (error) {
    console.error('✗ User management 실패:', error);
    throw error;
  }
}

// ========== 테스트 케이스 4: Supabase 글 저장 ==========

export async function testSupabaseSavePost(userId: string) {
  console.log('\n=== Test 4: Supabase Save Post ===');

  try {
    const post = await savePost({
      userId,
      title: '테스트 블로그 글',
      metaDescription: '이것은 테스트 메타 설명입니다.',
      content: '# 테스트 본문\n\n이것은 테스트 글입니다.',
      status: 'draft',
      tags: ['test', 'demo'],
      wordCount: 50,
    });

    console.log('✓ Post saved successfully:', post.id);
    console.log(`  - Title: ${post.title}`);
    console.log(`  - Status: ${post.status}`);
    console.log(`  - Created at: ${post.createdAt}`);

    return post;
  } catch (error) {
    console.error('✗ Post save 실패:', error);
    throw error;
  }
}

// ========== 테스트 케이스 5: 전체 통합 플로우 ==========

export async function testCompleteFlow(email: string) {
  console.log('\n=== Test 5: Complete Integration Flow ===');

  try {
    // Step 1: 사용자 생성/조회
    console.log('\n[Step 1] User Management...');
    const user = await testSupabaseUserManagement(email);

    // Step 2: LLM 호출
    console.log('\n[Step 2] LLM Generation...');
    const llmResult = await testParallelLLMCalls();

    // Step 3: 글 저장
    console.log('\n[Step 3] Save Post...');
    const post = await savePost({
      userId: user.id,
      title: 'AI 기술 가이드',
      metaDescription: '3개 LLM으로 생성한 고품질 블로그 글',
      content: llmResult.claude.content,
      status: 'draft',
      gptContent: llmResult.gpt.content,
      geminiContent: llmResult.gemini.content,
      claudeContent: llmResult.claude.content,
      gptTokens: llmResult.gpt.tokenCount,
      geminiTokens: llmResult.gemini.tokenCount,
      claudeTokens: llmResult.claude.tokenCount,
      tags: ['AI', '기술'],
      wordCount: llmResult.claude.content.split(/\s+/).length,
    });

    // Step 4: 사용자의 글 목록 조회
    console.log('\n[Step 4] Retrieve User Posts...');
    const userPosts = await getUserPosts(user.id, 5);
    console.log(`✓ Retrieved ${userPosts.length} posts for user`);

    console.log('\n✓ Complete flow successful!');
    console.log('==========================================');
    console.log('Summary:');
    console.log(`- User ID: ${user.id}`);
    console.log(`- Post ID: ${post.id}`);
    console.log(`- Total tokens used: ${llmResult.totalTokens}`);
    console.log(`- Estimated cost: $${calculateTotalCost(llmResult).toFixed(4)}`);
    console.log('==========================================');

    return { user, post, llmResult };
  } catch (error) {
    console.error('✗ Complete flow failed:', error);
    throw error;
  }
}

// ========== 성능 테스트 ==========

export async function performanceBenchmark() {
  console.log('\n=== Performance Benchmark ===');

  try {
    const iterations = 3;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`\nIteration ${i + 1}/${iterations}...`);
      const startTime = Date.now();

      await generateBlogContent(
        `벤치마크 테스트 ${i + 1}`,
        ['테스트', '성능'],
        'general',
        'friendly'
      );

      const duration = Date.now() - startTime;
      durations.push(duration);
      console.log(`  Duration: ${duration}ms`);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log('\n=== Benchmark Results ===');
    console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`Min duration: ${minDuration}ms`);
    console.log(`Max duration: ${maxDuration}ms`);

    return { avgDuration, minDuration, maxDuration };
  } catch (error) {
    console.error('✗ Benchmark failed:', error);
    throw error;
  }
}
