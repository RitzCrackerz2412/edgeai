import { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Draft & Prospect Analysis' };

interface Prospect {
  rank: number;
  name: string;
  position: string;
  school: string;
  sport: 'NFL' | 'NBA' | 'MLB';
  age: number;
  height: string;
  weight: string;
  projection: string;
  grade: number;   // 1–100
  ceil: 'Superstar' | 'Star' | 'Starter' | 'Backup';
  strengths: string[];
  concerns: string[];
  comps: string;
  aiNote: string;
}

const PROSPECTS: Prospect[] = [
  {
    rank: 1, name: 'Caleb Williams', position: 'QB', school: 'USC', sport: 'NFL', age: 22, height: "6'1\"", weight: '214 lbs',
    projection: 'Top-5 pick', grade: 95, ceil: 'Superstar',
    strengths: ['Elite arm talent', 'Improvisation under pressure', 'Touch on deep ball', '65+ TD seasons at USC'],
    concerns: ['NFL scheme fit vs college offense', 'Pocket presence in pro game'],
    comps: 'Patrick Mahomes / Jalen Hurts',
    aiNote: 'The model rates Williams as the highest-floor QB prospect in this class. His improvisation metrics in 3rd-and-long situations (79% conversion rate) are historically elite. Risk: USC\'s air raid system shields some weaknesses that NFL defensive coordinators will expose early.',
  },
  {
    rank: 2, name: 'Marvin Harrison Jr.', position: 'WR', school: 'Ohio State', sport: 'NFL', age: 21, height: "6'3\"", weight: '205 lbs',
    projection: 'Top-3 pick', grade: 97, ceil: 'Superstar',
    strengths: ['Elite route running', '4.38s 40-yard dash', 'Hand-eye coordination', 'Physical at point of catch'],
    concerns: ['Limited contested catch history vs physical CBs', 'Weight (may need to add)'],
    comps: 'Jerry Rice / A.J. Green',
    aiNote: 'Harrison\'s route-running efficiency at separation (avg 3.1 yards per route run) is generational. The model projects him as the 2nd-best receiver to enter the NFL in the last decade. His YAC numbers would increase significantly in a spread offense.',
  },
  {
    rank: 3, name: 'Cooper Flagg', position: 'PF/C', school: 'Duke', sport: 'NBA', age: 18, height: "6'9\"", weight: '220 lbs',
    projection: '#1 overall pick', grade: 99, ceil: 'Superstar',
    strengths: ['Versatile defender', 'NBA-ready motor', 'Passing IQ', 'Two-way impact'],
    concerns: ['Offensive creation off the dribble still developing', 'Jump shot consistency at the NBA arc'],
    comps: 'Kevin Durant / Jayson Tatum',
    aiNote: 'Flagg\'s defensive versatility — capable of guarding all 5 positions at Duke — is historically rare for a prospect his age. The model flags his secondary creation metrics as a gap that will take 2-3 seasons to develop. His transition offense numbers (8.4 pts per 36) are already professional-quality.',
  },
  {
    rank: 4, name: 'Dylan Crews', position: 'CF', school: 'LSU', sport: 'MLB', age: 22, height: "6'0\"", weight: '198 lbs',
    projection: 'Top-2 overall', grade: 93, ceil: 'Star',
    strengths: ['Elite contact rate', '25+ homer upside', 'Above-avg speed (28 sb)', 'Advanced plate discipline'],
    concerns: ['Pull-heavy approach may limit BA vs elite starters', 'Below-avg arm strength for center field'],
    comps: 'Mike Trout / Ronald Acuña Jr.',
    aiNote: 'Crews\' .410 xBA against 90+ mph fastballs is the highest of any draft-eligible prospect in the last 5 seasons. The model projects a .285/.385/.510 slash line in Year 3. His defensive range in center grades well; arm strength is a latent concern for deep outfield throws.',
  },
  {
    rank: 5, name: 'Malik Nabers', position: 'WR', school: 'LSU', sport: 'NFL', age: 21, height: "6'0\"", weight: '200 lbs',
    projection: 'Top-10 pick', grade: 91, ceil: 'Star',
    strengths: ['YAC monster (8.2 avg after catch)', 'Contested catch artist', 'Slot versatility', 'Route polish'],
    concerns: ['NFL size (needs to add weight)', 'Injury history (hamstring, 2023)'],
    comps: 'DeVonta Smith / Stefon Diggs',
    aiNote: 'Nabers is the best YAC receiver in this class. His ability to turn 5-yard passes into 15-yard gains (.38 elusive rating) matches top-tier NFL slot receivers in the current environment. Concern: his size may limit him in contested red zone situations where his college production was built on scheme separation rather than physical dominance.',
  },
  {
    rank: 6, name: 'Alexandr Vezenkov', position: 'PF/SF', school: 'Europe (Olympiacos)', sport: 'NBA', age: 28, height: "6'9\"", weight: '225 lbs',
    projection: 'Mid-1st round', grade: 83, ceil: 'Starter',
    strengths: ['Elite European 3-point shooter (41.3%)', 'High basketball IQ', 'NBA-caliber finishing around rim'],
    concerns: ['Age (28) limits upside ceiling', 'Athleticism not elite by NBA standards', 'Full transition to NBA role still unclear'],
    comps: 'Nikola Mirotic / Bojan Bogdanovic',
    aiNote: 'Vezenkov\'s shooting efficiency in Euroleague translates well historically (r=0.71 correlation between top Euro shooters and NBA 3P%). His floor-spacing ability makes him immediately deployable alongside most current NBA rosters. The model flags that his peak value is present-tense rather than future upside.',
  },
];

const CEIL_COLORS: Record<string, string> = {
  Superstar: '#f59e0b',
  Star:      '#3b82f6',
  Starter:   '#10b981',
  Backup:    '#6b7280',
};

function GradeCircle({ grade }: { grade: number }) {
  const color = grade >= 95 ? '#f59e0b' : grade >= 88 ? '#3b82f6' : grade >= 80 ? '#10b981' : '#6b7280';
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
      style={{ background: `${color}18`, border: `2px solid ${color}`, color }}>
      {grade}
    </div>
  );
}

export default function DraftPage() {
  const sports = ['NFL', 'NBA', 'MLB'] as const;
  const bySport = sports.reduce<Record<string, Prospect[]>>((acc, s) => {
    acc[s] = PROSPECTS.filter(p => p.sport === s);
    return acc;
  }, {});

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-12" style={{ color: 'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-bold">Draft & Prospect Analysis</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          AI-powered prospect profiles with athletic testing, college statistics, and historical comparables
        </p>
      </div>

      {sports.map(sport => (
        <section key={sport} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{sport} Draft</h2>
            <Badge variant="default">{bySport[sport].length} prospects</Badge>
          </div>

          <div className="space-y-4">
            {bySport[sport].map(p => (
              <div key={p.rank} className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>

                {/* Header row */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                    #{p.rank}
                  </div>
                  <GradeCircle grade={p.grade} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold">{p.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>{p.position}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${CEIL_COLORS[p.ceil]}18`, color: CEIL_COLORS[p.ceil] }}>
                        {p.ceil}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {p.school} · Age {p.age} · {p.height} / {p.weight} · {p.projection}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Comp</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{p.comps}</p>
                  </div>
                </div>

                {/* Strengths / Concerns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>Strengths</p>
                    <ul className="space-y-1">
                      {p.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: '#10b981' }}>+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>Concerns</p>
                    <ul className="space-y-1">
                      {p.concerns.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: '#f59e0b' }}>△</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Note */}
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>AI Analysis</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.aiNote}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
