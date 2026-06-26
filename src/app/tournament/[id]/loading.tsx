export default function TournamentLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-72 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="h-4 w-48 rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    </div>
  );
}
