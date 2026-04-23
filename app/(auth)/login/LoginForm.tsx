"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "./actions";

type Mode = "signin" | "signup";

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
      <div className="card p-8">
        <h2 className="text-base font-semibold text-text-primary">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          We sent a confirmation link to your address. Click it to activate your account, then sign in.
        </p>
        <button
          onClick={() => switchMode("signin")}
          className="mt-6 back-link"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="text-lg font-semibold text-text-primary">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        {mode === "signin"
          ? "Enter your credentials to continue."
          : "New instructors start here."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="full_name" className="label">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="input"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 6 : undefined}
            className="input"
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-text-muted">Minimum 6 characters.</p>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full justify-center py-2.5 mt-2"
        >
          {isPending
            ? mode === "signin" ? "Signing in…" : "Creating account…"
            : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-text-muted">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-medium text-ice-600 hover:underline transition-colors"
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
              className="font-medium text-ice-600 hover:underline transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
