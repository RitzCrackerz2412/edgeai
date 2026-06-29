'use client';

import { Menu, ChevronDown } from 'lucide-react';
import SearchBox from '@/components/ui/SearchBox';
import NotificationBell from '@/components/ui/NotificationBell';

interface TopBarProps {
  onMenuClick:      () => void;
  sidebarCollapsed: boolean;
  sidebarWidth:     string;
}

export function TopBar({ onMenuClick, sidebarWidth }: TopBarProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-3 px-4"
      style={{
        left: 0,
        height: 'var(--topbar-h)',
        background: 'rgba(7,7,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Desktop spacer — aligns content with sidebar edge */}
      <div className="hidden lg:block shrink-0 sidebar-trans" style={{ width: sidebarWidth }} aria-hidden />

      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md"
        style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        aria-label="Open navigation"
      >
        <Menu size={17} />
      </button>

      {/* Search */}
      <SearchBox className="flex-1 max-w-xs lg:max-w-sm" />

      {/* Right controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        <NotificationBell />

        <button
          aria-label="User menu"
          className="flex items-center gap-1.5 rounded-md transition-all"
          style={{
            height: 30, padding: '0 0.5rem',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            background: 'transparent', cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5625rem', fontWeight: 800, color: '#fff',
          }}>
            G
          </div>
          <span style={{ fontSize: '0.75rem', display: 'none' }} className="sm:block">Guest</span>
          <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </header>
  );
}
