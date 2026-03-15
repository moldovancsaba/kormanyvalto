const MAIN_SCOPE = "main";
const MAX_SCOPE_LENGTH = 120;
const SCOPE_PATTERN = /^[a-z0-9/_-]+$/;
const DISTRICT_SCOPE_PATTERN = /^ogy2026\/egyeni-valasztokeruletek\/\d{2}\/\d{2}$/;
const COUNTY_SCOPE_PATTERN = /^ogy2026\/egyeni-valasztokeruletek\/\d{2}$/;

export function normalizeScope(rawScope: string | null | undefined): string | null {
  const scope = (rawScope || MAIN_SCOPE).trim().slice(0, MAX_SCOPE_LENGTH);
  if (!scope) return MAIN_SCOPE;
  if (!SCOPE_PATTERN.test(scope)) return null;
  if (scope === MAIN_SCOPE) return MAIN_SCOPE;
  if (COUNTY_SCOPE_PATTERN.test(scope) || DISTRICT_SCOPE_PATTERN.test(scope)) return scope;
  return null;
}

export function normalizePagination(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const integer = Math.trunc(parsed);
  if (integer < min) return min;
  if (integer > max) return max;
  return integer;
}
