'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Shield, User, BarChart2, Search,
  Settings, ChevronLeft, ChevronRight, X, Zap, History,
  Activity, BrainCircuit, GitCompare, Trophy,
  Globe, Swords, CalendarDays, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_NAV = [
  { href: '/',      label: 'Dashboard', Icon: LayoutGrid, exact: true },
  { href: '/games', label: 'Games',     Icon: CalendarDays },
  { href: '/team',  label: 'Teams',     Icon: Shield },
  { href: '/player',label: 'Players',   Icon: User },
  { href: '/search',label: 'Search',    Icon: Search },
];

const ANALYSIS_NAV = [
  { href: '/accuracy',         label: 'Accuracy',    Icon: BarChart2 },
  { href: '/history',          label: 'History',     Icon: History },
  { href: '/matchup',          label: 'Matchup',     Icon: Swords },
  { href: '/compare/teams',    label: 'Compare',     Icon: GitCompare },
  { href: '/league/epl',       label: 'Leagues',     Icon: Globe },
  { href: '/tournament/worldcup2026', label: 'Tournaments', Icon: Trophy },
];

const SPORTS_NAV = [
  { href: '/nba',     label: 'NBA',       color: '#ea580c' },
  { href: '/mlb',     label: 'MLB',       color: '#16a34a' },
  { href: '/nhl',     label: 'NHL',       color: '#0ea5e9' },
  { href: '/soccer',  label: 'Soccer',    color: '#10b981' },
  { href: '/ncaaf',   label: 'NCAAF',     color: '#7c3aed' },
  { href: '/ncaab',   label: 'NCAAB',     color: '#f59e0b' },
  { href: '/ufc',     label: 'UFC',       color: '#dc2626' },
  { href: '/boxing',  label: 'Boxing',    color: '#b91c1c' },
  { href: '/tennis',  label: 'Tennis',    color: '#ca8a04' },
  { href: '/f1',      label: 'Formula 1', color: '#dc2626' },
  { href: '/cricket', label: 'Cricket',   color: '#059669' },
  { href: '/esports', label: 'Esports',   color: '#8b5cf6' },
];

const ADMIN_NAV = [
  { href: '/settings',      label: 'Settings', Icon: SlidersHorizontal },
  { href: '/admin',         label: 'Admin',    Icon: Settings },
  { href: '/admin/monitor', label: 'Monitor',  Icon: Activity },
  { href: '/admin/model',   label: 'Model',    Icon: BrainCircuit },
];

interface SidebarProps {
  collapsed:  boolean;
  onToggle:   () => void;
  mobileOpen: boolean;
  onClose:    () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const w = collapsed ? 'var(--sidebar-mini)' : 'var(--sidebar-w)';

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col sidebar-trans',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{
          width: w,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 shrink-0"
          style={{ height: 'var(--topbar-h)', padding: '0 0.875rem', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={13} color="#fff" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)', lineHeight: 1 }}>
                EdgeAI
              </p>
              <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.1875rem', letterSpacing: '0.04em' }}>
                Sports Intelligence
              </p>
            </div>
          )}
          <button
            className="ml-auto lg:hidden p-1 rounded"
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Nav ───────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-1.5 no-scrollbar" style={{ padding: '0.375rem 0.5rem' }}>

          {/* Primary */}
          <div style={{ marginBottom: '0.25rem' }}>
            {PRIMARY_NAV.map(item => (
              <NavItem key={item.href} {...item} isActive={active(item.href, item.exact)} collapsed={collapsed} onClick={onClose} />
            ))}
          </div>

          {/* Analysis */}
          {!collapsed && (
            <p style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', padding: '0.625rem 0.625rem 0.25rem' }}>
              Analysis
            </p>
          )}
          {collapsed && <div style={{ margin: '0.375rem 0', height: 1, background: 'var(--border-subtle)' }} />}
          <div style={{ marginBottom: '0.25rem' }}>
            {ANALYSIS_NAV.map(item => (
              <NavItem key={item.href} {...item} isActive={active(item.href)} collapsed={collapsed} onClick={onClose} />
            ))}
          </div>

          {/* Sports */}
          {!collapsed && (
            <p style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', padding: '0.625rem 0.625rem 0.25rem' }}>
              Sports
            </p>
          )}
          {collapsed && <div style={{ margin: '0.375rem 0', height: 1, background: 'var(--border-subtle)' }} />}
          <div>
            {SPORTS_NAV.map(({ href, label, color }) => {
              const isAct = active(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={cn('flex items-center gap-2 rounded-md transition-all duration-150', collapsed ? 'h-8 w-8 justify-center mx-auto' : 'h-8 px-2')}
                  style={{
                    background: isAct ? `${color}15` : 'transparent',
                    color: isAct ? color : 'var(--text-muted)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: 2,
                    background: isAct ? color : 'var(--border-strong)',
                    flexShrink: 0, display: 'inline-block',
                    transition: 'background 0.15s',
                  }} />
                  {!collapsed && (
                    <span style={{ fontSize: '0.8125rem', fontWeight: isAct ? 600 : 400, color: isAct ? color : 'var(--text-secondary)', transition: 'color 0.15s' }}>
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div style={{ margin: '0 0.75rem', height: 1, background: 'var(--border-subtle)' }} />

        {/* ── Admin ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0.375rem 0.5rem' }}>
          {ADMIN_NAV.map(item => (
            <NavItem key={item.href} {...item} isActive={active(item.href)} collapsed={collapsed} onClick={onClose} />
          ))}
        </div>

        {/* ── Collapse toggle ───────────────────────────────────────── */}
        <div className="hidden lg:flex justify-end" style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={onToggle}
            style={{
              width: 22, height: 22, borderRadius: 5,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href, label, Icon, isActive, collapsed, onClick,
}: {
  href: string; label: string; Icon: React.ElementType;
  isActive: boolean; collapsed: boolean; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn('flex items-center gap-2 rounded-md transition-all duration-150', collapsed ? 'h-8 w-8 justify-center mx-auto' : 'h-8 px-2')}
      style={{
        background:  isActive ? 'var(--accent-dim)' : 'transparent',
        color:       isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} style={{ flexShrink: 0, color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }} />
      {!collapsed && (
        <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </Link>
  );
}
