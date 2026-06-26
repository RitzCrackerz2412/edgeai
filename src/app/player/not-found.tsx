import Link from 'next/link';
import { User } from 'lucide-react';

export default function PlayerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <User size={40} className="mb-4" style={{ color: 'var(--text-muted)' }} />
      <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Player not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        This player isn&apos;t in our database yet. Player profiles are added as leagues go live.
      </p>
      <Link
        href="/player"
        className="px-5 py-2 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
      >
        Browse players
      </Link>
    </div>
  );
}
