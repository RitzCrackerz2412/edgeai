export default function MatchupLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-16 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      </div>
      <div className="h-32 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    </div>
  );
}
