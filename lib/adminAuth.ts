// 관리자 이메일 목록 (localStorage에 저장)
const ADMINS_STORAGE_KEY = "triplewriter_admins";

export function getAdmins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ADMINS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : ["admin@example.com"];
  } catch {
    return ["admin@example.com"];
  }
}

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const admins = getAdmins();
  return admins.includes(email);
}

export function addAdmin(email: string): void {
  if (typeof window === "undefined") return;
  const admins = getAdmins();
  if (!admins.includes(email)) {
    admins.push(email);
    window.localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
  }
}

export function removeAdmin(email: string): void {
  if (typeof window === "undefined") return;
  const admins = getAdmins();
  const filtered = admins.filter((e) => e !== email);
  window.localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(filtered));
}
