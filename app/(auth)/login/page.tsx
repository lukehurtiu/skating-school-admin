import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      {/* Brand mark */}
      <div className="flex flex-col items-center">
        <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl shadow-sm">
          <Image
            src="/skating-logo.png"
            alt="Skating School Admin"
            width={72}
            height={72}
            priority
          />
        </div>
        <h1 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">
          Skating School Admin
        </h1>
        <p className="mt-1 text-[13px] text-slate-400">
          Class and roster management for instructors
        </p>
      </div>

      {/* Form */}
      <div className="mt-8 w-full max-w-sm">
        <LoginForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Are you a parent?{" "}
          <Link href="/signup" className="font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Create a parent account
          </Link>
        </p>
      </div>
    </main>
  );
}
