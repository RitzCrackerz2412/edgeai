import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Head-to-head team and player analytics — radar charts, career stats, and AI-generated comparisons.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
