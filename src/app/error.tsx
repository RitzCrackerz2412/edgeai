'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
      </div>

      <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
      <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {error.message ?? 'An unexpected error occurred. Please try again.'}
      </p>

      {error.digest && (
        <p className="text-xs mb-5 text-mono-sm" style={{ color: 'var(--text-muted)' }}>
          Error ID: {error.digest}
        </p>
      )}

      <button
        onClick={() => unstable_retry()}
        className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
