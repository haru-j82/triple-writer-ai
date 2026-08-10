// Mock Image API - 실제 API 키 없을 때 사용
// 실제 OpenAI를 사용하려면 아래를 활성화하세요:
/*
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
*/

import { supabaseAdmin } from './supabaseClient';

const openai = null; // Mock mode

// 이미지 생성 응답 인터페이스
export interface GenerateImageResult {
  imageUrl: string;
  cost: number;
  prompt: string;
  style: string;
}

// 이미지 업로드 응답 인터페이스
export interface UploadImageResult {
  storagePath: string;
  publicUrl: string;
  imageUrl?: string;
}

// ========== DALL-E 3 이미지 생성 ==========

/**
 * 프롬프트를 DALL-E 3 기준으로 최적화
 */
function optimizePrompt(
  basePrompt: string,
  style: 'realistic' | 'illustration' | 'diagram' | 'abstract'
): string {
  const styleGuide: Record<string, string> = {
    realistic: 'photorealistic, professional photography, high quality, 4K',
    illustration: 'illustration art style, hand-drawn, colorful, artistic',
    diagram: 'technical diagram, clean design, minimalist, vector style, clear labels',
    abstract: 'abstract art, modern design, creative, artistic composition',
  };

  const instruction = styleGuide[style] || styleGuide.realistic;
  return `${basePrompt}. Style: ${instruction}. High quality, professional, suitable for blog thumbnail.`;
}

/**
 * 스타일별 이미지 생성/검색
 * @param prompt 프롬프트
 * @param style 스타일
 * @returns 생성된 이미지 URL과 비용
 */
export async function generateImage(
  prompt: string,
  style: 'realistic' | 'illustration' | 'diagram' | 'abstract' = 'realistic'
): Promise<GenerateImageResult> {
  try {
    let imageUrl: string;
    let cost: number;

    switch (style) {
      case 'realistic':
        // 실제 이미지: Unsplash에서 검색
        imageUrl = await fetchRealImage(prompt);
        cost = 0; // 무료 API 사용
        break;

      case 'illustration':
      case 'abstract':
        // AI 생성: DALL-E 또는 Mock
        imageUrl = await generateAIImage(prompt, style);
        cost = 0.04; // Mock cost
        break;

      case 'diagram':
        // 다이어그램: 키워드 기반 검색
        imageUrl = await fetchDiagramImage(prompt);
        cost = 0; // 무료 API 사용
        break;

      default:
        imageUrl = await fetchRealImage(prompt);
        cost = 0;
    }

    return {
      imageUrl,
      cost,
      prompt,
      style,
    };
  } catch (error) {
    console.error('Failed to generate image:', error);
    // 폴백: 기본 이미지 URL 반환
    return {
      imageUrl: generatePlaceholderImage(prompt),
      cost: 0,
      prompt,
      style,
    };
  }
}

/**
 * 실제 사진 이미지 검색 - 다양한 키워드 조합 시도
 */
async function fetchRealImage(prompt: string): Promise<string> {
  try {
    // 기본 키워드 추출
    const keywords = extractKeywords(prompt);

    // 여러 키워드 조합 생성 (다양성 보장)
    const keywordVariations = [
      keywords,
      keywords.slice(0, 2),
      [keywords[0], ...['lifestyle', 'modern', 'trending'].filter(k => !keywords.includes(k))],
      ['nature', 'landscape', ...keywords.slice(0, 1)],
    ];

    for (const variation of keywordVariations) {
      // 1차 시도: Unsplash (안정적)
      const unsplashResult = await fetchFromUnsplash(variation);
      if (unsplashResult) return unsplashResult;

      // 2차 시도: Pixabay (다양성)
      const pixabayResult = await fetchFromPixabay(variation);
      if (pixabayResult) return pixabayResult;

      // 3차 시도: Pexels
      const pexelsResult = await fetchFromPexels(variation);
      if (pexelsResult) return pexelsResult;
    }

    // 모두 실패하면 플레이스홀더
    return generatePlaceholderImage(prompt);
  } catch (error) {
    console.error('Failed to fetch real image:', error);
    return generatePlaceholderImage(prompt);
  }
}

/**
 * 프롬프트에서 핵심 키워드 추출 (한글/영문 모두 지원)
 */
