import { StatCardSkeleton, GameCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Game cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
