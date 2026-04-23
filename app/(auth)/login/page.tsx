import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Brand panel — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-ice-800 to-ice-500 px-12 text-white">
        {/* Ice rink decorative element */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <svg
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728.707.707M3 12H2m20 0h-1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Skating School</h1>
        <p className="mt-3 text-center text-base text-ice-100 leading-relaxed max-w-xs">
          Manage classes, track student progress, and run your rink — all in one place.
        </p>

        {/* Decorative rings */}
        <div className="mt-12 flex gap-3 opacity-30">
          <div className="h-2 w-2 rounded-full bg-white" />
          <div className="h-2 w-8 rounded-full bg-white" />
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center bg-surface px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 text-center md:hidden">
            <h1 className="text-xl font-semibold text-text-primary">Skating School</h1>
            <p className="mt-1 text-sm text-text-muted">Admin panel</p>
          </div>

          <LoginForm />

          <p className="mt-4 text-center text-xs text-text-muted">
            Are you a student?{" "}
            <Link
              href="/signup"
              className="font-medium text-ice-600 hover:underline transition-colors"
            >
              Create a student account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
