export default function AnalystLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="h-4 w-96 rounded" style={{ background: 'var(--bg-elevated)' }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-40 rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-24 w-full rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      ))}
    </div>
  );
}
