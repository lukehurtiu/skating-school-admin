"use client";

import Link from "next/link";
import LevelBadge from "@/components/LevelBadge";

type ClassItem = {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  enrollmentCount: number;
  instructorName: string | null;
  levelName: string | null;
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat",
};

// Assign muted colors to rinks
const RINK_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-orange-50 border-orange-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-yellow-50 border-yellow-200",
];

function getRinkColor(location: string, rinkMap: Map<string, number>): string {
  if (!rinkMap.has(location)) {
    rinkMap.set(location, rinkMap.size % RINK_COLORS.length);
  }
  return RINK_COLORS[rinkMap.get(location)!];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default function WeeklyScheduleGrid({ classes }: { classes: ClassItem[] }) {
  const rinkMap = new Map<string, number>();

  // Build legend
  const uniqueRinks = Array.from(new Set(classes.map((c) => c.location)));
  uniqueRinks.forEach((r) => getRinkColor(r, rinkMap));

  // Group by day
  const byDay = new Map<string, ClassItem[]>();
  for (const day of DAYS) byDay.set(day, []);
  for (const c of classes) {
    const day = c.day_of_week.toLowerCase();
    if (byDay.has(day)) byDay.get(day)!.push(c);
  }

  // Collect all unique time slots, sorted
  const timeSlots = Array.from(
    new Set(classes.map((c) => c.start_time.slice(0, 5)))
  ).sort();

  if (timeSlots.length === 0) return null;

  return (
    <div>
      {/* Rink legend */}
      {uniqueRinks.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-text-muted">Rink:</span>
          {uniqueRinks.map((rink) => (
            <span
              key={rink}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs ${getRinkColor(rink, rinkMap)}`}
            >
              {rink}
            </span>
          ))}
        </div>
      )}

      {/* Grid: time axis + day columns */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(6,1fr)] gap-1 mb-1">
            <div /> {/* time gutter */}
            {DAYS.map((day) => {
              const count = (byDay.get(day) ?? []).length;
              return (
                <div key={day} className="text-center">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${count > 0 ? "text-text-primary" : "text-text-muted"}`}>
                    {DAY_LABELS[day]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {timeSlots.map((slot) => {
            const slotMinutes = timeToMinutes(slot);

            return (
              <div key={slot} className="grid grid-cols-[56px_repeat(6,1fr)] gap-1 mb-1 items-start">
                {/* Time label */}
                <div className="pt-2 text-right pr-2">
                  <span className="text-[11px] text-text-muted">{slot}</span>
                </div>

                {DAYS.map((day) => {
                  const dayClasses = (byDay.get(day) ?? []).filter(
                    (c) => c.start_time.slice(0, 5) === slot
                  );

                  if (dayClasses.length === 0) {
                    return (
                      <div key={day} className="min-h-[60px] rounded border border-dashed border-slate-100" />
                    );
                  }

                  return (
                    <div key={day} className="flex flex-col gap-1">
                      {dayClasses.map((c) => {
                        const colorClass = getRinkColor(c.location, rinkMap);
                        const durationMin = timeToMinutes(c.end_time) - slotMinutes;
                        const heightClass = durationMin >= 90 ? "min-h-[100px]" : durationMin >= 60 ? "min-h-[80px]" : "min-h-[60px]";

                        return (
                          <Link
                            key={c.id}
                            href={`/classes/${c.id}`}
                            className={`block rounded border p-2 transition-shadow hover:shadow-card ${colorClass} ${heightClass}`}
                          >
                            <p className="text-xs font-semibold text-text-primary leading-tight truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {formatTime(c.start_time)}–{formatTime(c.end_time)}
                            </p>
                            {c.levelName && (
                              <div className="mt-1">
                                <LevelBadge levelName={c.levelName} />
                              </div>
                            )}
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[10px] text-text-muted">{getInitials(c.instructorName)}</span>
                              <span className="text-[10px] text-text-muted">{c.enrollmentCount} enrolled</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
