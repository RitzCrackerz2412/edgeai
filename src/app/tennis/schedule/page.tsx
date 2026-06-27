import { SPORT_CONFIGS } from '@/lib/sports/config';
import SportSchedule from '@/components/sport-pages/SportSchedule';

export default function Page() {
  return <SportSchedule config={SPORT_CONFIGS.tennis} />;
}
