export type PlanId = "basic" | "starter" | "pro" | "enterprise";

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  monthlyCredits: number;
  bulkPostsPerCredit: number;
  description: string;
}

export interface AppUser {
  name: string;
  email: string;
  loginMethod: "google";
  joinedAt: string;
  connectedBlogs?: {
    naver?: {
      blogUrl: string;
      category: string;
    };
    google?: {
      blogUrl: string;
      tags: string[];
    };
  };
}

export interface UsageLogEntry {
  id: string;
  date: string;
  amount: number; // +1 bonus/plan grant, -1 usage
  description: string;
}

export interface BillingEntry {
  id: string;
  date: string;
  planName: string;
  amount: number;
}

export interface BulkOutline {
  h1: string;
  h2: string[];
}

export interface BlogSyncStatus {
  platform: "naver" | "google";
  status: "published" | "scheduled" | "failed";
  publishedAt?: string;
  errorMessage?: string;
}

export interface GeneratedPost {
  id: string;
  mode: "agent" | "bulk";
  title: string;
  content: string; // markdown-ish
  createdAt: string;
  topic: string;
  batchId?: string; // 대량생성 세트 묶음 식별자
  subtitle?: string;
  metaDescription?: string;
  excerpt?: string;
  keyword?: string;
  relatedTags?: string[];
  hashtags?: string[];
  outline?: BulkOutline;
  scheduledPublishAt?: string; // ISO - 예약 발행 시각 (대량 배치 생성에서 사용)
  status?: "draft" | "scheduled" | "published";
  category?: string;
  thumbnailUrl?: string;
  blogSync?: BlogSyncStatus[]; // 네이버/구글 블로그 발행 상태
}

export interface AppState {
  user: AppUser | null;
  plan: PlanId;
  planCreditsRemaining: number;
  bonusCreditsRemaining: number;
  creditsTotal: number;
  usageLog: UsageLogEntry[];
  billingLog: BillingEntry[];
  posts: GeneratedPost[];
}
