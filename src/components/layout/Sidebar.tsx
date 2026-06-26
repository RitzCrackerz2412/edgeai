'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Shield, User, BarChart2, Search,
  Settings, ChevronLeft, ChevronRight, X, Zap, History, SlidersHorizontal,
  Activity, BrainCircuit, GitCompare, Trophy, Dumbbell, Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_NAV = [
  { href: '/',                  label: 'Dashboard', Icon: LayoutGrid,   exact: true },
  { href: '/team',              label: 'Teams',     Icon: Shield },
  { href: '/player',            label: 'Players',   Icon: User },
  { href: '/accuracy',          label: 'Accuracy',  Icon: BarChart2 },
  { href: '/history',           label: 'History',   Icon: History },
  { href: '/search',            label: 'Search',    Icon: Search },
];

const V2_NAV = [
  { href: '/compare/teams',   label: 'Compare Teams',   Icon: GitCompare },
  { href: '/compare/players', label: 'Compare Players', Icon: Zap },
  { href: '/draft',           label: 'Draft',           Icon: Trophy },
  { href: '/fantasy',         label: 'Fantasy',         Icon: Dumbbell },
];

const BOTTOM_NAV = [
  { href: '/settings',      label: 'Settings', Icon: SlidersHorizontal },
  { href: '/admin',         label: 'Admin',    Icon: Settings },
  { href: '/admin/monitor', label: 'Monitor',  Icon: Activity },
  { href: '/admin/model',   label: 'Model',    Icon: BrainCircuit },
];

interface SidebarProps {
  collapsed:   boolean;
  onToggle:    () => void;
  mobileOpen:  boolean;
  onClose:     () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const w = collapsed ? 'var(--sidebar-mini)' : 'var(--sidebar-w)';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/*
       * The sidebar is fixed-position so it overlays on mobile (drawer)
       * and stays visible on desktop while the spacer div in AppShell
       * ensures the main column is pushed right.
       */}
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
        {/* Logo row */}
        <div
          className="flex items-center h-[var(--topbar-h)] px-3 gap-2 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Zap size={14} color="#fff" strokeWidth={2.5} />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                EdgeAI
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
            <X size={15} />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 no-scrollbar">
          {PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={active(item.href, item.exact)}
              collapsed={collapsed}
              onClick={onClose}
            />
          ))}

          {/* V2 section */}
          {!collapsed && (
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              V2 Intelligence
            </p>
          )}
          {collapsed && <div className="my-2 border-t" style={{ borderColor: 'var(--border-subtle)' }} />}
          {V2_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={active(item.href)}
              collapsed={collapsed}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 divider" />

        {/* Bottom nav */}
        <div className="py-2 px-2 space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={active(item.href)}
              collapsed={collapsed}
              onClick={onClose}
            />
          ))}
        </div>

        {/* Collapse toggle — desktop only */}
        <div
          className="hidden lg:flex justify-end px-3 py-2.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight size={12} />
              : <ChevronLeft  size={12} />}
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
      className={cn(
        'flex items-center gap-2.5 rounded-lg transition-all duration-150 group',
        collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-2.5',
      )}
      style={{
        background:  isActive ? 'var(--accent-dim)' : 'transparent',
        color:       isActive ? 'var(--accent-light)' : 'var(--text-muted)',
        borderLeft:  !collapsed && isActive ? '2px solid var(--accent)' : '2px solid transparent',
        paddingLeft: !collapsed && isActive ? '9px' : undefined,
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
    </Link>
  );
}
