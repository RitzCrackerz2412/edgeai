export default function Loading() {
  return (
    <div className="space-y-5 max-w-screen-2xl animate-pulse">
      <div className="h-32 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-72 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
          <div className="h-64 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
        </div>
        <div className="space-y-5">
          <div className="h-80 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
          <div className="h-48 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
        </div>
      </div>
    </div>
  );
}
