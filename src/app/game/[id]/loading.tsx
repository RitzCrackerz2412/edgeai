import { ChartSkeleton, TableSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero skeleton */}
      <div className="skeleton h-36 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="skeleton h-48 w-full rounded-2xl" />
          <StatCardSkeleton />
        </div>
        <ChartSkeleton />
        <div className="space-y-4">
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
      <TableSkeleton />
    </div>
  );
}
