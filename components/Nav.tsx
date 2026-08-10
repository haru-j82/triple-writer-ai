"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { isAdmin } from "@/lib/adminAuth";

const APP_NAV_ITEMS = [
  { href: "/write", label: "에이전트 모드" },
  { href: "/bulk-generate", label: "대량 생성" },
  { href: "/bulk-batch", label: "대량 생성 (배치)" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/pricing", label: "요금제" },
  { href: "/settings", label: "설정" },
];

const MARKETING_NAV_ITEMS = [
  { href: "#top", label: "홈" },
  { href: "#intro", label: "소개" },
  { href: "#benefits", label: "서비스" },
  { href: "#how", label: "작동 방식" },
  { href: "#pricing", label: "요금제" },
  { href: "#faq", label: "자주 묻는 질문" },
];

export default function Nav() {
  const { state, hydrated, creditsRemaining, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn = hydrated && !!state.user;
  const isAdminUser = isLoggedIn && isAdmin(state.user?.email);
  const showMarketingNav = pathname === "/" && !isLoggedIn;

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white text-sm">
            T
          </span>
          트리플로그 AI
        </Link>

        {isLoggedIn && (
          <nav className="hidden gap-1 md:flex">
            {APP_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-violet-100 text-violet-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdminUser && (
              <Link
                href="/admin"
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname.startsWith("/admin")
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                관리자
              </Link>
            )}
          </nav>
        )}

        {showMarketingNav && (
          <nav className="hidden gap-1 md:flex">
            {MARKETING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 text-sm">
          {isLoggedIn ? (
            <>
              <span className="hidden rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 sm:inline">
                남은 크레딧 {creditsRemaining}회
              </span>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                {state.user!.email}
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            hydrated && (
              <Link
                href="/login"
                className="rounded-md bg-violet-600 px-4 py-1.5 font-medium text-white hover:bg-violet-700"
              >
                로그인
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
