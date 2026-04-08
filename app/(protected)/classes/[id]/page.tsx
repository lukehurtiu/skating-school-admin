import { createClient } from "@/lib/supabase/server";
import { SkatingClass, Student } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnrollStudentForm from "./EnrollStudentForm";

type ClassWithInstructor = SkatingClass & {
  profiles: { full_name: string } | null;
};

type EnrollmentWithStudent = {
  id: string;
  student_id: string;
  students: Pick<Student, "first_name" | "last_name" | "level"> | null;
};

function formatDay(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: skatingClass }, { data: profile }, { data: enrollments }, { data: allStudents }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("*, profiles(full_name)")
        .eq("id", params.id)
        .single<ClassWithInstructor>(),
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
      supabase
        .from("enrollments")
        .select("id, student_id, students(first_name, last_name, level)")
        .eq("class_id", params.id)
        .returns<EnrollmentWithStudent[]>(),
      supabase.from("students").select("id, first_name, last_name").returns<Pick<Student, "id" | "first_name" | "last_name">[]>(),
    ]);

  if (!skatingClass) notFound();

  const admin = isAdmin(profile?.role);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (allStudents ?? []).filter((s) => !enrolledIds.has(s.id));

  const fields = [
    { label: "Name", value: skatingClass.name },
    { label: "Day", value: formatDay(skatingClass.day_of_week) },
    {
      label: "Time",
      value: `${formatTime(skatingClass.start_time)} – ${formatTime(skatingClass.end_time)}`,
    },
    { label: "Location", value: skatingClass.location },
    { label: "Level", value: skatingClass.level.charAt(0).toUpperCase() + skatingClass.level.slice(1) },
    { label: "Instructor", value: skatingClass.profiles?.full_name ?? "—" },
  ];

  return (
    <div>
      <Link href="/classes" className="text-sm text-blue-600 hover:underline">
        ← Back to classes
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{skatingClass.name}</h1>
        <Link
          href={`/classes/${params.id}/attendance`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Attendance
        </Link>
      </div>

      <div className="mt-6 max-w-lg rounded-lg border border-gray-200 bg-white">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
          >
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Enrolled Students */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
        </div>

        {!enrollments || enrollments.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No students enrolled yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Level"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {e.students?.first_name} {e.students?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600">
                      {e.students?.level ?? "—"}
                    </td>
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
