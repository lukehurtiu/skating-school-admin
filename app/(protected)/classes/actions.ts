"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createClass(formData: FormData) {
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

  const name = formData.get("name") as string;
  const day_of_week = formData.get("day_of_week") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const location = formData.get("location") as string;
  const level = formData.get("level") as string;
  const instructor_id = formData.get("instructor_id") as string;

  if (!name || !day_of_week || !start_time || !end_time || !location || !level || !instructor_id) {
    return { error: "All fields are required" };
  }

  const { error } = await supabase
    .from("classes")
    .insert({ name, day_of_week, start_time, end_time, location, level, instructor_id });

  if (error) return { error: error.message };

  redirect("/classes");
}
