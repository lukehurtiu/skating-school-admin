"use client";

import { useState } from "react";
import AssessmentForm from "./AssessmentForm";
import { AssessmentStatus, Skill, SkatingClass, SkatingLevel } from "@/lib/types";

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

type AssessmentInfo = {
  status: AssessmentStatus;
  assessed_on?: string;
  comment?: string;
};

type Props = {
  levels: LevelWithSkills[];
  studentLevelId: string | null;
  latestBySkill: Record<string, AssessmentInfo>;
  canAssess: boolean;
  instructorClasses: Pick<SkatingClass, "id" | "name">[];
  studentId: string;
};

const STATUS_BADGE: Record<AssessmentStatus, string> = {
  not_assessed: "badge-gray",
  in_progress:  "badge-yellow",
  passed:       "badge-green",
};

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  not_assessed: "Not assessed",
  in_progress:  "In progress",
  passed:       "Passed",
};

export default function SkillsAccordion({
  levels,
  studentLevelId,
  latestBySkill,
  canAssess,
  instructorClasses,
  studentId,
}: Props) {
  const [openLevels, setOpenLevels] = useState<Set<string>>(
    () => new Set(studentLevelId ? [studentLevelId] : [])
  );

  function toggle(levelId: string) {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const isOpen = openLevels.has(level.id);
        const levelPassedCount = level.skills.filter(
          (s) => latestBySkill[s.id]?.status === "passed"
        ).length;

        return (
          <div key={level.id} className="card overflow-hidden">
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggle(level.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-text-primary">{level.name}</span>
                <span className="text-xs text-text-muted">
                  {levelPassedCount}/{level.skills.length} passed
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {level.skills.map((skill, idx) => {
                  const assessment = latestBySkill[skill.id];
                  const currentStatus: AssessmentStatus = assessment?.status ?? "not_assessed";

                  return (
                    <li key={skill.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary">
                            <span className="mr-2 text-text-muted text-xs">{idx + 1}.</span>
                            {skill.name}
                          </p>
                          {skill.description && (
                            <p className="mt-0.5 text-xs text-text-muted">{skill.description}</p>
                          )}
                          {assessment?.comment && (
                            <p className="mt-1 text-xs italic text-text-muted">
                              &ldquo;{assessment.comment}&rdquo;
                            </p>
                          )}
                          {assessment?.assessed_on && (
                            <p className="mt-0.5 text-xs text-text-muted">
                              Last assessed {assessment.assessed_on}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className={STATUS_BADGE[currentStatus]}>
                            {STATUS_LABELS[currentStatus]}
                          </span>
                          {canAssess && (
                            <AssessmentForm
                              studentId={studentId}
                              skillId={skill.id}
                              currentStatus={currentStatus}
                              instructorClasses={instructorClasses}
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
