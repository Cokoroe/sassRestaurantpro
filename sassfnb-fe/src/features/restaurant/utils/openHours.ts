// src/features/restaurant/utils/openHours.ts
export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "monday", label: "Thứ 2", short: "T2" },
  { key: "tuesday", label: "Thứ 3", short: "T3" },
  { key: "wednesday", label: "Thứ 4", short: "T4" },
  { key: "thursday", label: "Thứ 5", short: "T5" },
  { key: "friday", label: "Thứ 6", short: "T6" },
  { key: "saturday", label: "Thứ 7", short: "T7" },
  { key: "sunday", label: "Chủ nhật", short: "CN" },
];

export const DAY_ORDER: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type DayHours = {
  day: DayKey;
  enabled: boolean;
  open: string;  // always string
  close: string; // always string
};

export const defaultHours = (open = "08:00", close = "18:00"): DayHours[] =>
  DAYS.map((d) => ({
    day: d.key,
    enabled: true,
    open,
    close,
  }));

const isValidTime = (t: unknown): t is string =>
  typeof t === "string" && /^\d{2}:\d{2}$/.test(t);

/**
 * parse openHoursRaw từ DB -> model UI
 * Hỗ trợ:
 *  - {"monday":[["08:00","18:00"]], ...}
 *  - {"monday":["08:00","18:00"], ...}
 *  - {"monday":"08:00-18:00", ...}
 *  - null => default
 */
export function parseOpenHoursToModel(openHoursRaw?: string | null): DayHours[] {
  const base = defaultHours("08:00", "18:00");
  if (!openHoursRaw) return base;

  try {
    const obj = JSON.parse(openHoursRaw) as Record<string, unknown>;

    return base.map((row) => {
      const v = obj[row.day];

      if (Array.isArray(v)) {
        if (v.length === 0) return { ...row, enabled: false };

        const pair = Array.isArray(v[0]) ? (v[0] as unknown[]) : (v as unknown[]);
        const openRaw = pair?.[0];
        const closeRaw = pair?.[1];

        const open = isValidTime(openRaw) ? openRaw : row.open;
        const close = isValidTime(closeRaw) ? closeRaw : row.close;

        return { ...row, enabled: isValidTime(openRaw) && isValidTime(closeRaw), open, close };
      }

      if (typeof v === "string") {
        const m = v.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
        if (m) return { ...row, enabled: true, open: m[1], close: m[2] };
        return { ...row, enabled: false };
      }

      return { ...row, enabled: false };
    });
  } catch {
    return base;
  }
}

export function buildOpenHoursJsonFromModel(model: DayHours[]): string {
  const out: Record<string, unknown> = {};
  model.forEach((d) => {
    if (!d.enabled) out[d.day] = [];
    else out[d.day] = [[d.open, d.close]];
  });
  return JSON.stringify(out);
}

function formatDayRange(days: DayKey[]) {
  const short = (k: DayKey) => DAYS.find((x) => x.key === k)?.short ?? k;
  if (days.length === 1) return short(days[0]);
  return `${short(days[0])}–${short(days[days.length - 1])}`;
}

export function formatOpenHoursCompactLines(openHoursRaw?: string | null): {
  lines: string[];
  full: string;
} {
  const model = parseOpenHoursToModel(openHoursRaw);

  const normalized = DAY_ORDER.map((day) => {
    const row =
      model.find((x) => x.day === day) ??
      ({
        day,
        enabled: false,
        open: "08:00",
        close: "18:00",
      } as DayHours);

    if (!row.enabled) {
      return {
        day,
        key: "OFF",
        text: `${DAYS.find((x) => x.key === day)?.label ?? day}: nghỉ`,
      };
    }

    const slot = `${row.open}–${row.close}`;
    return {
      day,
      key: slot,
      text: `${DAYS.find((x) => x.key === day)?.label ?? day}: ${slot}`,
    };
  });

  const groups: { days: DayKey[]; key: string }[] = [];
  for (const item of normalized) {
    const last = groups[groups.length - 1];
    if (last && last.key === item.key) last.days.push(item.day);
    else groups.push({ days: [item.day], key: item.key });
  }

  const lines = groups.map((g) => {
    if (g.key === "OFF") return `${formatDayRange(g.days)} nghỉ`;
    return `${formatDayRange(g.days)} ${g.key}`;
  });

  const full = normalized.map((x) => x.text).join("\n");
  return { lines, full };
}
