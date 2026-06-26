'use client';

/**
 * Notification bell icon for the AppShell topbar.
 * Shows unread count badge; opens dropdown with recent notifications.
 */

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'game_reminder' | 'injury_alert' | 'line_movement' | 'game_summary' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  url?: string;
}

const TYPE_ICON: Record<Notification['type'], string> = {
  game_reminder: '🔔',
  injury_alert:  '⚠️',
  line_movement: '📈',
  game_summary:  '🏆',
  system:        'ℹ️',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  async function load() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silent
    }
  }

  async function markAll() {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markAllRead' }) });
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  async function dismiss(id: string) {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    setNotifications(ns => ns.filter(n => n.id !== id));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function formatTime(iso: string) {
    const d = new Date(iso);
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div ref={ref} className="relative" style={{ zIndex: 50 }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
        style={{ background: open ? 'var(--bg-hover)' : 'transparent', border: '1px solid var(--border-muted)' }}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: '#ef4444', color: '#fff', fontSize: '10px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-muted)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notifications {unread > 0 && <span className="ml-1 text-xs text-blue-400">({unread} new)</span>}
            </p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs cursor-pointer hover:underline" style={{ color: 'var(--text-muted)' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</p>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div key={n.id}
                  className="flex items-start gap-3 px-4 py-3 group"
                  style={{
                    borderBottom: '1px solid var(--border-muted)',
                    background: n.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                  }}>
                  <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{n.body}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{formatTime(n.createdAt)}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} aria-label="Dismiss"
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
