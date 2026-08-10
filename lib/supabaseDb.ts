import { supabaseAdmin, User, Post, BlogSyncHistory, APIUsageLog } from './supabaseClient';

// =========== 사용자 관련 함수 ===========

export async function getOrCreateUser(email: string): Promise<User> {
  try {
    // 사용자 존재 여부 확인
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // 새 사용자 생성
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      credits: 10, // 초기 크레딧
      subscriptionPlan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.credits ?? 0;
  } catch (error) {
    console.error('Failed to get user credits:', error);
    throw error;
  }
}

export async function consumeCredit(
  userId: string,
  amount: number
): Promise<number> {
  try {
    const currentCredits = await getUserCredits(userId);
    const newCredits = Math.max(0, currentCredits - amount);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ credits: newCredits, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return newCredits;
  } catch (error) {
    console.error('Failed to consume credit:', error);
    throw error;
  }
}

// =========== 글 관련 함수 ===========

export async function savePost(post: Partial<Post> & { userId: string }): Promise<Post> {
  try {
    const now = new Date().toISOString();
    const postData = {
      ...post,
      id: post.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: post.createdAt || now,
      updatedAt: now,
    };

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save post:', error);
    throw error;
  }
}

export async function getUserPosts(userId: string, limit = 50): Promise<Post[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Failed to get user posts:', error);
    throw error;
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  } catch (error) {
    console.error('Failed to get post:', error);
    throw error;
  }
}

export async function updatePost(
  postId: string,
  updates: Partial<Post>
): Promise<Post> {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
}

export async function updatePostStatus(
  postId: string,
  status: 'draft' | 'scheduled' | 'published'
): Promise<Post> {
  try {
    const updates: Partial<Post> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'published') {
      updates.publishedAt = new Date().toISOString();
    }

    return updatePost(postId, updates);
  } catch (error) {
    console.error('Failed to update post status:', error);
    throw error;
  }
}

// =========== 블로그 동기화 함수 ===========

export async function saveBlogSyncHistory(
  history: Partial<BlogSyncHistory> & { postId: string; platform: string }
): Promise<BlogSyncHistory> {
  try {
    const now = new Date().toISOString();
    const syncData = {
      ...history,
      id: history.id || `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      syncedAt: history.syncedAt || now,
    };

    const { data, error } = await supabaseAdmin
      .from('blog_sync_history')
      .insert([syncData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save blog sync history:', error);
    throw error;
  }
}

export async function getBlogSyncHistory(postId: string): Promise<BlogSyncHistory[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_sync_history')
      .select('*')
      .eq('postId', postId)
      .order('syncedAt', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Failed to get blog sync history:', error);
    throw error;
  }
}

// =========== API 사용량 추적 ===========

export async function logAPIUsage(
  userId: string,
  model: 'gpt-4' | 'gemini' | 'claude',
  tokensUsed: number,
  cost: number
): Promise<APIUsageLog> {
  try {
    const logData: APIUsageLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      model,
      tokensUsed,
      cost,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('api_usage_logs')
      .insert([logData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to log API usage:', error);
    throw error;
  }
}

export async function getAPIUsageByUser(userId: string): Promise<APIUsageLog[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_usage_logs')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Failed to get API usage:', error);
    throw error;
  }
}
