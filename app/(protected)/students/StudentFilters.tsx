"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function StudentFilters({
  levels,
  classes,
}: {
  levels: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("success");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Search by name…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        className="input max-w-xs mt-0"
        style={{ marginTop: 0 }}
      />
      <select
        defaultValue={searchParams.get("level") ?? ""}
        onChange={(e) => updateParam("level", e.target.value)}
        className="input w-auto mt-0"
        style={{ marginTop: 0 }}
      >
        <option value="">All levels</option>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("class") ?? ""}
        onChange={(e) => updateParam("class", e.target.value)}
        className="input w-auto mt-0"
        style={{ marginTop: 0 }}
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
