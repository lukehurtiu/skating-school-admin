import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTodayDateString } from "@/lib/utils";
import AttendanceSheet from "./AttendanceSheet";

type EnrollmentRow = {
  id: string;
  student_id: string;
  students: { first_name: string; last_name: string } | null;
};

type AttendanceRow = {
  student_id: string;
  status: "present" | "absent";
};

export default async function AttendancePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const today = getTodayDateString();

  const [{ data: skatingClass }, { data: enrollments }, { data: attendanceRecords }] =
    await Promise.all([
      supabase.from("classes").select("id, name").eq("id", params.id).single(),
      supabase
        .from("enrollments")
        .select("id, student_id, students(first_name, last_name)")
        .eq("class_id", params.id)
        .returns<EnrollmentRow[]>(),
      supabase
        .from("attendance")
        .select("student_id, status")
        .eq("class_id", params.id)
        .eq("date", today)
        .returns<AttendanceRow[]>(),
    ]);

  if (!skatingClass) notFound();

  const statusMap = new Map(
    (attendanceRecords ?? []).map((r) => [r.student_id, r.status])
  );

  const students = (enrollments ?? []).map((e) => ({
    enrollmentId: e.id,
    studentId: e.student_id,
    name: e.students ? `${e.students.first_name} ${e.students.last_name}` : "Unknown",
    status: statusMap.get(e.student_id) ?? null,
  }));

  return (
    <div>
      <Link href={`/classes/${params.id}`} className="back-link">
        ← Back to class
      </Link>

      <div className="mt-4">
        <h1 className="page-title">Attendance — {skatingClass.name}</h1>
        <p className="page-subtitle">
          {new Date(today + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <AttendanceSheet classId={params.id} date={today} students={students} />
    </div>
  );
}
