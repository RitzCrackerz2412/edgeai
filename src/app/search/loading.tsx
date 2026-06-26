export default function SearchLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      <div className="h-12 w-full rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
      ))}
    </div>
  );
}
