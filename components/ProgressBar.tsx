export default function ProgressBar({
  current,
  total,
  size = "md",
}: {
  current: number;
  total: number;
  size?: "sm" | "md";
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));
  const height = size === "sm" ? "h-1" : "h-2";

  return (
    <div className={`w-full rounded-pill bg-slate-200 overflow-hidden ${height}`}>
      <div
        className="h-full rounded-pill bg-ice-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
