import SkeletonLoader from "@/components/SkeletonLoader";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-2 skeleton h-7 w-40" />
      <div className="skeleton h-4 w-56 mb-8" />

      <div className="skeleton h-5 w-36 mb-4" />
      <SkeletonLoader variant="card" rows={3} />

      <div className="skeleton h-5 w-28 mt-10 mb-4" />
      <SkeletonLoader variant="stat" />
    </div>
  );
}
