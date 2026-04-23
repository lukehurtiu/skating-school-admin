"use client";

import { useRouter } from "next/navigation";
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

function formatDay(d: string) {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default function ClassListView({ classes }: { classes: ClassItem[] }) {
  const router = useRouter();

  return (
    <div className="table-container">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-surface">
          <tr>
            {["Name", "Day", "Time", "Location", "Level", "Instructor", "Enrolled"].map((h) => (
              <th key={h} className="th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {classes.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-surface cursor-pointer transition-colors"
              onClick={() => router.push(`/classes/${c.id}`)}
            >
              <td className="td-primary">{c.name}</td>
              <td className="td">{formatDay(c.day_of_week)}</td>
              <td className="td">{formatTime(c.start_time)} – {formatTime(c.end_time)}</td>
              <td className="td">{c.location}</td>
              <td className="td">
                {c.levelName ? <LevelBadge levelName={c.levelName} /> : "—"}
              </td>
              <td className="td">{c.instructorName ?? "—"}</td>
              <td className="td">{c.enrollmentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
