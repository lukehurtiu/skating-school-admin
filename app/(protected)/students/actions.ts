"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  const skating_level_id = formData.get("skating_level_id") as string;

  if (!first_name || !last_name || !date_of_birth || !skating_level_id) {
    return { error: "All fields are required" };
  }

  const { data: levelRow } = await supabase
    .from("skating_levels")
    .select("id")
    .eq("id", skating_level_id)
    .single();

  if (!levelRow) return { error: "Invalid level" };

  const dob = new Date(date_of_birth);
  const today = new Date();
  const minDate = new Date("1900-01-01");
  if (isNaN(dob.getTime()) || dob >= today || dob < minDate) {
    return { error: "Invalid date of birth" };
  }

  const { error } = await supabase
    .from("students")
    .insert({ first_name, last_name, date_of_birth, skating_level_id });

  if (error) return { error: "Failed to create student" };

  redirect("/students?success=1");
}

export async function updateStudent(formData: FormData) {
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
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const date_of_birth = formData.get("date_of_birth") as string;
  const skating_level_id = formData.get("skating_level_id") as string;

  if (!student_id || !first_name || !last_name || !date_of_birth || !skating_level_id) {
    return { error: "All fields are required" };
  }

  const { data: levelRow } = await supabase
    .from("skating_levels")
    .select("id")
    .eq("id", skating_level_id)
    .single();

  if (!levelRow) return { error: "Invalid level" };

  const dob = new Date(date_of_birth);
  const today = new Date();
  const minDate = new Date("1900-01-01");
  if (isNaN(dob.getTime()) || dob >= today || dob < minDate) {
    return { error: "Invalid date of birth" };
  }

  const { error } = await supabase
    .from("students")
    .update({ first_name, last_name, date_of_birth, skating_level_id })
    .eq("id", student_id);

  if (error) return { error: "Failed to update student" };

  revalidatePath("/students");
  revalidatePath(`/students/${student_id}/skills`);
  redirect(`/students/${student_id}/skills?success=1`);
}

export async function deleteStudent(formData: FormData) {
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
  if (!student_id) return { error: "Missing student" };

  const { error } = await supabase.from("students").delete().eq("id", student_id);
  if (error) return { error: "Failed to delete student" };

  revalidatePath("/students");
  redirect("/students?success=1");
}

export async function linkStudent(formData: FormData) {
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
  const student_email = (formData.get("student_email") as string)?.trim().toLowerCase();

  if (!student_id || !student_email) return { error: "All fields are required" };

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", student_email)
    .maybeSingle();

  if (!studentProfile) return { error: "No account found with that email" };
  if (studentProfile.role !== "student") return { error: "That account is not a student account" };

  const { error } = await supabase
    .from("student_links")
    .insert({ profile_id: studentProfile.id, student_id });

  if (error?.code === "23505") return { error: "Student is already linked to this profile" };
  if (error) return { error: "Failed to link student account" };

  revalidatePath(`/students/${student_id}/edit`);
}

export async function unlinkStudent(formData: FormData) {
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

  const link_id = formData.get("link_id") as string;
  const student_id = formData.get("student_id") as string;
  if (!link_id) return { error: "Missing link ID" };

  const { error } = await supabase
    .from("student_links")
    .delete()
    .eq("id", link_id);

  if (error) return { error: "Failed to unlink student account" };

  revalidatePath(`/students/${student_id}/edit`);
}
