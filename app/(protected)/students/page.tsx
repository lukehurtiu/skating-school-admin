import { createClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";
import { isAdmin, getAge } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import EmptyState from "@/components/EmptyState";
import StudentFilters from "./StudentFilters";
import StudentList from "./StudentList";

type StudentRow = Student & {
  skating_levels: { id: string; name: string } | null;
};

type EnrollmentRow = {
  student_id: string;
  classes: { id: string; name: string } | null;
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { success?: string; q?: string; level?: string; class?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: students },
    { data: enrollments },
    { data: levels },
    { data: classes },
    { data: skillCounts },
    { data: assessments },
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("students")
      .select("*, skating_levels(id, name)")
      .order("last_name")
      .order("first_name")
      .returns<StudentRow[]>(),
    supabase
      .from("enrollments")
      .select("student_id, classes(id, name)")
      .returns<EnrollmentRow[]>(),
    supabase
      .from("skating_levels")
      .select("id, name")
      .order("sort_order"),
    supabase
      .from("classes")
      .select("id, name")
      .order("name"),
    supabase
      .from("skills")
      .select("level_id"),
    supabase
      .from("skill_assessments")
      .select("student_id, skill_id, status, assessed_at")
      .order("assessed_at", { ascending: false }),
  ]);

  const admin = isAdmin(profile?.role);

  // Build enrollment map: student_id -> first class name
  const enrollmentMap = new Map<string, string>();
  for (const e of enrollments ?? []) {
    if (e.classes && !enrollmentMap.has(e.student_id)) {
      enrollmentMap.set(e.student_id, e.classes.name);
    }
  }

  // Build skill count per level
  const skillCountPerLevel = new Map<string, number>();
  for (const s of skillCounts ?? []) {
    skillCountPerLevel.set(s.level_id, (skillCountPerLevel.get(s.level_id) ?? 0) + 1);
  }

  // Build latest assessment per student+skill, then count passed
  const latestAssessments = new Map<string, string>(); // "studentId:skillId" -> status
  for (const a of assessments ?? []) {
    const key = `${a.student_id}:${a.skill_id}`;
    if (!latestAssessments.has(key)) {
      latestAssessments.set(key, a.status);
    }
  }
  const passedCountPerStudent = new Map<string, number>();
  latestAssessments.forEach((status, key) => {
    if (status === "passed") {
      const studentId = key.split(":")[0];
      passedCountPerStudent.set(studentId, (passedCountPerStudent.get(studentId) ?? 0) + 1);
    }
  });

  // Apply filters
  let filtered = students ?? [];
  const q = searchParams.q?.toLowerCase().trim();
  if (q) {
    filtered = filtered.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q)
    );
  }
  if (searchParams.level) {
    filtered = filtered.filter((s) => s.skating_level_id === searchParams.level);
  }
  if (searchParams.class) {
    const classId = searchParams.class;
    const studentsInClass = new Set(
      (enrollments ?? [])
        .filter((e) => e.classes?.id === classId)
        .map((e) => e.student_id)
    );
    filtered = filtered.filter((s) => studentsInClass.has(s.id));
  }

  return (
    <div>
      {searchParams.success && (
        <p className="form-success mb-4">Changes saved successfully.</p>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{(students ?? []).length} students enrolled</p>
        </div>
        {admin && (
          <Link href="/students/new" className="btn-primary">New student</Link>
        )}
      </div>

      <div className="mt-6">
        <Suspense fallback={<div className="skeleton h-10 w-full max-w-xl" />}>
          <StudentFilters
            levels={(levels ?? []).map((l) => ({ id: l.id, name: l.name }))}
            classes={(classes ?? []).map((c) => ({ id: c.id, name: c.name }))}
          />
        </Suspense>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="No students found"
            description={
              q || searchParams.level || searchParams.class
                ? "Try adjusting your filters."
                : "Add your first student to get started."
            }
            actionLabel={admin && !q && !searchParams.level && !searchParams.class ? "Add first student" : undefined}
            actionHref={admin ? "/students/new" : undefined}
          />
        ) : (
          <StudentList
            students={filtered.map((s) => ({
              id: s.id,
              first_name: s.first_name,
              last_name: s.last_name,
              age: s.date_of_birth ? getAge(s.date_of_birth) : null,
              levelName: s.skating_levels?.name ?? null,
              enrolledClass: enrollmentMap.get(s.id) ?? null,
              passedSkills: passedCountPerStudent.get(s.id) ?? 0,
              totalSkills: s.skating_level_id ? (skillCountPerLevel.get(s.skating_level_id) ?? 0) : 0,
            }))}
            isAdmin={admin}
          />
        )}
      </div>
    </div>
  );
}
