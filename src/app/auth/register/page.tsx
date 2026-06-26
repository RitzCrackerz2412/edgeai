'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Registration failed.');
    } else {
      router.push('/auth/signin?registered=true');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <span className="text-blue-400">Edge</span><span>AI</span>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'name',     label: 'Name',     type: 'text',     val: name,     set: setName,     auto: 'name' },
            { id: 'email',    label: 'Email',    type: 'email',    val: email,    set: setEmail,    auto: 'email' },
            { id: 'password', label: 'Password', type: 'password', val: password, set: setPassword, auto: 'new-password' },
          ].map(f => (
            <div key={f.id}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }} htmlFor={f.id}>
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                autoComplete={f.auto}
                required
                value={f.val}
                onChange={e => f.set(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}

          {error && (
            <p className="text-xs text-red-400 rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
