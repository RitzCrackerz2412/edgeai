/**
 * Prediction Simulator variable configs per game.
 * `effectDelta` is a linear approximation of change to homeWinProb (0–1 scale).
 * Replace with actual ML model re-inference calls when the engine supports it.
 * Positive = helps home team; negative = hurts home team.
 */

export interface SimVariable {
  id: string;
  label: string;
  type: 'toggle' | 'slider';
  category: 'player' | 'environment' | 'tactical' | 'fatigue';
  description: string;
  // For toggles: effectDelta applied when enabled = true
  effectDelta?: number;
  // For sliders: value range and per-unit effect
  sliderMin?: number;
  sliderMax?: number;
  sliderDefault?: number;
  sliderLabel?: string;
  sliderEffectPerUnit?: number; // delta per unit from default
  defaultEnabled?: boolean;
}

export interface GameSimConfig {
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  baseHomeWinProb: number; // from game.prediction.winProbability (if winner is home)
  variables: SimVariable[];
}

export const GAME_SIM_CONFIGS: Record<string, GameSimConfig> = {
  'nfl-001': {
    gameId: 'nfl-001',
    homeTeamName: 'Kansas City Chiefs',
    awayTeamName: 'Buffalo Bills',
    baseHomeWinProb: 68.4,
    variables: [
      {
        id: 'remove_mahomes',
        label: 'Remove Mahomes',
        type: 'toggle',
        category: 'player',
        description: 'Patrick Mahomes ruled out — backup QB starts',
        effectDelta: -35.0,
        defaultEnabled: false,
      },
      {
        id: 'remove_kelce',
        label: 'Remove Kelce',
        type: 'toggle',
        category: 'player',
        description: 'Travis Kelce unavailable — removes primary red zone threat',
        effectDelta: -11.0,
        defaultEnabled: false,
      },
      {
        id: 'blizzard',
        label: 'Blizzard conditions',
        type: 'toggle',
        category: 'environment',
        description: 'Temperature <20°F with 25mph wind — Bills thrive in extreme cold',
        effectDelta: -9.0,
        defaultEnabled: false,
      },
      {
        id: 'pacheco_active',
        label: 'Pacheco Active',
        type: 'toggle',
        category: 'player',
        description: 'Isiah Pacheco fully healthy and in starting lineup',
        effectDelta: 5.0,
        defaultEnabled: false,
      },
      {
        id: 'kc_oline',
        label: 'KC OLine Health',
        type: 'slider',
        category: 'tactical',
        description: 'Chiefs offensive line pass protection grade for this game',
        sliderMin: 0, sliderMax: 100, sliderDefault: 50,
        sliderLabel: 'Grade',
        sliderEffectPerUnit: 0.12,
      },
      {
        id: 'buf_pass_rush',
        label: 'BUF Pass Rush Intensity',
        type: 'slider',
        category: 'tactical',
        description: 'How aggressively Buffalo sends extra rushers on passing downs',
        sliderMin: 0, sliderMax: 100, sliderDefault: 50,
        sliderLabel: 'Intensity',
        sliderEffectPerUnit: -0.10,
      },
    ],
  },

  'nba-001': {
    gameId: 'nba-001',
    homeTeamName: 'Boston Celtics',
    awayTeamName: 'Los Angeles Lakers',
    baseHomeWinProb: 74.2,
    variables: [
      {
        id: 'remove_tatum',
        label: 'Remove Tatum',
        type: 'toggle',
        category: 'player',
        description: 'Jayson Tatum ruled out — major offensive loss for Boston',
        effectDelta: -29.0,
        defaultEnabled: false,
      },
      {
        id: 'porzingis_out',
        label: 'Porzingis Out',
        type: 'toggle',
        category: 'player',
        description: 'Kristaps Porzingis does not play — reduces rim protection and spacing',
        effectDelta: -8.0,
        defaultEnabled: false,
      },
      {
        id: 'no_back_to_back',
        label: 'No Back-to-Back',
        type: 'toggle',
        category: 'fatigue',
        description: 'Boston gets an extra rest day — removes back-to-back fatigue penalty',
        effectDelta: 6.0,
        defaultEnabled: false,
      },
      {
        id: 'lebron_limited',
        label: 'LeBron Minute-Managed',
        type: 'toggle',
        category: 'player',
        description: 'Lakers limit LeBron to <32 minutes — reduces away team threat',
        effectDelta: 7.0,
        defaultEnabled: false,
      },
      {
        id: 'bos_3pt',
        label: 'BOS 3PT Temperature',
        type: 'slider',
        category: 'tactical',
        description: 'How hot Boston\'s three-point shooting is (affects spacing and scoring)',
        sliderMin: 0, sliderMax: 100, sliderDefault: 65,
        sliderLabel: 'Hot',
        sliderEffectPerUnit: 0.09,
      },
      {
        id: 'lal_transition',
        label: 'LAL Transition Offense',
        type: 'slider',
        category: 'tactical',
        description: 'Lakers transition scoring rate — fast pace hurts Boston\'s halfcourt defense',
        sliderMin: 0, sliderMax: 100, sliderDefault: 45,
        sliderLabel: 'Rate',
        sliderEffectPerUnit: -0.08,
      },
    ],
  },

  'mlb-001': {
    gameId: 'mlb-001',
    homeTeamName: 'New York Yankees',
    awayTeamName: 'Houston Astros',
    baseHomeWinProb: 58.3,
    variables: [
      {
        id: 'cole_scratched',
        label: 'Gerrit Cole Scratched',
        type: 'toggle',
        category: 'player',
        description: 'Cole unavailable — backup starter with 4.2+ ERA takes the mound',
        effectDelta: -22.0,
        defaultEnabled: false,
      },
      {
        id: 'rain_delay',
        label: 'Rain + wet outfield',
        type: 'toggle',
        category: 'environment',
        description: 'Wet conditions reduce power game and slow the outfield',
        effectDelta: -4.0,
        defaultEnabled: false,
      },
      {
        id: 'bullpen_fresh',
        label: 'Yankees Bullpen Fully Fresh',
        type: 'toggle',
        category: 'fatigue',
        description: 'All key NYY relievers available with 2+ days rest',
        effectDelta: 7.0,
        defaultEnabled: false,
      },
      {
        id: 'nyy_lineup',
        label: 'NYY Power Hitting Form',
        type: 'slider',
        category: 'tactical',
        description: 'How well the Yankees power hitters are connecting vs right-handers',
        sliderMin: 0, sliderMax: 100, sliderDefault: 55,
        sliderLabel: 'Hot',
        sliderEffectPerUnit: 0.10,
      },
      {
        id: 'cole_pitch_count',
        label: 'Cole Pitch Count Limit',
        type: 'slider',
        category: 'tactical',
        description: 'How long Cole pitches before being pulled (affects bullpen exposure)',
        sliderMin: 60, sliderMax: 110, sliderDefault: 90,
        sliderLabel: 'Pitches',
        sliderEffectPerUnit: 0.08,
      },
    ],
  },

  'nhl-001': {
    gameId: 'nhl-001',
    homeTeamName: 'Colorado Avalanche',
    awayTeamName: 'Toronto Maple Leafs',
    baseHomeWinProb: 64.8,
    variables: [
      {
        id: 'mackinnon_limited',
        label: 'MacKinnon Injured',
        type: 'toggle',
        category: 'player',
        description: 'Nathan MacKinnon limited to 15min — removes top offensive weapon',
        effectDelta: -24.0,
        defaultEnabled: false,
      },
      {
        id: 'tor_rested',
        label: 'Toronto Fully Rested',
        type: 'toggle',
        category: 'fatigue',
        description: 'Remove back-to-back disadvantage — Toronto played last night',
        effectDelta: -5.0,
        defaultEnabled: false,
      },
      {
        id: 'altitude_adjust',
        label: 'Visitors Altitude-Acclimated',
        type: 'toggle',
        category: 'environment',
        description: 'Toronto arrived early and adjusted to 5,280ft — reduces altitude edge',
        effectDelta: -6.0,
        defaultEnabled: false,
      },
      {
        id: 'tor_powerplay',
        label: 'TOR Powerplay Efficiency',
        type: 'slider',
        category: 'tactical',
        description: 'Toronto powerplay success rate — elite PP can overcome even advantages',
        sliderMin: 0, sliderMax: 100, sliderDefault: 50,
        sliderLabel: '%',
        sliderEffectPerUnit: -0.09,
      },
    ],
  },

  'soccer-001': {
    gameId: 'soccer-001',
    homeTeamName: 'Manchester City',
    awayTeamName: 'Arsenal',
    baseHomeWinProb: 64.1,
    variables: [
      {
        id: 'haaland_out',
        label: 'Haaland Out',
        type: 'toggle',
        category: 'player',
        description: 'Erling Haaland unavailable — removes primary goal threat (8 goals vs Arsenal)',
        effectDelta: -18.0,
        defaultEnabled: false,
      },
      {
        id: 'saliba_returns',
        label: 'Saliba Returns',
        type: 'toggle',
        category: 'player',
        description: 'Arsenal\'s suspended CB returns — fixes key defensive vulnerability',
        effectDelta: -10.0,
        defaultEnabled: false,
      },
      {
        id: 'rodri_fit',
        label: 'Rodri Fully Fit',
        type: 'toggle',
        category: 'player',
        description: 'Rodri starts at 100% — solves City\'s midfield control question',
        effectDelta: 7.0,
        defaultEnabled: false,
      },
      {
        id: 'city_possession',
        label: 'City Possession Control',
        type: 'slider',
        category: 'tactical',
        description: 'Percentage of ball possession — higher possession reduces Arsenal counter chance',
        sliderMin: 45, sliderMax: 75, sliderDefault: 62,
        sliderLabel: '%',
        sliderEffectPerUnit: 0.11,
      },
      {
        id: 'ars_counter',
        label: 'Arsenal Counter-Attack',
        type: 'slider',
        category: 'tactical',
        description: 'Arsenal transition speed and conversion rate on counter-attacks',
        sliderMin: 0, sliderMax: 100, sliderDefault: 50,
        sliderLabel: 'Threat',
        sliderEffectPerUnit: -0.10,
      },
    ],
  },

  'ufc-001': {
    gameId: 'ufc-001',
    homeTeamName: 'Jon Jones',
    awayTeamName: 'Stipe Miocic',
    baseHomeWinProb: 79.3,
    variables: [
      {
        id: 'jones_ring_rust',
        label: 'Jones Ring Rust',
        type: 'toggle',
        category: 'fatigue',
        description: 'Amplify inactivity penalty — 18 months off showing in early rounds',
        effectDelta: -12.0,
        defaultEnabled: false,
      },
      {
        id: 'stipe_cardio',
        label: 'Stipe Peak Cardio',
        type: 'toggle',
        category: 'player',
        description: 'Stipe comes in at peak cardiovascular conditioning — thrives in late rounds',
        effectDelta: -8.0,
        defaultEnabled: false,
      },
      {
        id: 'jones_wrestle',
        label: 'Jones Wrestling',
        type: 'slider',
        category: 'tactical',
        description: 'How much Jones uses wrestling to neutralize Stipe\'s boxing',
        sliderMin: 0, sliderMax: 100, sliderDefault: 70,
        sliderLabel: 'Usage',
        sliderEffectPerUnit: 0.14,
      },
      {
        id: 'standup_game',
        label: 'Standup Exchange Rate',
        type: 'slider',
        category: 'tactical',
        description: 'How much the fight stays on the feet — more standup favors Stipe',
        sliderMin: 0, sliderMax: 100, sliderDefault: 30,
        sliderLabel: 'Standing',
        sliderEffectPerUnit: -0.13,
      },
    ],
  },
};
