export default function GamesLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    </div>
  );
}
