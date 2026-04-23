"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classes", label: "Classes" },
  { href: "/students", label: "Students" },
  { href: "/skills", label: "Skills" },
];

const instructorLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/classes", label: "Classes" },
  { href: "/students", label: "Students" },
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-progress", label: "My Progress" },
];

function getLinks(role: string) {
  if (role === "admin") return adminLinks;
  if (role === "student") return studentLinks;
  return instructorLinks;
}

export default function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();
  const links = getLinks(role);

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
                ? "text-sm font-semibold text-ice-600"
                : "text-sm text-text-muted hover:text-text-primary"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
