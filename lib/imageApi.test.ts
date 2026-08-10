/**
 * 이미지 API 테스트 헬퍼 함수 및 모의 테스트
 * 실제 API 호출 전에 동작 확인용
 */

import {
  calculateDALLECost,
  calculateStorageCost,
  calculateTotalImageCost,
} from './imageApi';

// ========== 단위 테스트 ==========

/**
 * DALL-E 비용 계산 테스트
 */
export function testDALLECostCalculation(): void {
  console.log('=== DALL-E 비용 계산 테스트 ===');

  const testCases = [
    { count: 1, quality: 'standard' as const, expected: 0.04 },
    { count: 10, quality: 'standard' as const, expected: 0.4 },
    { count: 30, quality: 'standard' as const, expected: 1.2 },
    { count: 1, quality: 'hd' as const, expected: 0.08 },
    { count: 10, quality: 'hd' as const, expected: 0.8 },
  ];

  for (const testCase of testCases) {
    const result = calculateDALLECost(testCase.count, testCase.quality);
    const passed = Math.abs(result - testCase.expected) < 0.001;

    console.log(
      `${passed ? '✓' : '✗'} ${testCase.count}개 (${testCase.quality}): $${result.toFixed(2)} (예상: $${testCase.expected.toFixed(2)})`
    );
  }
}

/**
 * 저장소 비용 계산 테스트
 */
export function testStorageCostCalculation(): void {
  console.log('\n=== 저장소 비용 계산 테스트 ===');

  const testCases = [
    { count: 100, expected: 0 }, // 무료 범위 (약 50MB)
    { count: 1000, expected: 0 }, // 무료 범위 (약 500MB)
    { count: 2500, expected: 1.25 }, // 약 1.25GB (초과 0.25GB)
    { count: 5000, expected: 3.75 }, // 약 2.5GB (초과 1.5GB)
  ];

  for (const testCase of testCases) {
    const result = calculateStorageCost(testCase.count);
    const passed = Math.abs(result - testCase.expected) < 0.01;

    console.log(
      `${passed ? '✓' : '✗'} ${testCase.count}개: $${result.toFixed(2)} (예상: $${testCase.expected.toFixed(2)})`
    );
  }
}

/**
 * 전체 비용 계산 테스트
 */
export function testTotalCostCalculation(): void {
  console.log('\n=== 전체 비용 계산 테스트 ===');

  const testCases = [
    { count: 1, expected: 0.04 }, // $0.04 (DALL-E) + $0 (저장소)
    { count: 10, expected: 0.4 }, // $0.4 (DALL-E) + $0 (저장소)
    { count: 100, expected: 4.0 }, // $4.0 (DALL-E) + $0 (저장소)
    { count: 1000, expected: 40.0 }, // $40.0 (DALL-E) + $0 (저장소)
  ];

  for (const testCase of testCases) {
    const result = calculateTotalImageCost(testCase.count);
    const passed = Math.abs(result - testCase.expected) < 0.01;

    console.log(
      `${passed ? '✓' : '✗'} ${testCase.count}개: $${result.toFixed(2)} (예상: $${testCase.expected.toFixed(2)})`
    );
  }
}

// ========== 시뮬레이션 ==========

/**
 * 배치 이미지 생성 시뮬레이션
 * 실제 API 호출 없이 동작 흐름 확인
 */
export async function simulateBatchImageGeneration(
  count: number,
  concurrency: number = 3
): Promise<void> {
  console.log(`\n=== 배치 이미지 생성 시뮬레이션 (${count}개, 동시: ${concurrency}) ===`);

  const startTime = Date.now();
  const results: Array<{ index: number; duration: number; success: boolean }> = [];

  // 동시성 제어 시뮬레이션
  const queue = Array.from({ length: count }, (_, i) => i);
  const processing = new Set<Promise<void>>();

  while (queue.length > 0 || processing.size > 0) {
    // 처리할 작업이 있으면 추가
    while (processing.size < concurrency && queue.length > 0) {
      const index = queue.shift()!;

      const task = simulateImageGeneration(index, concurrency)
        .then((duration) => {
          results.push({ index, duration, success: true });
          console.log(
            `[${index + 1}/${count}] 생성 완료 (${duration.toFixed(1)}초)`
          );
        })
        .catch(() => {
          results.push({ index, duration: 0, success: false });
          console.log(`[${index + 1}/${count}] 생성 실패`);
        })
        .finally(() => {
          processing.delete(task);
        });

      processing.add(task);
    }

    // 하나의 처리가 완료될 때까지 대기
    if (processing.size > 0) {
      await Promise.race(processing);
    }
  }

  const totalDuration = (Date.now() - startTime) / 1000;
  const successCount = results.filter((r) => r.success).length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`\n--- 결과 요약 ---`);
  console.log(`총 시간: ${totalDuration.toFixed(1)}초`);
  console.log(`성공: ${successCount}/${count}`);
  console.log(`평균 생성 시간: ${avgDuration.toFixed(1)}초`);
  console.log(`총 비용: $${(count * 0.04).toFixed(2)}`);
}

