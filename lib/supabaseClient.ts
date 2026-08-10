// Mock Supabase Client - 실제 Supabase가 없을 때 사용
// 실제 Supabase를 사용하려면 아래를 활성화하세요:
/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);
*/

// Mock 클라이언트
const createMockQuery = () => ({
  select: (cols?: string) => ({ data: [], error: null }),
  eq: (col: string, value: any) => ({ data: [], error: null }),
  single: () => ({ data: null, error: null }),
  insert: (rows: any[]) => ({ data: rows, error: null }),
  update: (updates: any) => ({ data: [], error: null }),
  delete: () => ({ data: [], error: null }),
  order: (col: string, opts?: any) => ({ data: [], error: null }),
  limit: (n: number) => ({ data: [], error: null }),
});

const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
  from: (table: string) => {
    const query = createMockQuery();
    return {
      ...query,
      select: (cols?: string) => ({
        ...createMockQuery(),
        eq: (col: string, value: any) => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: (rows: any[]) => ({
        select: () => ({
          single: async () => ({ data: rows[0] || null, error: null }),
        }),
      }),
      update: (updates: any) => ({
        eq: (col: string, value: any) => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    };
  },
};

export const supabase = mockClient as any;
export const supabaseAdmin = mockClient as any;

// 데이터베이스 타입 정의
export interface User {
  id: string;
  email: string;
  name?: string;
  credits: number;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  subscriptionEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  metaDescription: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  gptContent?: string;
  geminiContent?: string;
  claudeContent?: string;
  gptTokens?: number;
  geminiTokens?: number;
  claudeTokens?: number;
  tags: string[];
  thumbnailUrl?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogSyncHistory {
  id: string;
  postId: string;
  platform: 'naver' | 'google' | 'medium' | 'dev' | 'hashnode' | 'custom';
  syncedUrl?: string;
  postUrl?: string;
  syncStatus: 'published' | 'scheduled' | 'failed' | 'pending' | 'success';
  errorMessage?: string;
  syncedAt: string;
}

export interface APIUsageLog {
  id: string;
  userId: string;
  model: 'gpt-4' | 'gemini' | 'claude';
  tokensUsed: number;
  cost: number;
  createdAt: string;
}
