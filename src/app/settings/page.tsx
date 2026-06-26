'use client';

import { useState } from 'react';
import {
  Moon, Bell, Heart, Database, Cpu, ChevronRight,
  CheckCircle, XCircle, Clock, Wifi, WifiOff,
} from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    upcomingGame: true,
    predictionResult: true,
    dailyDigest: false,
    upsetAlerts: true,
  });

  const [favorites, setFavorites] = useState<string[]>(['Boston Celtics', 'Kansas City Chiefs']);

  const [defaultSport, setDefaultSport] = useState('All Sports');

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications(n => ({ ...n, [key]: !n[key] }));

  const removeTeam = (name: string) => setFavorites(f => f.filter(t => t !== name));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Customize EdgeAI to your preferences
        </p>
      </div>

      {/* Display */}
      <Section title="Display" icon={<Moon size={14} />}>
        <SettingRow
          label="Theme"
          description="Interface color scheme"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <Moon size={13} />
            Dark (only mode)
          </div>
        </SettingRow>

        <SettingRow label="Default Sport" description="Sport shown first on the dashboard">
          <select
            value={defaultSport}
            onChange={e => setDefaultSport(e.target.value)}
            className="h-8 px-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            {['All Sports', 'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'UFC'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={<Bell size={14} />}>
        {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => {
          const labels: Record<string, [string, string]> = {
            upcomingGame:      ['Upcoming game reminders', '1 hour before a predicted game starts'],
            predictionResult:  ['Prediction results',      'Notified when a game you watched completes'],
            dailyDigest:       ['Daily digest',             'Morning summary of today\'s top picks'],
            upsetAlerts:       ['Upset alerts',             'Notified when upset probability exceeds 35%'],
          };
          const [label, desc] = labels[key];
          return (
            <SettingRow key={key} label={label} description={desc}>
              <Toggle checked={val} onChange={() => toggleNotif(key)} />
            </SettingRow>
          );
        })}
      </Section>

      {/* Favorite Teams */}
      <Section title="Favorite Teams" icon={<Heart size={14} />}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {favorites.map(team => (
              <div
                key={team}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <Heart size={12} style={{ color: 'var(--danger)' }} />
                {team}
                <button
                  onClick={() => removeTeam(team)}
                  className="ml-1 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <XCircle size={13} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Team personalization will be fully editable once user accounts are enabled.
          </p>
        </div>
      </Section>

      {/* API Status */}
      <Section title="Data Providers" icon={<Database size={14} />}>
        {[
          { name: 'Sports Schedule API',     provider: 'SportsDataIO',    status: 'mock' as const,       note: 'Using mock data' },
          { name: 'Player Stats & Injuries', provider: 'Sportradar',      status: 'disconnected' as const, note: 'Not connected' },
          { name: 'Betting Lines & Odds',    provider: 'The Odds API',    status: 'disconnected' as const, note: 'Not connected' },
          { name: 'Weather',                 provider: 'OpenWeatherMap',  status: 'disconnected' as const, note: 'Not connected' },
          { name: 'News Feed',               provider: 'NewsAPI',         status: 'disconnected' as const, note: 'Not connected' },
        ].map(p => (
          <div key={p.name} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.provider}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.note}</span>
              {p.status === 'mock'
                ? <Clock size={14} style={{ color: 'var(--warning)' }} />
                : <WifiOff size={14} style={{ color: 'var(--danger)' }} />}
            </div>
          </div>
        ))}
        <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
          API connections will be configured during production setup. See AGENTS.md for integration guidance.
        </p>
      </Section>

      {/* Model Info */}
      <Section title="Prediction Model" icon={<Cpu size={14} />}>
        {[
          { label: 'Model Version',   value: 'v0.1.0-mock' },
          { label: 'Algorithm',       value: 'Bayesian ensemble (placeholder)' },
          { label: 'Training Data',   value: 'Not connected' },
          { label: 'Last Retrained',  value: 'N/A' },
          { label: 'Overall Accuracy',value: '68.4% (mock data)' },
          { label: 'Brier Score',     value: '0.194 (mock)' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
            <span className="text-sm text-mono" style={{ color: 'var(--text-primary)' }}>{r.value}</span>
          </div>
        ))}
      </Section>

      {/* Version */}
      <div className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
        EdgeAI v0.1.0 · Mock data mode · Built with Next.js 16 + TypeScript
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--accent-light)' }}>{icon}</span>
        <h2 className="text-h3" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-10 h-5 rounded-full relative transition-colors"
      style={{ background: checked ? 'var(--accent)' : 'var(--border-default)', border: 'none', cursor: 'pointer' }}
      aria-checked={checked}
      role="switch"
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ left: '2px', transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}
