import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportHome from '@/components/sport-pages/SportHome';

export default function Page() {
  return <SportHome config={SPORT_CONFIGS.mlb} />;
}
