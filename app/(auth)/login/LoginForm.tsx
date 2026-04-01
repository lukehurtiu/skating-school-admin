"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "./actions";

type Mode = "signin" | "signup";

const inputClass =
  "mt-1 block w-full rounded border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 transition-colors focus:border-slate-400 focus:outline-none";

const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmed(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (mode === "signin") {
        const result = await signIn(formData);
        if (result?.error) setError(result.error);
      } else {
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.needsConfirmation) {
          setConfirmed(true);
        } else {
          router.push("/dashboard");
        }
      }
    });
  }

  if (confirmed) {
    return (
      <div className="w-full rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Account created
        </p>
        <h2 className="mt-2 text-base font-semibold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          We sent a confirmation link to your address. Click it to activate your account, then sign in.
        </p>
        <button
          onClick={() => switchMode("signin")}
          className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-8">
      {/* Header */}
      <h1 className="text-[15px] font-semibold text-slate-900">
        {mode === "signin" ? "Sign in to your account" : "Create your account"}
      </h1>
      <p className="mt-1 text-[13px] text-slate-400">
        {mode === "signin"
          ? "Enter your credentials to continue."
          : "New instructors start here."}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 6 : undefined}
            className={inputClass}
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-slate-400">Minimum 6 characters.</p>
          )}
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
        >
          {isPending
            ? mode === "signin" ? "Signing in…" : "Creating account…"
            : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {/* Mode toggle */}
      <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-400">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
