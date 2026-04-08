"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const student_id = formData.get("student_id") as string;
  const class_id = formData.get("class_id") as string;
  const enrollment_id = formData.get("enrollment_id") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as "present" | "absent";

  if (!student_id || !class_id || !enrollment_id || !date || !status) {
    return { error: "Missing required fields" };
  }

  // Instructors may only mark attendance for their own classes
  const { data: classRow } = await supabase
    .from("classes")
    .select("instructor_id")
    .eq("id", class_id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdminUser = profile?.role === "admin";
  const isOwnClass = classRow?.instructor_id === user.id;

  if (!isAdminUser && !isOwnClass) return { error: "Unauthorized" };

  const { error } = await supabase.from("attendance").upsert(
    { student_id, class_id, enrollment_id, date, status },
    { onConflict: "student_id,class_id,date" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/classes/${class_id}/attendance`);
}
