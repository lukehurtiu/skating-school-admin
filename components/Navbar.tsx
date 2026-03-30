import { signOut } from "@/app/(protected)/actions";
import NavLinks from "./NavLinks";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Skating School Admin</span>
        <NavLinks />
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
