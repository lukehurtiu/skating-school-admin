"use client";

import { useRouter } from "next/navigation";
import LevelBadge from "@/components/LevelBadge";
import AvatarInitials from "@/components/AvatarInitials";
import ProgressBar from "@/components/ProgressBar";

type StudentItem = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  levelName: string | null;
  enrolledClass: string | null;
  passedSkills: number;
  totalSkills: number;
};

export default function StudentList({
  students,
  isAdmin,
}: {
  students: StudentItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();

  return (
    <div className="card divide-y divide-slate-100">
      {students.map((s) => (
        <div
          key={s.id}
          onClick={() => router.push(`/students/${s.id}/skills`)}
          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface cursor-pointer group"
        >
          <AvatarInitials name={`${s.first_name} ${s.last_name}`} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-text-primary">
                {s.first_name} {s.last_name}
              </span>
              {s.age !== null && (
                <span className="text-xs text-text-muted">age {s.age}</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
              {s.levelName && <LevelBadge levelName={s.levelName} />}
              {s.enrolledClass && (
                <span className="text-xs text-text-muted truncate">{s.enrolledClass}</span>
              )}
            </div>
          </div>

          {s.totalSkills > 0 && (
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
              <span className="text-xs text-text-muted">
                {s.passedSkills}/{s.totalSkills} skills
              </span>
              <ProgressBar current={s.passedSkills} total={s.totalSkills} size="sm" />
            </div>
          )}

          {isAdmin && (
            <a
              href={`/students/${s.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="hidden group-hover:inline-flex btn-ghost text-xs shrink-0"
            >
              Edit
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
