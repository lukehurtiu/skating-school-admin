import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

type ClassWithInstructor = SkatingClass & {
  profiles: { full_name: string } | null;
};

function formatDay(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: skatingClass } = await supabase
    .from("classes")
    .select("*, profiles(full_name)")
    .eq("id", params.id)
    .single<ClassWithInstructor>();

  if (!skatingClass) notFound();

  const fields = [
    { label: "Name", value: skatingClass.name },
    { label: "Day", value: formatDay(skatingClass.day_of_week) },
    {
      label: "Time",
      value: `${formatTime(skatingClass.start_time)} – ${formatTime(skatingClass.end_time)}`,
    },
    { label: "Location", value: skatingClass.location },
    { label: "Level", value: skatingClass.level.charAt(0).toUpperCase() + skatingClass.level.slice(1) },
    { label: "Instructor", value: skatingClass.profiles?.full_name ?? "—" },
  ];

  return (
    <div>
      <Link href="/classes" className="text-sm text-blue-600 hover:underline">
        ← Back to classes
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">{skatingClass.name}</h1>

      <div className="mt-6 max-w-lg rounded-lg border border-gray-200 bg-white">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
          >
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