function extractKeywords(prompt: string): string[] {
  // 한글 → 영문 매핑
  const koreanToEnglish: Record<string, string> = {
    '카페': 'cafe coffee shop',
    '해변': 'beach coastal',
    '바다': 'sea ocean',
    '블로그': 'blog',
    '이미지': 'image',
    '여수': 'Yeosu Korea travel',
    '서울': 'Seoul Korea',
    '부산': 'Busan Korea',
    '대구': 'Daegu Korea',
    '추천': 'recommend',
    '사진': 'photography',
    '디자인': 'design',
    '아트': 'art',
    '풍경': 'landscape scenery',
    '음식': 'food cuisine',
    '음료': 'beverage drink',
    '인테리어': 'interior design',
    '현대': 'modern contemporary',
    '전통': 'traditional',
    'seo': 'seo search engine optimization',
    '최적화': 'optimization',
  };

  // 프롬프트를 단어로 분리
  const words = prompt.split(/[\s,\.!?]+/).filter(w => w.length > 0);

  const result: Set<string> = new Set();

  // 각 단어를 변환
  for (const word of words) {
    const lower = word.toLowerCase();

    // 한글 매핑 확인
    if (koreanToEnglish[word]) {
      const translated = koreanToEnglish[word];
      translated.split(' ').forEach(t => result.add(t));
    }
    // 영문이면 그대로 추가
    else if (/^[a-z]+$/i.test(word) && word.length > 2) {
      result.add(lower);
    }
    // 숫자/특수문자는 제외
    else if (!/[\d\-_]/.test(word) && word.length > 2) {
      result.add(word);
    }
  }

  // 결과 배열로 변환 (중복 제거, 최대 5개)
  const finalResult = Array.from(result).slice(0, 5);

  // 비어있으면 기본값
  return finalResult.length > 0 ? finalResult : ['cafe', 'travel', 'lifestyle'];
}

/**
 * Pixabay에서 이미지 검색 (추천) - 완전한 다양성 보장
 */
async function fetchFromPixabay(keywords: string[]): Promise<string | null> {
  try {
    // 키워드를 여러 조합으로 시도 (매번 다르게)
    const queries = [
      keywords.join(' '),           // 전체 키워드
      keywords.slice(0, 2).join(' '), // 처음 2개
      keywords[0],                    // 첫 번째만
      keywords.length > 1 ? keywords[1] : keywords[0], // 두 번째 (있으면)
    ];

    for (const query of queries) {
      if (!query || query.length === 0) continue;

      // 다양성을 위한 여러 전략 적용
      for (let attempt = 0; attempt < 5; attempt++) {
        // 1. 페이지 번호 다양화 (1-10 범위)
        const page = Math.floor(Math.random() * 10) + 1;

        // 2. 정렬 방식 다양화
        const orderMethods = ['popular', 'latest'];
        const order = orderMethods[Math.floor(Math.random() * orderMethods.length)];

        // 3. 결과 개수 다양화
        const perPage = [30, 50][Math.floor(Math.random() * 2)];

        // 4. 캐시 무효화 (타임스탬프)
        const timestamp = Math.random().toString(36).substring(2, 11);

        const url = `https://pixabay.com/api/?key=44952137-b59fbcc0a0d3de0e826c7bd82&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}&page=${page}&order=${order}&min_width=800&min_height=600&_cache=${timestamp}`;

        try {
          const response = await fetch(url, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
            },
          });

          if (response.ok) {
            const data = await response.json() as any;
            if (data?.hits && data.hits.length > 0) {
              // 전체 결과 중에서 다양한 범위에서 무작위 선택
              // 처음과 끝을 피하고 중간 범위에서 선택
              const minIdx = Math.max(0, Math.floor(data.hits.length * 0.05));
              const maxIdx = Math.min(data.hits.length - 1, Math.floor(data.hits.length * 0.95));
              const randomIndex = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;

              const image = data.hits[randomIndex];
              if (image?.largeImageURL) {
                console.log(
                  `✓ Pixabay: "${query}" (page ${page}, ${order}, #${randomIndex}/${data.hits.length}) → ${image.largeImageURL.substring(0, 50)}...`
                );
                return image.largeImageURL;
              }
            }
          }
        } catch (e) {
          console.warn(`Pixabay attempt ${attempt + 1} failed for "${query}"`);
          // 작은 지연 후 재시도
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
          continue;
        }
      }
    }

    console.warn(`✗ Pixabay: 모든 시도 실패 - ${keywords.join(', ')}`);
    return null;
  } catch (error) {
    console.error('Pixabay fetch failed:', error);
    return null;
  }
}

/**
 * Pexels에서 이미지 검색 (다양성 최대화)
 */
