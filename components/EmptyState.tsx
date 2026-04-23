import Link from "next/link";

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <svg
          className="h-6 w-6 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-4">
          <Link href={actionHref} className="btn-primary">
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
