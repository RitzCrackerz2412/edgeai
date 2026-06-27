import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportMatchup from '@/components/sport-pages/SportMatchup';

export default function Page() {
  return <SportMatchup config={SPORT_CONFIGS.boxing} />;
}
