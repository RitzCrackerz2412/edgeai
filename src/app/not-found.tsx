import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="text-7xl font-black text-mono mb-3"
        style={{ color: 'var(--border-strong)', letterSpacing: '-0.05em' }}
      >
        404
      </div>

      <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
      <p className="text-sm max-w-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-5 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
        >
          Go home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
          }}
        >
          <Search size={14} />
          Search
        </Link>
      </div>
    </div>
  );
}
