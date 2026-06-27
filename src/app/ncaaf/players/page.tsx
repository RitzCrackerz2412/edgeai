import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportPlayers from '@/components/sport-pages/SportPlayers';

export default function Page() {
  return <SportPlayers config={SPORT_CONFIGS.ncaaf} />;
}
