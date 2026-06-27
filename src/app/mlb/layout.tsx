import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportLayout from '@/components/sport-pages/SportLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SportLayout config={SPORT_CONFIGS.mlb}>{children}</SportLayout>;
}
