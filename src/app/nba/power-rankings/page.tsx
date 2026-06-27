import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportPowerRankings from '@/components/sport-pages/SportPowerRankings';

export default function Page() {
  return <SportPowerRankings config={SPORT_CONFIGS.nba} />;
}
