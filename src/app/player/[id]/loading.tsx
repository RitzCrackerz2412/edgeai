import { ChartSkeleton, TableSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="skeleton h-36 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <StatCardSkeleton />
            <div className="skeleton h-40 w-full rounded-2xl" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
