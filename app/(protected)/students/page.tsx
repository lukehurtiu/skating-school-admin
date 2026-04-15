import { createClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import Link from "next/link";

type StudentRow = Student & {
  skating_levels: { name: string } | null;
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: students }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("students")
      .select("*, skating_levels(name)")
      .order("last_name")
      .order("first_name")
      .returns<StudentRow[]>(),
  ]);

  const admin = isAdmin(profile?.role);

  return (
    <div>
      {searchParams.success && (
        <p className="form-success mb-4">Changes saved successfully.</p>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">All enrolled students.</p>
        </div>
        {admin && (
          <Link href="/students/new" className="btn-primary">New student</Link>
        )}
      </div>

      {!students || students.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-900">No students yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first student to get started.</p>
          {admin && (
            <Link href="/students/new" className="btn-primary mt-4 inline-block">
              Add first student
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 table-container">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Date of Birth", "Level", ""].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="td-primary">{s.first_name} {s.last_name}</td>
                  <td className="td">{s.date_of_birth}</td>
                  <td className="td">{s.skating_levels?.name ?? "—"}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/students/${s.id}/skills`} className="text-indigo-600 hover:underline">
                        Skills
                      </Link>
                      {admin && (
                        <Link href={`/students/${s.id}/edit`} className="text-slate-500 hover:underline">
                          Edit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
