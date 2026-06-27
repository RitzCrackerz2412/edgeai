import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportLeaderboard from '@/components/sport-pages/SportLeaderboard';

export default function Page() {
  return <SportLeaderboard config={SPORT_CONFIGS.nhl} />;
}
