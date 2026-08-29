'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings, ChevronLeft, ChevronRight, ChevronDown, X,
  Activity, BrainCircuit, CalendarDays, SlidersHorizontal,
  TrendingUp, BarChart2, LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORTS_ITEMS = [
  { href: '/nba',     label: 'NBA' },
  { href: '/mlb',     label: 'MLB' },
  { href: '/nhl',     label: 'NHL' },
  { href: '/soccer',  label: 'Soccer' },
  { href: '/ncaaf',   label: 'NCAAF' },
  { href: '/ncaab',   label: 'NCAAB' },
  { href: '/ufc',     label: 'UFC' },
  { href: '/boxing',  label: 'Boxing' },
  { href: '/tennis',  label: 'Tennis' },
  { href: '/f1',      label: 'Formula 1' },
  { href: '/cricket', label: 'Cricket' },
  { href: '/esports', label: 'Esports' },
];

const ANALYSIS_ITEMS = [
  { href: '/edge',           label: 'Edge Sheet' },
  { href: '/history',        label: 'History' },
  { href: '/matchup',        label: 'Matchup' },
  { href: '/compare/teams',  label: 'Compare' },
  { href: '/league/epl',     label: 'Leagues' },
  { href: '/tournament/worldcup2026', label: 'Tournaments' },
  { href: '/team',           label: 'Teams' },
  { href: '/player',         label: 'Players' },
  { href: '/methodology',    label: 'Methodology' },
];

const FINANCE_ITEMS = [
  { href: '/finance',           label: 'Overview' },
  { href: '/finance/markets',   label: 'Markets' },
  { href: '/finance/scanner',   label: 'Scanner' },
  { href: '/finance/portfolio', label: 'Portfolio' },
  { href: '/finance/news',      label: 'News' },
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

  const sportsActive   = SPORTS_ITEMS.some(i => pathname.startsWith(i.href));
  const analysisActive = ANALYSIS_ITEMS.some(i => pathname === i.href || pathname.startsWith(i.href + '/'));
  const financeActive  = pathname.startsWith('/finance');

  const [sportsOpen, setSportsOpen]     = useState(sportsActive);
  const [analysisOpen, setAnalysisOpen] = useState(analysisActive);
  const [financeOpen, setFinanceOpen]   = useState(financeActive);

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
        {/* ── Wordmark ─────────────────────────────────────────────── */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 'var(--topbar-h)', padding: '0 1rem', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Link href="/" onClick={onClose} style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: collapsed ? '0.875rem' : '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              {collapsed ? 'E' : 'EdgeAI'}
            </span>
          </Link>
          <button
            className="ml-auto lg:hidden p-1 rounded"
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0.625rem 0.5rem' }}>

          <TopItem href="/games" label="Games" Icon={CalendarDays} isActive={active('/games')} collapsed={collapsed} onClick={onClose} />

          <GroupItem
            label="Sports" Icon={LineChart}
            open={sportsOpen} setOpen={setSportsOpen}
            groupActive={sportsActive} collapsed={collapsed}
            items={SPORTS_ITEMS} pathname={pathname} onClose={onClose}
          />

          <GroupItem
            label="Analysis" Icon={BarChart2}
            open={analysisOpen} setOpen={setAnalysisOpen}
            groupActive={analysisActive} collapsed={collapsed}
            items={ANALYSIS_ITEMS} pathname={pathname} onClose={onClose}
          />

          <GroupItem
            label="Finance" Icon={TrendingUp}
            open={financeOpen} setOpen={setFinanceOpen}
            groupActive={financeActive} collapsed={collapsed}
            items={FINANCE_ITEMS} pathname={pathname} onClose={onClose}
            exactRoot="/finance"
          />

          <TopItem href="/accuracy" label="Accuracy" Icon={BarChart2} isActive={active('/accuracy')} collapsed={collapsed} onClick={onClose} />
        </nav>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div style={{ margin: '0 0.75rem', height: 1, background: 'var(--border-subtle)' }} />

        {/* ── Admin ────────────────────────────────────────────────── */}
        <div style={{ padding: '0.375rem 0.5rem' }}>
          {ADMIN_NAV.map(item => (
            <TopItem key={item.href} {...item} isActive={active(item.href)} collapsed={collapsed} onClick={onClose} />
          ))}
        </div>

        {/* ── Collapse toggle ──────────────────────────────────────── */}
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

function TopItem({
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
      className={cn('flex items-center gap-2.5 rounded-md transition-all duration-150', collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-2.5')}
      style={{
        background:  isActive ? 'var(--accent-dim)' : 'transparent',
        textDecoration: 'none',
        marginBottom: 2,
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={15} strokeWidth={isActive ? 2.25 : 1.75} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
      {!collapsed && (
        <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </Link>
  );
}

function GroupItem({
  label, Icon, open, setOpen, groupActive, collapsed, items, pathname, onClose, exactRoot,
}: {
  label: string; Icon: React.ElementType;
  open: boolean; setOpen: (v: boolean) => void;
  groupActive: boolean; collapsed: boolean;
  items: { href: string; label: string }[];
  pathname: string; onClose: () => void;
  exactRoot?: string;
}) {
  if (collapsed) {
    // Collapsed rail: the group icon links to its first destination
    return (
      <Link
        href={items[0].href}
        onClick={onClose}
        title={label}
        className="flex items-center justify-center h-9 w-9 mx-auto rounded-md transition-all duration-150"
        style={{ background: groupActive ? 'var(--accent-dim)' : 'transparent', textDecoration: 'none', marginBottom: 2 }}
      >
        <Icon size={15} strokeWidth={groupActive ? 2.25 : 1.75} style={{ color: groupActive ? 'var(--accent)' : 'var(--text-muted)' }} />
      </Link>
    );
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-md transition-all duration-150 w-full h-9 px-2.5"
        style={{
          background: groupActive && !open ? 'var(--accent-dim)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = groupActive && !open ? 'var(--accent-dim)' : 'transparent'; }}
        aria-expanded={open}
      >
        <Icon size={15} strokeWidth={groupActive ? 2.25 : 1.75} style={{ flexShrink: 0, color: groupActive ? 'var(--accent)' : 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.8125rem', fontWeight: groupActive ? 600 : 500, color: groupActive ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>
          {label}
        </span>
        <ChevronDown
          size={12}
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div style={{ paddingLeft: '1.625rem', paddingTop: 2, paddingBottom: 2 }}>
          {items.map(({ href, label: itemLabel }) => {
            const isAct = href === exactRoot ? pathname === href : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center rounded-md transition-all duration-150 h-7 px-2"
                style={{ background: isAct ? 'var(--accent-dim)' : 'transparent', textDecoration: 'none', marginBottom: 1 }}
                onMouseEnter={e => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: isAct ? 600 : 400, color: isAct ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {itemLabel}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
