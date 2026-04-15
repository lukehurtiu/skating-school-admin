"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function studentSignUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { error: "All fields are required." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "student" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/my-students");
  }

  return { needsConfirmation: true };
}
