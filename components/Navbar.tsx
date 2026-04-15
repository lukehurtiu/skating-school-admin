import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(protected)/actions";
import NavLinks from "./NavLinks";

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
        <span className="text-sm font-bold text-slate-900">Skating School</span>
        <NavLinks role={profile?.role ?? "instructor"} />
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{profile.full_name}</span>
              <span className={
                profile.role === "admin" ? "badge-admin" :
                profile.role === "guardian" ? "badge-indigo" :
                "badge-instructor"
              }>
                {profile.role}
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
