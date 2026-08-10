import { PlanInfo, PlanId } from "./types";

export const PLANS: PlanInfo[] = [
  {
    id: "basic",
    name: "베이직",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 1,
    bulkPostsPerCredit: 30,
    description: "가볍게 체험해보고 싶은 분께",
  },
  {
    id: "starter",
    name: "스타터",
    priceMonthly: 9900,
    priceYearly: 99000,
    monthlyCredits: 30,
    bulkPostsPerCredit: 30,
    description: "꾸준히 블로그를 운영하는 분께",
  },
  {
    id: "pro",
    name: "프로",
    priceMonthly: 19900,
    priceYearly: 199000,
    monthlyCredits: 70,
    bulkPostsPerCredit: 30,
    description: "여러 채널을 동시에 운영하는 분께",
  },
  {
    id: "enterprise",
    name: "엔터프라이즈",
    priceMonthly: 49900,
    priceYearly: 499000,
    monthlyCredits: 200,
    bulkPostsPerCredit: 30,
    description: "대량 콘텐츠가 필요한 팀/에이전시께",
  },
];

export function getPlan(id: PlanId): PlanInfo {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
