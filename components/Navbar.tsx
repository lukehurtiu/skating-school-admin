import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(protected)/actions";
import NavLinks from "./NavLinks";
import AvatarInitials from "./AvatarInitials";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "badge-admin",
  instructor: "badge-instructor",
  student: "badge-student",
};

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <span className="text-sm font-bold text-text-primary">Skating School</span>
        <NavLinks role={profile?.role ?? "instructor"} />
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2">
              <AvatarInitials name={profile.full_name ?? "User"} size="sm" />
              <span className="text-sm text-text-primary">{profile.full_name}</span>
              <span className={ROLE_BADGE_CLASSES[profile.role] ?? "badge-instructor"}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
          )}
          <form action={signOut}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
