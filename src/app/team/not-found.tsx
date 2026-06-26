import Link from 'next/link';
import { Users } from 'lucide-react';

export default function TeamNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <Users size={40} className="mb-4" style={{ color: 'var(--text-muted)' }} />
      <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Team not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        This team isn&apos;t in our database yet. More teams will be added as data is connected.
      </p>
      <Link
        href="/team"
        className="px-5 py-2 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
      >
        Browse teams
      </Link>
    </div>
  );
}