async function fetchFromPexels(keywords: string[]): Promise<string | null> {
  try {
    const query = keywords.join(' ');

    // 다양성을 위해 여러 페이지 시도
    const pages = [1, 2, 3, 4, 5];
    const randomPage = pages[Math.floor(Math.random() * pages.length)];

    // 다양성을 위해 여러 결과 개수 시도
    const perPage = Math.random() > 0.5 ? 50 : 80;

    // 캐시 무효화
    const timestamp = Math.random().toString(36).substring(2, 11);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${randomPage}&_t=${timestamp}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': process.env.PEXELS_API_KEY || 'demo',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data?.photos && data.photos.length > 0) {
        // 결과 중 임의의 위치 선택 (다양성 확보)
        const resultIndex = Math.floor(Math.random() * Math.min(data.photos.length, 10));
        if (data.photos[resultIndex]?.src?.large) {
          return data.photos[resultIndex].src.large;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Pexels fetch failed:', error);
    return null;
  }
}

/**
 * Unsplash에서 이미지 검색 (Source API - 인증 불필요)
 */
async function fetchFromUnsplash(keywords: string[]): Promise<string | null> {
  try {
    // Unsplash Source API를 사용하여 매번 다른 이미지 획득
    // 캐시 무효화를 위해 타임스탐프 추가
    const query = keywords.join('+');
    const timestamp = Math.random().toString(36).substring(2, 11);
    const url = `https://source.unsplash.com/1024x768/?${query}&t=${timestamp}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
      redirect: 'follow',
    });

    // Unsplash Source는 리다이렉트로 실제 이미지 URL을 반환합니다
    if (response.ok) {
      // 리다이렉트된 URL이 최종 이미지 URL입니다
      return response.url;
    }
    return null;
  } catch (error) {
    console.error('Unsplash fetch failed:', error);
    return null;
  }
}

/**
 * 다이어그램/인포그래픽 이미지 검색
 */
async function fetchDiagramImage(prompt: string): Promise<string> {
  try {
    const keywords = extractKeywords(prompt);
    const diagKeywords = [...keywords, 'diagram', 'infographic'];

    // Pixabay에서 검색
    const pixabayResult = await fetchFromPixabay(diagKeywords);
    if (pixabayResult) return pixabayResult;

    // Pexels에서 검색
    const pexelsResult = await fetchFromPexels(diagKeywords);
    if (pexelsResult) return pexelsResult;

    return generatePlaceholderImage(prompt);
  } catch (error) {
    console.error('Failed to fetch diagram image:', error);
    return generatePlaceholderImage(prompt);
  }
}

/**
 * AI 이미지 생성 (Mock - 추상/일러스트 스타일)
 */
async function generateAIImage(
  prompt: string,
  style: 'illustration' | 'abstract'
): Promise<string> {
  try {
    const keywords = extractKeywords(prompt);

    if (style === 'illustration') {
      // 일러스트: art, illustration 키워드 추가
      const illKeywords = [...keywords, 'illustration', 'art'];
      const result = await fetchFromPixabay(illKeywords);
      if (result) return result;
    } else if (style === 'abstract') {
      // 추상: abstract, colorful 등의 키워드
      const absKeywords = [...keywords, 'abstract', 'pattern'];
      const result = await fetchFromPixabay(absKeywords);
      if (result) return result;
    }

    // 폴백: 일반 이미지
    return fetchRealImage(prompt);
  } catch (error) {
    console.error('Failed to generate AI image:', error);
    return generatePlaceholderImage(prompt);
  }
}

/**
 * 플레이스홀더 이미지 생성
 */
function generatePlaceholderImage(prompt: string): string {
  // DiceBear API를 사용해서 생성 이미지 생성
  const encoded = encodeURIComponent(prompt);
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encoded}&scale=80`;
}

/**
 * 삽입 위치별 다양한 프롬프트 생성
 * @param basePrompt 기본 프롬프트
 * @param position 삽입 위치 (0: 썸네일, 1-n: 본문 중간, -1: 마무리)
 * @param totalImages 전체 이미지 개수
 */
export function generatePromptForPosition(
  basePrompt: string,
  position: number,
  totalImages: number
): string {
  // 위치별 프롬프트 다양화
  const positionModifiers: Record<number, string> = {
    0: "대표 이미지, 썸네일", // 썸네일
    [-1]: "마무리, 결론 이미지", // 마지막
  };

  const modifier = positionModifiers[position] || `본문 삽입 이미지 ${position}`;

  // 키워드에 위치 정보 추가
  return `${basePrompt} - ${modifier}`.trim();
}

/**
 * 본문 단락 수 계산
 */
export function countParagraphs(content: string): number {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  return Math.max(3, Math.min(10, paragraphs.length)); // 최소 3개, 최대 10개
}

// ========== Supabase Storage에 이미지 저장 ==========

/**
 * 이미지 저장 (Mock - Supabase 없이 직접 URL 사용)
 * @param imageUrl 이미지 URL
 * @param userId 사용자 ID
 * @param blogId 블로그 ID
 * @param fileName 선택적 파일명
 * @returns 저장된 경로와 공개 URL
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  userId: string,
  blogId: string,
  fileName?: string
): Promise<UploadImageResult> {
  try {
    // Mock: Supabase 없이 원본 URL을 그대로 반환
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const name = fileName || `image-${timestamp}-${randomStr}.png`;
    const storagePath = `blogs/${userId}/${blogId}/images/${name}`;
    const publicUrl = imageUrl; // 원본 URL 사용

    console.log(`Mock upload: ${storagePath} -> ${publicUrl}`);

    return {
      storagePath,
      publicUrl,
      imageUrl: publicUrl,
    };
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw new Error(
      `이미지 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ========== 통합: 생성 + 저장 ==========

/**
 * DALL-E로 이미지를 생성하고 Supabase에 저장
 * @param prompt 프롬프트
 * @param userId 사용자 ID
 * @param blogId 블로그 ID
 * @param style 스타일
 * @returns 공개 URL과 비용
 */
export async function generateAndSaveImage(
  prompt: string,
  userId: string,
  blogId: string,
  style: 'realistic' | 'illustration' | 'diagram' | 'abstract' = 'realistic'
): Promise<UploadImageResult & { cost: number }> {
  try {
    // 1. DALL-E로 이미지 생성
    const generateResult = await generateImage(prompt, style);

    // 2. Supabase에 저장
    const uploadResult = await uploadImageToSupabase(
      generateResult.imageUrl,
      userId,
      blogId
    );

    return {
      ...uploadResult,
      cost: generateResult.cost,
    };
  } catch (error) {
    console.error('Failed to generate and save image:', error);
    throw error;
  }
}

// ========== 배치 처리용 유틸 ==========

/**
 * 여러 이미지를 동시에 생성하고 저장 (동시성 제어 포함)
 * @param prompts 프롬프트 배열
 * @param userId 사용자 ID
 * @param blogId 블로그 ID
 * @param concurrency 동시 처리 개수 (기본값: 3)
 * @param style 스타일 (모든 이미지에 동일 적용)
 * @returns 결과 배열
 */
export async function generateAndSaveImagesBatch(
  prompts: string[],
  userId: string,
  blogId: string,
  concurrency: number = 3,
  style: 'realistic' | 'illustration' | 'diagram' | 'abstract' = 'realistic'
): Promise<(UploadImageResult & { cost: number; prompt: string })[]> {
  const results: (UploadImageResult & { cost: number; prompt: string })[] = [];
  const errors: Error[] = [];

  // 동시성 제어를 위한 큐 처리
  const queue = [...prompts];
  const processing = new Set<Promise<void>>();

  while (queue.length > 0 || processing.size > 0) {
    // 처리할 작업이 있으면 추가
    while (processing.size < concurrency && queue.length > 0) {
      const prompt = queue.shift()!;

      const task = generateAndSaveImage(prompt, userId, blogId, style)
        .then((result) => {
          results.push({
            ...result,
            prompt,
          });
        })
        .catch((error) => {
          errors.push(error);
          results.push({
            storagePath: '',
            publicUrl: '',
            imageUrl: '',
            cost: 0,
            prompt,
          });
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

  // 에러가 있으면 로깅
  if (errors.length > 0) {
    console.warn(`${errors.length} images failed to generate:`, errors);
  }

  return results;
}

// ========== 비용 계산 ==========

/**
 * DALL-E 3 생성 비용 계산
 * @param count 생성 이미지 개수
 * @param quality 품질 ('standard' = $0.04, 'hd' = $0.08)
 * @returns 총 비용
 */
export function calculateDALLECost(
  count: number,
  quality: 'standard' | 'hd' = 'standard'
): number {
  const pricePerImage = quality === 'hd' ? 0.08 : 0.04;
  return count * pricePerImage;
}

/**
 * Supabase Storage 비용 계산 (저장소 + 대역폭)
 * 기본: 저장소 1GB 무료, 다운로드 1GB 무료
 * 초과: $5 per GB
 * 평균 이미지: ~500KB, Supabase 저장소 1GB는 약 2000개 이미지 저장 가능
 * @param imageCount 이미지 개수
 * @returns 예상 비용 (무료 범위 내면 0)
 */
export function calculateStorageCost(imageCount: number): number {
  const avgImageSize = 500 * 1024; // 500KB
  const totalSize = imageCount * avgImageSize;
  const freeStorage = 1 * 1024 * 1024 * 1024; // 1GB

  if (totalSize <= freeStorage) {
    return 0;
  }

  const overageSize = totalSize - freeStorage;
  const overageGB = overageSize / (1024 * 1024 * 1024);
  return overageGB * 5; // $5 per GB
}

/**
 * 전체 이미지 생성 + 저장 비용 계산
 * @param imageCount 생성 이미지 개수
 * @returns 총 비용
 */
export function calculateTotalImageCost(imageCount: number): number {
  const dalleCost = calculateDALLECost(imageCount, 'standard');
  const storageCost = calculateStorageCost(imageCount);
  return dalleCost + storageCost;
}
