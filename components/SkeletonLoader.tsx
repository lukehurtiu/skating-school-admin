export default function SkeletonLoader({
  rows = 4,
  variant = "table",
}: {
  rows?: number;
  variant?: "table" | "card" | "stat";
}) {
  if (variant === "stat") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card px-6 py-5">
            <div className="skeleton h-3 w-24 mb-3" />
            <div className="skeleton h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-4 w-3/4 mb-3" />
            <div className="skeleton h-3 w-1/2 mb-2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="skeleton h-3 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
