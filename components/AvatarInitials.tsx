const COLORS = [
  "bg-ice-100 text-ice-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function AvatarInitials({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const initials = getInitials(name);
  const colorClass = hashColor(name);
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${sizeClass} ${colorClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
