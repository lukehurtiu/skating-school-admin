import { createClient } from "@/lib/supabase/server";
import { Student, SkillAssessment } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type EnrollmentWithStudent = {
  id: string;
  student_id: string;
  students: Pick<Student, "id" | "first_name" | "last_name"> | null;
};

export default async function ClassAssessmentsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: skatingClass },
    { data: profile },
    { data: enrollments },
    { data: classInstructorRow },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, instructor_id")
      .eq("id", params.id)
      .single(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("enrollments")
      .select("id, student_id, students(id, first_name, last_name)")
      .eq("class_id", params.id)
      .returns<EnrollmentWithStudent[]>(),
    supabase
      .from("class_instructors")
      .select("id")
      .eq("class_id", params.id)
      .eq("instructor_id", user!.id)
      .maybeSingle(),
  ]);

  if (!skatingClass) notFound();

  const isAdmin = profile?.role === "admin";
  const isOwnClass =
    skatingClass.instructor_id === user!.id || !!classInstructorRow;

  if (!isAdmin && !isOwnClass) redirect("/dashboard");

  const studentIds = (enrollments ?? [])
    .map((e) => e.student_id)
    .filter(Boolean);

  // Fetch all assessments for these students (latest per skill per student)
  const { data: allAssessments } = studentIds.length
    ? await supabase
        .from("skill_assessments")
        .select("student_id, skill_id, status")
        .in("student_id", studentIds)
        .returns<Pick<SkillAssessment, "student_id" | "skill_id" | "status">[]>()
    : { data: [] };

  // Build per-student stats using most recent assessment per skill
  const latestByStudentSkill = new Map<string, string>();
  for (const a of allAssessments ?? []) {
    const key = `${a.student_id}:${a.skill_id}`;
    if (!latestByStudentSkill.has(key)) {
      latestByStudentSkill.set(key, a.status);
    }
  }

  function getStats(studentId: string) {
    let passed = 0;
    let inProgress = 0;
    latestByStudentSkill.forEach((status, key) => {
      if (!key.startsWith(`${studentId}:`)) return;
      if (status === "passed") passed++;
      else if (status === "in_progress") inProgress++;
    });
    return { passed, inProgress };
  }

  return (
    <div>
      <Link href={`/classes/${params.id}`} className="back-link">← Back to class</Link>

      <div className="mt-4 page-header">
        <div>
          <h1 className="page-title">{skatingClass.name} — Assessments</h1>
          <p className="page-subtitle">Skill progress for enrolled students.</p>
        </div>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-900">No students enrolled yet</p>
          <p className="mt-1 text-sm text-slate-500">Enroll students to track skill assessments.</p>
        </div>
      ) : (
        <div className="table-container mt-6">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Student", "Passed", "In Progress", ""].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {enrollments.map((e) => {
                if (!e.students) return null;
                const { passed, inProgress } = getStats(e.student_id);
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="td td-primary">
                      {e.students.first_name} {e.students.last_name}
                    </td>
                    <td className="td text-green-700">{passed}</td>
                    <td className="td text-yellow-700">{inProgress}</td>
                    <td className="td text-right">
                      <Link
                        href={`/students/${e.student_id}/skills`}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        View skills →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
