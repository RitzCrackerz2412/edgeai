import { TableSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="skeleton h-9 w-full rounded-lg" />
      <TableSkeleton rows={10} cols={8} />
    </div>
  );
}
