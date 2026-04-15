import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Skill, SkatingLevel, SkillAssessment, AssessmentStatus } from "@/lib/types";
import SessionSheet from "./SessionSheet";

type EnrollmentRow = {
  id: string;
  student_id: string;
  students: {
    first_name: string;
    last_name: string;
    skating_level_id: string;
  } | null;
};

type AttendanceRow = {
  student_id: string;
  status: "present" | "absent";
};

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];
  const sessionDate = searchParams.date ?? today;

  const [
    { data: skatingClass },
    { data: profile },
    { data: classInstructorRow },
  ] = await Promise.all([
    supabase.from("classes").select("id, name, instructor_id").eq("id", params.id).single(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("class_instructors")
      .select("id")
      .eq("class_id", params.id)
      .eq("instructor_id", user!.id)
      .maybeSingle(),
  ]);

  if (!skatingClass) notFound();

  const isAdmin = profile?.role === "admin";
  const isOwnClass = skatingClass.instructor_id === user!.id || !!classInstructorRow;
  if (!isAdmin && !isOwnClass) redirect(`/classes/${params.id}`);

  const [{ data: enrollments }, { data: attendance }, { data: levels }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("id, student_id, students(first_name, last_name, skating_level_id)")
        .eq("class_id", params.id)
        .returns<EnrollmentRow[]>(),
      supabase
        .from("attendance")
        .select("student_id, status")
        .eq("class_id", params.id)
        .eq("date", sessionDate)
        .returns<AttendanceRow[]>(),
      supabase
        .from("skating_levels")
        .select("*, skills(id, name, description, level_id, sort_order, created_at)")
        .order("sort_order")
        .returns<LevelWithSkills[]>(),
    ]);

  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  const { data: allAssessments } = studentIds.length
    ? await supabase
        .from("skill_assessments")
        .select("student_id, skill_id, status, assessed_at")
        .in("student_id", studentIds)
        .order("assessed_at", { ascending: false })
        .returns<Pick<SkillAssessment, "student_id" | "skill_id" | "status" | "assessed_at">[]>()
    : { data: [] as Pick<SkillAssessment, "student_id" | "skill_id" | "status" | "assessed_at">[] };

  const attendanceMap = new Map(
    (attendance ?? []).map((a) => [a.student_id, a.status])
  );

  // Most recent assessment per student:skill
  const latestAssessments: Record<string, AssessmentStatus> = {};
  for (const a of allAssessments ?? []) {
    const key = `${a.student_id}:${a.skill_id}`;
    if (!latestAssessments[key]) latestAssessments[key] = a.status;
  }

  const levelsWithSortedSkills = (levels ?? []).map((level) => ({
    ...level,
    skills: [...(level.skills ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const students = (enrollments ?? []).map((e) => ({
    enrollmentId: e.id,
    studentId: e.student_id,
    name: e.students ? `${e.students.first_name} ${e.students.last_name}` : "Unknown",
    skatingLevelId: e.students?.skating_level_id ?? null,
    attendanceStatus: attendanceMap.get(e.student_id) ?? null,
  }));

  const displayDate = new Date(sessionDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <Link href={`/classes/${params.id}`} className="back-link">← Back to class</Link>

      <div className="mt-4">
        <h1 className="page-title">Session — {skatingClass.name}</h1>
        <p className="page-subtitle">{displayDate}</p>
      </div>

      <SessionSheet
        classId={params.id}
        date={sessionDate}
        students={students}
        skillsByLevel={levelsWithSortedSkills}
        latestAssessments={latestAssessments}
      />
    </div>
  );
}
