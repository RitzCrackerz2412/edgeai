import SportLayout from '@/components/sport-pages/SportLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SportLayout sportId="nhl">{children}</SportLayout>;
}
