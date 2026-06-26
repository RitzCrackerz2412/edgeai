import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Tracker',
  description: 'Real-time win probability simulation — watch predictions update as the game unfolds.',
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
