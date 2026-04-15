import { createClient } from "@/lib/supabase/server";
import { SkatingClass, Student, Profile } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnrollStudentForm from "./EnrollStudentForm";
import InstructorManager from "./InstructorManager";
import { unenrollStudent } from "../actions";

type ClassWithJoins = SkatingClass & {
  profiles: { full_name: string } | null;
  skating_levels: { name: string } | null;
};

type EnrollmentWithStudent = {
  id: string;
  student_id: string;
  students: Pick<Student, "first_name" | "last_name"> & {
    skating_levels: { name: string } | null;
  } | null;
};

type ClassInstructorRow = {
  id: string;
  instructor_id: string;
  profiles: { full_name: string } | null;
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function ClassDetailPage({
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
    { data: skatingClass },
    { data: profile },
    { data: enrollments },
    { data: allStudents },
    { data: classInstructors },
    { data: allInstructors },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("*, profiles(full_name), skating_levels(name)")
      .eq("id", params.id)
      .single<ClassWithJoins>(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("enrollments")
      .select("id, student_id, students(first_name, last_name, skating_levels(name))")
      .eq("class_id", params.id)
      .returns<EnrollmentWithStudent[]>(),
    supabase
      .from("students")
      .select("id, first_name, last_name")
      .returns<Pick<Student, "id" | "first_name" | "last_name">[]>(),
    supabase
      .from("class_instructors")
      .select("id, instructor_id, profiles(full_name)")
      .eq("class_id", params.id)
      .returns<ClassInstructorRow[]>(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "instructor")
      .returns<Pick<Profile, "id" | "full_name">[]>(),
  ]);

  if (!skatingClass) notFound();

  const admin = isAdmin(profile?.role);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (allStudents ?? []).filter((s) => !enrolledIds.has(s.id));

  const assignedInstructors = (classInstructors ?? []).map((ci) => ({
    id: ci.id,
    instructor_id: ci.instructor_id,
    full_name: ci.profiles?.full_name ?? "",
  }));

  const assignedIds = new Set([
    skatingClass.instructor_id,
    ...assignedInstructors.map((a) => a.instructor_id),
  ]);
  const availableInstructors = (allInstructors ?? []).filter(
    (i) => !assignedIds.has(i.id)
  );

  const allAssignedNames = [
    skatingClass.profiles?.full_name,
    ...assignedInstructors.map((a) => a.full_name),
  ]
    .filter(Boolean)
    .join(", ");

  const details = [
    { label: "Day", value: skatingClass.day_of_week.charAt(0).toUpperCase() + skatingClass.day_of_week.slice(1) },
    { label: "Time", value: `${formatTime(skatingClass.start_time)} – ${formatTime(skatingClass.end_time)}` },
    { label: "Location", value: skatingClass.location },
    { label: "Level", value: skatingClass.skating_levels?.name ?? "—" },
  ];

  return (
    <div>
      <Link href="/classes" className="back-link">← Back to classes</Link>

      {searchParams.success && (
        <p className="form-success mt-3">Changes saved successfully.</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <h1 className="page-title">{skatingClass.name}</h1>
        <div className="flex gap-2">
          <Link href={`/classes/${params.id}/session`} className="btn-primary">
            Start Session
          </Link>
          <Link href={`/classes/${params.id}/assessments`} className="btn-secondary">
            Assessments
          </Link>
          <Link href={`/classes/${params.id}/attendance`} className="btn-secondary">
            Attendance
          </Link>
          {admin && (
            <Link href={`/classes/${params.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 max-w-lg card">
        {details.map(({ label, value }) => (
          <div key={label} className="card-row">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="text-sm text-slate-900">{value}</span>
          </div>
        ))}

        {/* Instructors row */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Instructors</span>
            {!admin && (
              <span className="text-sm text-slate-900">{allAssignedNames || "—"}</span>
            )}
          </div>
          {admin && (
            <div className="mt-3">
              <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-900">{skatingClass.profiles?.full_name ?? "—"}</span>
                <span className="badge-gray">Primary</span>
              </div>
              <InstructorManager
                classId={params.id}
                assigned={assignedInstructors}
                available={availableInstructors}
              />
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Enrolled Students</h2>

        {!enrollments || enrollments.length === 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-6 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">No students enrolled yet</p>
            <p className="mt-1 text-sm text-slate-500">Add a student below to track attendance and skills.</p>
          </div>
        ) : (
          <div className="mt-4 table-container">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Name", "Level", admin ? "Actions" : ""].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="td-primary">
                      {e.students?.first_name} {e.students?.last_name}
                    </td>
                    <td className="td">
                      {e.students?.skating_levels?.name ?? "—"}
                    </td>
                    {admin && (
                      <td className="td text-right">
                        <UnenrollButton enrollmentId={e.id} classId={params.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {admin && (
          <div className="mt-4">
            <EnrollStudentForm classId={params.id} availableStudents={availableStudents} />
          </div>
        )}
      </div>
    </div>
  );
}

function UnenrollButton({ enrollmentId, classId }: { enrollmentId: string; classId: string }) {
  return (
    <form action={unenrollStudent}>
      <input type="hidden" name="enrollment_id" value={enrollmentId} />
      <input type="hidden" name="class_id" value={classId} />
      <button type="submit" className="text-xs text-red-600 hover:underline">
        Unenroll
      </button>
    </form>
  );
}
