import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Student, SkatingLevel, GuardianStudent, Profile } from "@/lib/types";
import EditStudentForm from "./EditStudentForm";
import DeleteStudentButton from "../DeleteStudentButton";
import GuardianManager from "./GuardianManager";

type GuardianRow = GuardianStudent & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect(`/students/${params.id}/skills`);

  const [{ data: student }, { data: levels }, { data: guardians }] = await Promise.all([
    supabase.from("students").select("*").eq("id", params.id).single<Student>(),
    supabase
      .from("skating_levels")
      .select("*")
      .order("sort_order")
      .returns<SkatingLevel[]>(),
    supabase
      .from("guardian_students")
      .select("id, guardian_id, student_id, profiles(full_name, email)")
      .eq("student_id", params.id)
      .returns<GuardianRow[]>(),
  ]);

  if (!student) notFound();

  return (
    <div>
      <Link href={`/students/${params.id}/skills`} className="back-link">← Back to student</Link>
      <h1 className="mt-4 page-title">Edit Student</h1>
      <p className="page-subtitle">Update details for {student.first_name} {student.last_name}.</p>
      <EditStudentForm student={student} levels={levels ?? []} />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">Linked guardians</h2>
        <p className="mt-1 text-sm text-slate-500">
          Guardians can view this student&apos;s attendance and skill progress.
        </p>
        <GuardianManager studentId={params.id} guardians={guardians ?? []} />
      </div>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">Danger zone</h2>
        <p className="mt-1 text-sm text-slate-500">Deleting a student cannot be undone.</p>
        <div className="mt-3">
          <DeleteStudentButton studentId={params.id} />
        </div>
      </div>
    </div>
  );
}
