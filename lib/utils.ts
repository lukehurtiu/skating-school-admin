export function formatSchedule(day: string, start: string, end: string): string {
  const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
  const startFormatted = start.slice(0, 5);
  const endFormatted = end.slice(0, 5);
  return `${capitalizedDay}, ${startFormatted} – ${endFormatted}`;
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TZ = "America/New_York";

export function getDayOfWeekIndex(day: string): number {
  return DAY_ORDER.indexOf(day.toLowerCase());
}

/** Returns today's date string as "YYYY-MM-DD" in EST/EDT. */
export function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Returns the lowercase weekday name for today in EST/EDT (e.g. "monday"). */
export function getTodayDayName(): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" })
    .format(new Date())
    .toLowerCase();
}

export function isToday(dayOfWeek: string): boolean {
  return dayOfWeek.toLowerCase() === getTodayDayName();
}

const LEVEL_BADGE_MAP: Record<string, string> = {
  "Parent Tot":   "level-parent-tot",
  "Tot 2":        "level-tot-2",
  "Level 1":      "level-1",
  "Level 2":      "level-2",
  "Level 3":      "level-3",
  "Level 4":      "level-4",
  "Level 5":      "level-5",
  "Pre-Free Skate": "level-pre-free",
  "Pre Free Skate": "level-pre-free",
};

export function getLevelBadgeClass(levelName: string): string {
  return LEVEL_BADGE_MAP[levelName] ?? "level-default";
}
