import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateStudentForm from "./CreateStudentForm";

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New Student</h1>
      <CreateStudentForm />
    </div>
  );
}
