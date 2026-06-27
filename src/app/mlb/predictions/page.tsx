import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportPredictions from '@/components/sport-pages/SportPredictions';

export default function Page() {
  return <SportPredictions config={SPORT_CONFIGS.mlb} />;
}
