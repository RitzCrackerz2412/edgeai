'use client';

import { Menu, ChevronDown } from 'lucide-react';
import SearchBox from '@/components/ui/SearchBox';
import NotificationBell from '@/components/ui/NotificationBell';

interface TopBarProps {
  onMenuClick:     () => void;
  sidebarCollapsed: boolean;
  sidebarWidth:    string;
}

export function TopBar({ onMenuClick, sidebarCollapsed: _sidebarCollapsed, sidebarWidth }: TopBarProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-3 px-4"
      style={{
        /* Left edge aligns with end of sidebar on desktop */
        left: 0,
        height: 'var(--topbar-h)',
        background: 'rgba(7,7,14,0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/*
       * Desktop sidebar spacer — keeps the topbar content right of the sidebar.
       * Matches the spacer div in AppShell so search/controls align with page content.
       */}
      <div
        className="hidden lg:block shrink-0 sidebar-trans"
        style={{ width: sidebarWidth }}
        aria-hidden
      />

      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Search with live autocomplete */}
      <SearchBox className="flex-1 max-w-xs lg:max-w-sm" />

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-auto">
        <NotificationBell />

        {/* User menu — will show session user once auth is wired */}
        <button
          aria-label="User menu"
          className="flex items-center gap-1.5 h-8 px-2 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            G
          </div>
          <span className="text-xs hidden sm:block">Guest</span>
          <ChevronDown size={11} />
        </button>
      </div>
    </header>
  );
}
