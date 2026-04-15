import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Student, SkatingLevel, Skill, SkillAssessment, AssessmentStatus, AttendanceRecord } from "@/lib/types";

type StudentWithLevel = Student & { skating_levels: { name: string } | null };
type LevelWithSkills = SkatingLevel & { skills: Skill[] };

export default async function GuardianStudentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "guardian" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Guardians can only view their linked students
  if (profile?.role === "guardian") {
    const { data: link } = await supabase
      .from("guardian_students")
      .select("id")
      .eq("guardian_id", user!.id)
      .eq("student_id", params.id)
      .maybeSingle();
    if (!link) redirect("/my-students");
  }

  const [{ data: student }, { data: levels }, { data: assessments }, { data: attendance }] =
    await Promise.all([
      supabase
        .from("students")
        .select("*, skating_levels(name)")
        .eq("id", params.id)
        .single<StudentWithLevel>(),
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
        .from("attendance")
        .select("date, status")
        .eq("student_id", params.id)
        .order("date", { ascending: false })
        .limit(20)
        .returns<Pick<AttendanceRecord, "date" | "status">[]>(),
    ]);

  if (!student) notFound();

  const latestBySkill = new Map<string, SkillAssessment>();
  for (const a of assessments ?? []) {
    if (!latestBySkill.has(a.skill_id)) latestBySkill.set(a.skill_id, a);
  }

  const levelsWithSortedSkills = (levels ?? []).map((level) => ({
    ...level,
    skills: [...(level.skills ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const totalSkills = levelsWithSortedSkills.reduce((sum, l) => sum + l.skills.length, 0);
  let passedCount = 0;
  latestBySkill.forEach((a) => { if (a.status === "passed") passedCount++; });

  return (
    <div>
      <Link href="/my-students" className="back-link">← Back to my students</Link>

      <div className="mt-4">
        <h1 className="page-title">{student.first_name} {student.last_name}</h1>
        <p className="page-subtitle">
          {student.skating_levels?.name ?? "No level set"} · {passedCount} / {totalSkills} skills passed
        </p>
      </div>

      {/* Recent attendance */}
      {(attendance ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Recent Attendance</h2>
          <div className="mt-2 table-container">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(attendance ?? []).map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="td td-primary">{a.date}</td>
                    <td className="td">
                      <span className={a.status === "present" ? "badge-green" : "badge-red"}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skill progress */}
      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Skill Progress</h2>
        {levelsWithSortedSkills.map((level) => {
          const levelPassed = level.skills.filter(
            (s) => latestBySkill.get(s.id)?.status === "passed"
          ).length;

          return (
            <div key={level.id} className="card">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="font-semibold text-slate-900">{level.name}</h3>
                <span className="text-xs text-slate-500">
                  {levelPassed} / {level.skills.length} passed
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {level.skills.map((skill, idx) => {
                  const latest = latestBySkill.get(skill.id);
                  const status: AssessmentStatus = latest?.status ?? "not_assessed";
                  const badgeCls: Record<AssessmentStatus, string> = {
                    not_assessed: "badge-gray",
                    in_progress: "badge-yellow",
                    passed: "badge-green",
                  };
                  const labels: Record<AssessmentStatus, string> = {
                    not_assessed: "Not assessed",
                    in_progress: "In progress",
                    passed: "Passed",
                  };
                  return (
                    <li key={skill.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <p className="text-sm text-slate-900">
                        <span className="mr-2 text-slate-400">{idx + 1}.</span>
                        {skill.name}
                      </p>
                      <span className={`shrink-0 ${badgeCls[status]}`}>{labels[status]}</span>
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
