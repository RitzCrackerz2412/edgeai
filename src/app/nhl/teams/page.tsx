import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportTeams from '@/components/sport-pages/SportTeams';

export default function Page() {
  return <SportTeams config={SPORT_CONFIGS.nhl} />;
}
