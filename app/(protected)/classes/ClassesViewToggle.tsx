"use client";

import { useState } from "react";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid";
import ClassListView from "./ClassListView";

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

type View = "schedule" | "list";

export default function ClassesViewToggle({ classes }: { classes: ClassItem[] }) {
  const [view, setView] = useState<View>("schedule");

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-btn w-fit">
        <button
          type="button"
          onClick={() => setView("schedule")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "schedule"
              ? "bg-white shadow-sm text-text-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-white shadow-sm text-text-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          List
        </button>
      </div>

      <div className="mt-4">
        {view === "schedule" ? (
          <WeeklyScheduleGrid classes={classes} />
        ) : (
          <ClassListView classes={classes} />
        )}
      </div>
    </div>
  );
}
