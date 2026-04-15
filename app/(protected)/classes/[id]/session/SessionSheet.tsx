"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sessionMarkAttendance, sessionQuickAssess } from "./actions";
import { AssessmentStatus, Skill, SkatingLevel } from "@/lib/types";

type SessionStudent = {
  enrollmentId: string;
  studentId: string;
  name: string;
  skatingLevelId: string | null;
  attendanceStatus: "present" | "absent" | null;
};

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

type Props = {
  classId: string;
  date: string;
  students: SessionStudent[];
  skillsByLevel: LevelWithSkills[];
  latestAssessments: Record<string, AssessmentStatus>; // key: "studentId:skillId"
};

const STATUS_BADGE: Record<AssessmentStatus, string> = {
  not_assessed: "badge-gray",
  in_progress: "badge-yellow",
  passed: "badge-green",
};

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  not_assessed: "—",
  in_progress: "In progress",
  passed: "Passed",
};

export default function SessionSheet({
  classId,
  date,
  students,
  skillsByLevel,
  latestAssessments,
}: Props) {
  const router = useRouter();
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggleStudent(studentId: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.replace(`?date=${e.target.value}`);
  }

  function handleAttendance(
    enrollmentId: string,
    studentId: string,
    status: "present" | "absent"
  ) {
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("class_id", classId);
    formData.set("enrollment_id", enrollmentId);
    formData.set("date", date);
    formData.set("status", status);
    startTransition(async () => {
      await sessionMarkAttendance(formData);
    });
  }

  function handleAssess(studentId: string, skillId: string, status: AssessmentStatus) {
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("skill_id", skillId);
    formData.set("class_id", classId);
    formData.set("assessed_on", date);
    formData.set("status", status);
    startTransition(async () => {
      await sessionQuickAssess(formData);
    });
  }

  if (students.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-900">No students enrolled</p>
        <p className="mt-1 text-sm text-slate-500">Enroll students to use the session view.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Date selector */}
      <div className="flex items-center gap-3">
        <label className="label">Session date</label>
        <input
          type="date"
          defaultValue={date}
          onChange={handleDateChange}
          className="input max-w-xs"
        />
      </div>

      {/* Student rows */}
      <div className="mt-4 space-y-3">
        {students.map((s) => {
          const isExpanded = expandedStudents.has(s.studentId);
          const studentSkills = skillsByLevel.find(
            (l) => l.id === s.skatingLevelId
          );

          return (
            <div key={s.studentId} className="card">
              {/* Student header row */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-900">{s.name}</span>
                <div className="flex items-center gap-3">
                  {/* Attendance buttons */}
                  <button
                    disabled={isPending || s.attendanceStatus === "present"}
                    onClick={() => handleAttendance(s.enrollmentId, s.studentId, "present")}
                    className={`btn-sm rounded-md font-medium text-white transition-colors ${
                      s.attendanceStatus === "present"
                        ? "bg-green-600 opacity-100 cursor-default"
                        : "bg-slate-200 text-slate-600 hover:bg-green-600 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    disabled={isPending || s.attendanceStatus === "absent"}
                    onClick={() => handleAttendance(s.enrollmentId, s.studentId, "absent")}
                    className={`btn-sm rounded-md font-medium text-white transition-colors ${
                      s.attendanceStatus === "absent"
                        ? "bg-red-500 opacity-100 cursor-default"
                        : "bg-slate-200 text-slate-600 hover:bg-red-500 hover:text-white disabled:opacity-40"
                    }`}
                  >
                    Absent
                  </button>
                  {/* Skills toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStudent(s.studentId)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {isExpanded ? "Hide skills" : "Skills"}
                  </button>
                </div>
              </div>

              {/* Skills panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3">
                  {!studentSkills ? (
                    <p className="text-xs text-slate-500">No skills defined for this student&apos;s level.</p>
                  ) : (
                    <ul className="space-y-2">
                      {studentSkills.skills.map((skill) => {
                        const key = `${s.studentId}:${skill.id}`;
                        const current: AssessmentStatus = latestAssessments[key] ?? "not_assessed";

                        return (
                          <li key={skill.id} className="flex items-center justify-between gap-4">
                            <span className="text-xs text-slate-700">{skill.name}</span>
                            <div className="flex shrink-0 items-center gap-1">
                              {(["not_assessed", "in_progress", "passed"] as AssessmentStatus[]).map(
                                (s_status) => (
                                  <button
                                    key={s_status}
                                    type="button"
                                    disabled={isPending || current === s_status}
                                    onClick={() => handleAssess(s.studentId, skill.id, s_status)}
                                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:cursor-default ${
                                      current === s_status
                                        ? STATUS_BADGE[s_status] + " opacity-100"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-60"
                                    }`}
                                  >
                                    {STATUS_LABELS[s_status]}
                                  </button>
                                )
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
