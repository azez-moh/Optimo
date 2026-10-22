// Mirrors the chart tokens in tokens.css so recharts and three.js (attribute values) get resolved colours.
// Brand rule: yellow is the single highlight series (slot 0); other series are white / grey steps.
// Slots 4 and 5 (teal, violet) exist for rare cases with more than four series; avoid them where possible.
export type ThemeName = 'light' | 'dark';

export interface ChartTokens {
  series: string[];
  grid: string;
  axis: string;
  baseline: string;
  surface: string;
  text: string;
  textMuted: string;
  seq: string[];
  success: string;
  warning: string;
  danger: string;
  info: string;
  target: string;
  /** Machine / device state colours used by the floor, cameras and tables. */
  state: { inUse: string; idle: string; cooling: string; offline: string };
}

export const chartTokens: Record<ThemeName, ChartTokens> = {
  dark: {
    series: ['#fcea10', '#e6e9e8', '#8f9a97', '#55625f', '#4fa39c', '#9a8fd1'],
    grid: '#18221f',
    axis: '#808684',
    baseline: '#3b4442',
    surface: '#0b1513',
    text: '#ffffff',
    textMuted: '#b8bcbb',
    seq: ['#111c1a', '#26301f', '#3d4520', '#5a5f1d', '#7d7d18', '#a7a214', '#d2c711', '#fcea10'],
    success: '#3d9a6a',
    warning: '#d9962b',
    danger: '#c2453d',
    info: '#7f9c98',
    target: '#ffffff',
    state: { inUse: '#fcea10', idle: '#5b6866', cooling: '#9fb3b0', offline: '#c2453d' },
  },
  light: {
    series: ['#b5a500', '#020c0a', '#6b7270', '#aab0ae', '#2f7e79', '#6e5bb0'],
    grid: '#ececea',
    axis: '#6b6f6e',
    baseline: '#c9cbc9',
    surface: '#ffffff',
    text: '#020c0a',
    textMuted: '#363636',
    seq: ['#f0f0ee', '#f7f3c4', '#f6ec8a', '#f2e14a', '#e0cd12', '#b5a500', '#7a6f00', '#3f3a00'],
    success: '#2f7d55',
    warning: '#b9781a',
    danger: '#b23a32',
    info: '#4f6f6b',
    target: '#020c0a',
    state: { inUse: '#e0cd12', idle: '#aab0ae', cooling: '#6b8f8b', offline: '#b23a32' },
  },
};
