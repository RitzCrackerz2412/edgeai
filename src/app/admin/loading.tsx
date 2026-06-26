import { StatCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';

export default function AdminLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
