export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
