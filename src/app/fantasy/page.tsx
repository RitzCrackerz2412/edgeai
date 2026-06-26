import { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Fantasy Sports Projections' };

type InjuryRisk = 'Low' | 'Medium' | 'High';
type Tag = 'Start' | 'Sit' | 'Sleeper' | 'Bust' | 'Streamer' | 'Must-Start';

interface FantasyPlayer {
  name: string;
  position: string;
  team: string;
  sport: 'NFL' | 'NBA' | 'MLB';
  projectedPoints: number;
  avgPoints: number;
  upside: number;
  floor: number;
  tag: Tag;
  injuryRisk: InjuryRisk;
  opponent: string;
  matchupGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  note: string;
  ownership: number;
}

const PROJECTIONS: FantasyPlayer[] = [
  { name: 'Patrick Mahomes', position: 'QB', team: 'KC', sport: 'NFL', projectedPoints: 31.4, avgPoints: 28.9, upside: 42, floor: 22, tag: 'Must-Start', injuryRisk: 'Low', opponent: 'BUF', matchupGrade: 'B', ownership: 94, note: 'Top-5 QB weekly ceiling. Arrowhead in January, Mahomes averages 32.1 PPG at home in playoff-seeded games. Stack with Hill or Kelce.' },
  { name: 'Josh Allen', position: 'QB/RB', team: 'BUF', sport: 'NFL', projectedPoints: 28.7, avgPoints: 26.2, upside: 45, floor: 18, tag: 'Start', injuryRisk: 'Low', opponent: 'KC', matchupGrade: 'B', ownership: 88, note: 'Allen\'s rushing adds a floor most QBs can\'t match. His upside in competitive games (28+ attempts) is sky-high. The 45-point ceiling is realistic.' },
  { name: 'Stefon Diggs', position: 'WR', team: 'BUF', sport: 'NFL', projectedPoints: 17.8, avgPoints: 15.4, upside: 28, floor: 6, tag: 'Start', injuryRisk: 'Medium', opponent: 'KC', matchupGrade: 'C', ownership: 72, note: 'Matchup vs KC CB1 is tough, but volume (8+ targets) floors Diggs. If BUF is in negative game script, targets explode.' },
  { name: 'Travis Kelce', position: 'TE', team: 'KC', sport: 'NFL', projectedPoints: 16.9, avgPoints: 15.8, upside: 26, floor: 8, tag: 'Must-Start', injuryRisk: 'Low', opponent: 'BUF', matchupGrade: 'A', ownership: 91, note: 'TE1 of the week. BUF linebackers have allowed 9.4 YPR to opposing TEs. Kelce is the definition of A+ matchup equity.' },
  { name: 'Jayson Tatum', position: 'SF', team: 'BOS', sport: 'NBA', projectedPoints: 48.6, avgPoints: 45.2, upside: 62, floor: 32, tag: 'Must-Start', injuryRisk: 'Low', opponent: 'LAL', matchupGrade: 'A', ownership: 97, note: 'Tatum averages 31.2 PPG vs LAL in last 5 meetings. Lakers play at 101st-ranked defensive pace — elite fantasy environment.' },
  { name: 'LeBron James', position: 'SF/PF', team: 'LAL', sport: 'NBA', projectedPoints: 44.1, avgPoints: 42.8, upside: 58, floor: 31, tag: 'Must-Start', injuryRisk: 'Medium', opponent: 'BOS', matchupGrade: 'C', ownership: 95, note: 'Matchup is tough (Celtics #1 defense), but LeBron\'s motivation factor vs elite competition historically elevates his floor. Injury concern: knee load management.' },
  { name: 'Anthony Davis', position: 'PF/C', team: 'LAL', sport: 'NBA', projectedPoints: 52.4, avgPoints: 49.3, upside: 68, floor: 35, tag: 'Must-Start', injuryRisk: 'Medium', opponent: 'BOS', matchupGrade: 'B', ownership: 93, note: 'Best fantasy play of the week. Celtics don\'t have a true center that matches Davis in size. Interior scoring + rebounding makes him the chalk in this slate.' },
  { name: 'Aaron Nola', position: 'SP', team: 'PHI', sport: 'MLB', projectedPoints: 38.2, avgPoints: 33.4, upside: 48, floor: 18, tag: 'Sleeper', injuryRisk: 'Low', opponent: 'NYM', matchupGrade: 'A', ownership: 34, note: 'Elite matchup — NYM rank 24th in K% vs RHP. Nola\'s curve/cutter combo plays perfectly here. At 34% ownership, he\'s underpriced DFS value.' },
  { name: 'Aaron Judge', position: 'OF', team: 'NYY', sport: 'MLB', projectedPoints: 18.4, avgPoints: 15.2, upside: 32, floor: 4, tag: 'Start', injuryRisk: 'Low', opponent: 'HOU', matchupGrade: 'B', ownership: 88, note: 'Even against quality pitching, Judge\'s power ceiling is matchup-independent. Home game at Yankee Stadium adds +2.1 expected power units.' },
  { name: 'D\'Andre Swift', position: 'RB', team: 'PHI', sport: 'NFL', projectedPoints: 14.2, avgPoints: 12.8, upside: 22, floor: 6, tag: 'Start', injuryRisk: 'Low', opponent: 'DAL', matchupGrade: 'A', ownership: 61, note: 'Touches + target share make Swift the highest-floor RB this week. DAL allows 5.1 YPC to opposing RBs. Safe mid-round value.' },
  { name: 'Rashee Rice', position: 'WR', team: 'KC', sport: 'NFL', projectedPoints: 15.8, avgPoints: 13.1, upside: 29, floor: 5, tag: 'Sleeper', injuryRisk: 'Medium', opponent: 'BUF', matchupGrade: 'B', ownership: 41, note: 'Rice has emerged as KC\'s WR1 with Hill limited. Upside is real in a game expected to have 48+ points. High ceiling, soft floor.' },
  { name: 'Gerrit Cole', position: 'SP', team: 'NYY', sport: 'MLB', projectedPoints: 42.8, avgPoints: 38.2, upside: 55, floor: 24, tag: 'Must-Start', injuryRisk: 'Low', opponent: 'HOU', matchupGrade: 'A', ownership: 82, note: 'Cole is averaging 8.4 K per outing this season with a 1.89 ERA at home. HOU struggles against elite RHP — this is a top-3 pitcher play regardless of format.' },
];

const TAG_STYLES: Record<Tag, { bg: string; color: string }> = {
  'Must-Start': { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  'Start':      { bg: 'rgba(59,130,246,0.10)', color: '#3b82f6' },
  'Sleeper':    { bg: 'rgba(139,92,246,0.10)', color: '#8b5cf6' },
  'Bust':       { bg: 'rgba(239,68,68,0.10)',  color: '#ef4444' },
  'Streamer':   { bg: 'rgba(245,158,11,0.10)', color: '#f59e0b' },
  'Sit':        { bg: 'rgba(107,114,128,0.10)', color: '#6b7280' },
};

const GRADE_COLOR: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444', F: '#dc2626' };
const INJURY_COLOR: Record<InjuryRisk, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

function PointsBar({ val, max }: { val: number; max: number }) {
  return (
    <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div style={{ width: `${(val / max) * 100}%`, background: 'var(--accent-blue, #3b82f6)', height: '100%' }} />
    </div>
  );
}

export default function FantasyPage() {
  const sports = ['NFL', 'NBA', 'MLB'] as const;
  const maxPts = Math.max(...PROJECTIONS.map(p => p.upside));

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10" style={{ color: 'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-bold">Fantasy Sports Projections</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Weekly projections, sleepers, busts, and waiver recommendations — powered by EdgeAI
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Must-Starts', val: PROJECTIONS.filter(p => p.tag === 'Must-Start').length, color: '#10b981' },
          { label: 'Sleepers', val: PROJECTIONS.filter(p => p.tag === 'Sleeper').length, color: '#8b5cf6' },
          { label: 'Avg Confidence', val: '78%', color: '#3b82f6' },
          { label: 'Low Injury Risk', val: PROJECTIONS.filter(p => p.injuryRisk === 'Low').length, color: '#f59e0b' },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {sports.map(sport => (
        <section key={sport} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{sport} Projections</h2>
            <Badge variant="default">Week {new Date().getDay() + 1}</Badge>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Tag</th>
                  <th className="px-4 py-3 text-center">Match</th>
                  <th className="px-4 py-3 text-right">Proj</th>
                  <th className="px-4 py-3 text-right">Floor–Ceil</th>
                  <th className="px-4 py-3 text-right">Own%</th>
                  <th className="px-4 py-3 text-right">Risk</th>
                </tr>
              </thead>
              <tbody>
                {PROJECTIONS.filter(p => p.sport === sport).map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.position} · {p.team}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: TAG_STYLES[p.tag].bg, color: TAG_STYLES[p.tag].color }}>
                        {p.tag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs {p.opponent}</span>
                        <span className="ml-2 text-xs font-bold" style={{ color: GRADE_COLOR[p.matchupGrade] }}>
                          {p.matchupGrade}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{p.projectedPoints.toFixed(1)}</p>
                      <PointsBar val={p.projectedPoints} max={maxPts} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {p.floor}–{p.upside}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{p.ownership}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium" style={{ color: INJURY_COLOR[p.injuryRisk] }}>
                        {p.injuryRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Player notes */}
          <div className="space-y-2">
            {PROJECTIONS.filter(p => p.sport === sport && (p.tag === 'Sleeper' || p.tag === 'Must-Start')).map((p, i) => (
              <div key={i} className="rounded-xl px-4 py-3 flex gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded h-fit"
                  style={{ background: TAG_STYLES[p.tag].bg, color: TAG_STYLES[p.tag].color }}>
                  {p.tag}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({p.position} · {p.team})</span>
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
