import { createClient } from "@/lib/supabase/server";
import { Student, SkatingLevel, Skill, SkillAssessment, SkatingClass, AssessmentStatus } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import AssessmentForm from "./AssessmentForm";

type StudentWithLevel = Student & {
  skating_levels: { name: string } | null;
};

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

export default async function StudentSkillsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: student },
    { data: profile },
    { data: levels },
    { data: assessments },
    { data: primaryClasses },
    { data: secondaryRows },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*, skating_levels(name)")
      .eq("id", params.id)
      .single<StudentWithLevel>(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("skating_levels")
      .select("*, skills(id, name, description, level_id, sort_order, created_at)")
      .order("sort_order")
      .returns<LevelWithSkills[]>(),
    supabase
      .from("skill_assessments")
      .select("*")
      .eq("student_id", params.id)
      .order("assessed_at", { ascending: false })
      .returns<SkillAssessment[]>(),
    supabase
      .from("classes")
      .select("id, name")
      .eq("instructor_id", user!.id)
      .returns<Pick<SkatingClass, "id" | "name">[]>(),
    supabase
      .from("class_instructors")
      .select("classes(id, name)")
      .eq("instructor_id", user!.id)
      .returns<{ classes: Pick<SkatingClass, "id" | "name"> }[]>(),
  ]);

  if (!student) notFound();

  const latestBySkill = new Map<string, SkillAssessment>();
  for (const a of assessments ?? []) {
    if (!latestBySkill.has(a.skill_id)) latestBySkill.set(a.skill_id, a);
  }

  const seen = new Set<string>();
  const instructorClasses: Pick<SkatingClass, "id" | "name">[] = [];
  for (const c of [
    ...(primaryClasses ?? []),
    ...(secondaryRows ?? []).map((r) => r.classes).filter(Boolean),
  ] as Pick<SkatingClass, "id" | "name">[]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      instructorClasses.push(c);
    }
  }

  const canAssess = profile?.role === "admin" || profile?.role === "instructor";

  const levelsWithSortedSkills = (levels ?? []).map((level) => ({
    ...level,
    skills: [...(level.skills ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const totalSkills = levelsWithSortedSkills.reduce((sum, l) => sum + l.skills.length, 0);
  let passedCount = 0;
  latestBySkill.forEach((a) => { if (a.status === "passed") passedCount++; });

  return (
    <div>
      <Link href="/students" className="back-link">← Back to students</Link>

      {searchParams.success && (
        <p className="form-success mt-3">Changes saved successfully.</p>
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="page-title">{student.first_name} {student.last_name}</h1>
          <p className="page-subtitle">
            {student.skating_levels?.name ?? "No level set"} · {passedCount} / {totalSkills} skills passed
          </p>
        </div>
        {profile?.role === "admin" && (
          <div className="flex gap-2">
            <Link href={`/students/${params.id}/edit`} className="btn-secondary">Edit</Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {levelsWithSortedSkills.map((level) => {
          const levelPassed = level.skills.filter(
            (s) => latestBySkill.get(s.id)?.status === "passed"
          ).length;

          return (
            <div key={level.id} className="card">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="font-semibold text-slate-900">{level.name}</h2>
                <span className="text-xs text-slate-500">
                  {levelPassed} / {level.skills.length} passed
                </span>
              </div>

              <ul className="divide-y divide-slate-100">
                {level.skills.map((skill, idx) => {
                  const latest = latestBySkill.get(skill.id);
                  const currentStatus: AssessmentStatus = latest?.status ?? "not_assessed";

                  return (
                    <li key={skill.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">
                            <span className="mr-2 text-slate-400">{idx + 1}.</span>
                            {skill.name}
                          </p>
                          {skill.description && (
                            <p className="mt-0.5 text-xs text-slate-400">{skill.description}</p>
                          )}
                          {latest?.comment && (
                            <p className="mt-1 text-xs italic text-slate-500">&ldquo;{latest.comment}&rdquo;</p>
                          )}
                          {latest && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              Last assessed {latest.assessed_on}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {canAssess ? (
                            <AssessmentForm
                              studentId={params.id}
                              skillId={skill.id}
                              currentStatus={currentStatus}
                              instructorClasses={instructorClasses}
                            />
                          ) : (
                            <StatusBadge status={currentStatus} />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const cls: Record<AssessmentStatus, string> = {
    not_assessed: "badge-gray",
    in_progress: "badge-yellow",
    passed: "badge-green",
  };
  const labels: Record<AssessmentStatus, string> = {
    not_assessed: "Not assessed",
    in_progress: "In progress",
    passed: "Passed",
  };
  return <span className={cls[status]}>{labels[status]}</span>;
}