/**
 * 단일 이미지 생성 시뮬레이션 (5-10초 대기)
 */
async function simulateImageGeneration(
  index: number,
  concurrency: number
): Promise<number> {
  // 실제 DALL-E 생성 시간: 5-10초
  const delay = 5000 + Math.random() * 5000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return delay / 1000;
}

// ========== 통합 시나리오 테스트 ==========

/**
 * 실제 API 호출 시뮬레이션 (환경 확인)
 */
export async function testEnvironmentSetup(): Promise<void> {
  console.log('\n=== 환경 설정 확인 ===');

  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✓' : '✗';
    const display = value
      ? `${value.substring(0, 20)}...`
      : '(설정 안 됨)';

    console.log(`${status} ${envVar}: ${display}`);
  }
}

/**
 * 프롬프트 최적화 테스트
 */
export function testPromptOptimization(): void {
  console.log('\n=== 프롬프트 최적화 테스트 ===');

  const testPrompts = [
    { prompt: 'AI 기술', style: 'realistic' as const },
    { prompt: 'Python 프로그래밍', style: 'illustration' as const },
    { prompt: ' 아키텍처 다이어그램', style: 'diagram' as const },
    { prompt: '추상 개념', style: 'abstract' as const },
  ];

  for (const test of testPrompts) {
    console.log(`\n원본: "${test.prompt}"`);
    console.log(`스타일: ${test.style}`);
    // 실제 최적화는 generateImage 함수에서 수행
  }
}

// ========== 메인 테스트 실행 ==========

/**
 * 모든 테스트 실행
 */
export async function runAllTests(): Promise<void> {
  console.log('='.repeat(50));
  console.log('이미지 API 테스트 시작');
  console.log('='.repeat(50));

  try {
    // 비용 계산 테스트
    testDALLECostCalculation();
    testStorageCostCalculation();
    testTotalCostCalculation();

    // 환경 설정 확인
    await testEnvironmentSetup();

    // 프롬프트 최적화
    testPromptOptimization();

    // 배치 시뮬레이션 (시간이 오래 걸림 - 선택적)
    // await simulateBatchImageGeneration(10, 3);

    console.log('\n' + '='.repeat(50));
    console.log('테스트 완료');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('테스트 중 오류:', error);
  }
}

// Node.js 환경에서 직접 실행 가능
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

// ========== 성능 측정 ==========

/**
 * 이미지 생성 성능 측정
 */
export async function measureImageGenerationPerformance(): Promise<void> {
  console.log('\n=== 성능 측정 ===');

  const scenarios = [
    { name: '단일 이미지', count: 1 },
    { name: '소규모 배치 (5개)', count: 5 },
    { name: '중규모 배치 (10개)', count: 10 },
    { name: '대규모 배치 (30개)', count: 30 },
  ];

  for (const scenario of scenarios) {
    const startTime = Date.now();

    // 시뮬레이션 (5초 기본값)
    const estimatedTime = Math.ceil(scenario.count * 5000 / 3) / 1000;

    console.log(
      `${scenario.name}: 약 ${estimatedTime.toFixed(0)}초 (비용: $${(scenario.count * 0.04).toFixed(2)})`
    );
  }
}

// 수동으로 실행 가능한 테스트 함수들
export const tests = {
  costCalculation: testDALLECostCalculation,
  storageCalculation: testStorageCostCalculation,
  totalCalculation: testTotalCostCalculation,
  environmentSetup: testEnvironmentSetup,
  promptOptimization: testPromptOptimization,
  batchSimulation: (count?: number) => simulateBatchImageGeneration(count || 10),
  performance: measureImageGenerationPerformance,
  runAll: runAllTests,
};
