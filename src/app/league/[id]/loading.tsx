export default function LeagueLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="h-4 w-48 rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="h-12 w-full rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-10 w-full rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      ))}
    </div>
  );
}
