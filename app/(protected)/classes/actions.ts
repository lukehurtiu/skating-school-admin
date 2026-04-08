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

export async function enrollStudent(formData: FormData) {
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

  const student_id = formData.get("student_id") as string;
  const class_id = formData.get("class_id") as string;

  if (!student_id || !class_id) return { error: "Missing student or class" };

  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id, class_id });

  if (error) {
    if (error.code === "23505") return { error: "Student already enrolled" };
    return { error: error.message };
  }

  redirect(`/classes/${class_id}`);
}
