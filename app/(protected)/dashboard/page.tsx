import { signOut } from "../actions";

export default function DashboardPage() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-red-600 underline hover:text-red-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
