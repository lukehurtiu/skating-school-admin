import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Student, SkatingLevel } from "@/lib/types";

type LinkedStudent = {
  id: string;
  student_id: string;
  students: (Pick<Student, "id" | "first_name" | "last_name"> & {
    skating_levels: Pick<SkatingLevel, "name"> | null;
  }) | null;
};

export default async function MyStudentsPage() {
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

  const { data: links } = await supabase
    .from("guardian_students")
    .select("id, student_id, students(id, first_name, last_name, skating_levels(name))")
    .eq("guardian_id", user!.id)
    .returns<LinkedStudent[]>();

  const students = (links ?? []).filter((l) => l.students !== null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">View your child&apos;s attendance and skill progress.</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-900">No students linked yet</p>
          <p className="mt-1 text-sm text-slate-500">
            An admin will link your account to your child&apos;s profile.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {students.map((l) => (
            <Link
              key={l.id}
              href={`/my-students/${l.student_id}`}
              className="card card-row flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {l.students!.first_name} {l.students!.last_name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {l.students!.skating_levels?.name ?? "No level set"}
                </p>
              </div>
              <span className="text-xs text-indigo-600">View progress →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
