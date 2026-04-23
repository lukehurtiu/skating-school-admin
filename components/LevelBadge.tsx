import { getLevelBadgeClass } from "@/lib/utils";

export default function LevelBadge({ levelName }: { levelName: string }) {
  return (
    <span className={getLevelBadgeClass(levelName)}>
      {levelName}
    </span>
  );
}
