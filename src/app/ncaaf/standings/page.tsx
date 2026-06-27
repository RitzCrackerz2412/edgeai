import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportStandings from '@/components/sport-pages/SportStandings';

export default function Page() {
  return <SportStandings config={SPORT_CONFIGS.ncaaf} />;
}
