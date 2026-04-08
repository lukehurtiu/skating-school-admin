"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createStudent(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const date_of_birth = formData.get("date_of_birth") as string;
  const level = formData.get("level") as string;

  if (!first_name || !last_name || !date_of_birth || !level) {
    return { error: "All fields are required" };
  }

  const { error } = await supabase
    .from("students")
    .insert({ first_name, last_name, date_of_birth, level });

  if (error) return { error: error.message };

  redirect("/students");
}
