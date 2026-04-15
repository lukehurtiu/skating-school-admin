"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const staffLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classes", label: "Classes" },
  { href: "/students", label: "Students" },
  { href: "/skills", label: "Skills" },
];

const guardianLinks = [
  { href: "/my-students", label: "My Students" },
];

export default function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();
  const links = role === "guardian" ? guardianLinks : staffLinks;

  return (
    <nav className="flex items-center gap-6">
      {links.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={
              isActive
                ? "text-sm font-semibold text-indigo-600"
                : "text-sm text-slate-600 hover:text-slate-900"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
