"use server";

import { createClient } from "@/lib/supabase/server";
import { chatComplete } from "@/lib/groq";
import { getTodayDateString, getTodayDayName } from "@/lib/utils";

type AskResult = { answer: string } | { error: string };

export async function askAssistant(question: string): Promise<AskResult> {
  const q = (question ?? "").trim();
  if (!q) return { error: "Please enter a question." };
  if (q.length > 500) return { error: "Question is too long (max 500 characters)." };

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Unauthorized" };

  const today = getTodayDateString();
  const todayDay = getTodayDayName();

  const [
    studentsRes,
    classesRes,
    enrollmentsRes,
    attendanceRes,
    studentCount,
    classCount,
    enrollmentCount,
    attendanceCount,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("first_name, last_name, date_of_birth, skating_levels(name)")
      .limit(50),
    supabase
      .from("classes")
      .select(
        "name, day_of_week, start_time, end_time, location, skating_levels(name), profiles:instructor_id(full_name)"
      )
      .limit(50),
    supabase
      .from("enrollments")
      .select("students(first_name, last_name), classes(name, day_of_week)")
      .limit(50),
    supabase
      .from("attendance")
      .select("date, status, students(first_name, last_name), classes(name)")
      .order("date", { ascending: false })
      .limit(50),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase.from("attendance").select("id", { count: "exact", head: true }),
  ]);

  const snapshot = {
    viewer: { full_name: profile.full_name, role: profile.role },
    today: { date: today, day_of_week: todayDay },
    counts: {
      students: studentCount.count ?? 0,
      classes: classCount.count ?? 0,
      enrollments: enrollmentCount.count ?? 0,
      attendance_records: attendanceCount.count ?? 0,
    },
    note: "Each list below is capped at 50 rows; `counts` holds the true totals visible to this viewer.",
    students: studentsRes.data ?? [],
    classes: classesRes.data ?? [],
    enrollments: enrollmentsRes.data ?? [],
    recent_attendance: attendanceRes.data ?? [],
  };

  const systemPrompt = [
    "You are the assistant for an ice skating school admin app.",
    "Answer ONLY using the SCHOOL_DATA JSON block below.",
    "If the answer is not present in SCHOOL_DATA, say you don't have that information.",
    "Do not invent students, classes, instructors, or dates.",
    "Be concise (2-5 sentences). If listing, use short bullets.",
    "",
    "SCHOOL_DATA:",
    "```json",
    JSON.stringify(snapshot, null, 2),
    "```",
  ].join("\n");

  try {
    const answer = await chatComplete([
      { role: "system", content: systemPrompt },
      { role: "user", content: q },
    ]);
    if (!answer) return { error: "No response from the assistant." };
    return { answer };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("GROQ_API_KEY")) {
      return { error: "Assistant is not configured (missing GROQ_API_KEY)." };
    }
    return { error: "Assistant request failed. Please try again." };
  }
}
