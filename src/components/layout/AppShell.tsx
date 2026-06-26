'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { Breadcrumbs } from './Breadcrumbs';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem('sidebar-collapsed');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v !== null) setCollapsed(v === 'true');
  }, []);

  const toggle = () =>
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });

  const sidebarW = collapsed ? 'var(--sidebar-mini)' : 'var(--sidebar-w)';

  return (
    /*
     * Root: full-height flex row.
     * On desktop the sidebar is a sticky flex child — it takes real space
     * so the main column naturally shifts without margin hacks.
     * On mobile the sidebar becomes a fixed drawer (handled inside Sidebar).
     */
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Desktop sidebar spacer (takes space in flex, hidden <lg) ── */}
      <div
        className="hidden lg:block shrink-0 sidebar-trans"
        style={{ width: sidebarW }}
        aria-hidden
      />

      {/* ── Fixed sidebar panel ── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Fixed topbar */}
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          sidebarWidth={sidebarW}
        />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1"
          style={{
            paddingTop:    'var(--topbar-h)',
            paddingBottom: '4rem', /* room for mobile bottom nav */
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <MobileNav />
    </div>
  );
}
