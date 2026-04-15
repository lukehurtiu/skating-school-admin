import Image from "next/image";
import Link from "next/link";
import StudentSignUpForm from "./StudentSignUpForm";

export default function StudentSignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="flex flex-col items-center">
        <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl shadow-sm">
          <Image
            src="/skating-logo.png"
            alt="Skating School"
            width={72}
            height={72}
            priority
          />
        </div>
        <h1 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">
          Skating School
        </h1>
        <p className="mt-1 text-[13px] text-slate-400">
          Student portal
        </p>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <StudentSignUpForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
