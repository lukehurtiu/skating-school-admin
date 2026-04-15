import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateStudentForm from "./CreateStudentForm";
import { SkatingLevel } from "@/lib/types";

export default async function NewStudentPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/students");

  const { data: levels } = await supabase
    .from("skating_levels")
    .select("*")
    .order("sort_order")
    .returns<SkatingLevel[]>();

  return (
    <div>
      <Link href="/students" className="back-link">← Back to students</Link>
      <h1 className="mt-4 page-title">New Student</h1>
      <p className="page-subtitle">Add a new student to the program.</p>
      <CreateStudentForm levels={levels ?? []} />
    </div>
  );
}
