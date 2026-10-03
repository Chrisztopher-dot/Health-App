import { WellbeingStateCategory, WellbeingTheme, WellbeingAvatarState, UserProfile } from '../types/health';

export const DARK_WELLBEING_THEMES: Record<WellbeingStateCategory, WellbeingTheme> = {
  thriving: {
    id: 'thriving',
    name: 'Vibrant Vitality',
    themeMood: 'Luminous & High Vitality',
    tagline: 'Vibrant energy, optimal vitals & restful sleep',
    primaryColor: 'emerald',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    bgGradient: 'from-emerald-950/30 via-slate-900 to-teal-950/20',
    cardAtmosphere: 'bg-slate-900/90 border-emerald-500/20 shadow-emerald-950/20',
    ambientGlow: 'bg-emerald-500/10',
    ringGlow: 'ring-emerald-400/40 border-emerald-400',
    topBarTint: 'bg-slate-900/95 border-emerald-500/25',
    topBarBorder: 'border-emerald-500/30',
    description: 'Energizing spring-mint and emerald night atmosphere adapted to your high vitality score and stable vitals.',
  },
  good: {
    id: 'good',
    name: 'Ocean Serenity',
    themeMood: 'Balanced & Steady Harmony',
    tagline: 'Healthy vitals, steady routine & good comfort',
    primaryColor: 'teal',
    accentColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/15',
    badgeBorder: 'border-teal-500/30',
    badgeText: 'text-teal-300',
    bgGradient: 'from-teal-950/30 via-slate-900 to-cyan-950/20',
    cardAtmosphere: 'bg-slate-900/90 border-teal-500/20 shadow-teal-950/20',
    ambientGlow: 'bg-teal-500/10',
    ringGlow: 'ring-cyan-400/40 border-cyan-400',
    topBarTint: 'bg-slate-900/95 border-teal-500/25',
    topBarBorder: 'border-teal-500/30',
    description: 'Calming ocean teal and cyan tones adapted to your balanced blood pressure and steady health metrics.',
  },
  okay: {
    id: 'okay',
    name: 'Lavender Twilight',
    themeMood: 'Calm & Soothing Baseline',
    tagline: 'Moderate pace & pleasant daily pauses',
    primaryColor: 'indigo',
    accentColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    bgGradient: 'from-indigo-950/30 via-slate-900 to-slate-950',
    cardAtmosphere: 'bg-slate-900/90 border-indigo-500/20 shadow-indigo-950/20',
    ambientGlow: 'bg-indigo-500/10',
    ringGlow: 'ring-sky-400/40 border-sky-400',
    topBarTint: 'bg-slate-900/95 border-indigo-500/25',
    topBarBorder: 'border-indigo-500/30',
    description: 'Soothing periwinkle and soft indigo night tones providing a calm visual environment for normal daily fluctuations.',
  },
  below_normal: {
    id: 'below_normal',
    name: 'Warm Amber Comfort',
    themeMood: 'Restful Warmth & Low Eye Strain',
    tagline: 'Cozy rest & gentle recuperation',
    primaryColor: 'amber',
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    bgGradient: 'from-amber-950/30 via-slate-900 to-orange-950/20',
    cardAtmosphere: 'bg-slate-900/90 border-amber-500/20 shadow-amber-950/20',
    ambientGlow: 'bg-amber-500/12',
    ringGlow: 'ring-amber-400/40 border-amber-400',
    topBarTint: 'bg-slate-900/95 border-amber-500/25',
    topBarBorder: 'border-amber-500/30',
    description: 'Warm amber and golden peach tones designed with reduced visual contrast to support relaxed rest and comfort.',
  },
  needs_attention: {
    id: 'needs_attention',
    name: 'Supportive Rose Care',
    themeMood: 'Supportive Attention & Hydration',
    tagline: 'Listen to your body & prioritize gentle recovery',
    primaryColor: 'rose',
    accentColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    bgGradient: 'from-rose-950/35 via-slate-900 to-amber-950/25',
    cardAtmosphere: 'bg-slate-900/90 border-rose-500/25 shadow-rose-950/25',
    ambientGlow: 'bg-rose-500/14',
    ringGlow: 'ring-rose-400/50 border-rose-400',
    topBarTint: 'bg-slate-900/95 border-rose-500/25',
    topBarBorder: 'border-rose-500/30',
    description: 'Gentle rose-coral atmosphere indicating that your recent metrics need quiet rest, hydration, and careful attention.',
  },
};

export const LIGHT_WELLBEING_THEMES: Record<WellbeingStateCategory, WellbeingTheme> = {
  thriving: {
    id: 'thriving',
    name: 'Vibrant Vitality (Light)',
    themeMood: 'Bright Spring Vitality',
    tagline: 'Vibrant energy & optimal vitals',
    primaryColor: 'emerald',
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    bgGradient: 'from-emerald-50/70 via-slate-100 to-teal-50/60',
    cardAtmosphere: 'bg-white/95 border-emerald-100 shadow-sm',
    ambientGlow: 'bg-emerald-400/10',
    ringGlow: 'ring-emerald-400/50 border-emerald-400',
    topBarTint: 'bg-white/95 border-emerald-200',
    topBarBorder: 'border-emerald-200',
    description: 'Bright spring-mint and emerald light atmosphere adapted to your high vitality score.',
  },
  good: {
    id: 'good',
    name: 'Ocean Serenity (Light)',
    themeMood: 'Balanced & Steady Harmony',
    tagline: 'Healthy vitals & steady routine',
    primaryColor: 'teal',
    accentColor: 'text-teal-700',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-800',
    bgGradient: 'from-teal-50/70 via-slate-100 to-cyan-50/60',
    cardAtmosphere: 'bg-white/95 border-teal-100 shadow-sm',
    ambientGlow: 'bg-teal-400/10',
    ringGlow: 'ring-cyan-400/50 border-cyan-400',
    topBarTint: 'bg-white/95 border-teal-200',
    topBarBorder: 'border-teal-200',
    description: 'Calming ocean teal and cyan tones adapted to your balanced vitals and steady health metrics.',
  },
  okay: {
    id: 'okay',
    name: 'Lavender Twilight (Light)',
    themeMood: 'Calm Daytime Baseline',
    tagline: 'Moderate pace & pleasant daily pauses',
    primaryColor: 'indigo',
    accentColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-800',
    bgGradient: 'from-indigo-50/60 via-slate-100 to-slate-50',
    cardAtmosphere: 'bg-white/95 border-indigo-100 shadow-sm',
    ambientGlow: 'bg-indigo-400/10',
    ringGlow: 'ring-sky-400/50 border-sky-400',
    topBarTint: 'bg-white/95 border-indigo-200',
    topBarBorder: 'border-indigo-200',
    description: 'Soft lavender daytime atmosphere providing a calm visual environment for normal daily fluctuations.',
  },
  below_normal: {
    id: 'below_normal',
    name: 'Warm Amber Comfort (Light)',
    themeMood: 'Restful Warmth & Low Eye Strain',
    tagline: 'Cozy rest & gentle recuperation',
    primaryColor: 'amber',
    accentColor: 'text-amber-800',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-900',
    bgGradient: 'from-amber-50/70 via-slate-100 to-orange-50/50',
    cardAtmosphere: 'bg-white/95 border-amber-100 shadow-sm',
    ambientGlow: 'bg-amber-400/12',
    ringGlow: 'ring-amber-400/50 border-amber-400',
    topBarTint: 'bg-white/95 border-amber-200',
    topBarBorder: 'border-amber-200',
    description: 'Warm amber and golden peach light tones designed with low glare to support relaxed rest and comfort.',
  },
  needs_attention: {
    id: 'needs_attention',
    name: 'Supportive Rose Care (Light)',
    themeMood: 'Supportive Attention & Hydration',
    tagline: 'Listen to your body & prioritize gentle recovery',
    primaryColor: 'rose',
    accentColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-900',
    bgGradient: 'from-rose-50/70 via-slate-100 to-amber-50/50',
    cardAtmosphere: 'bg-white/95 border-rose-100 shadow-sm',
    ambientGlow: 'bg-rose-400/14',
    ringGlow: 'ring-rose-400/50 border-rose-400',
    topBarTint: 'bg-white/95 border-rose-200',
    topBarBorder: 'border-rose-200',
    description: 'Gentle rose-coral light atmosphere indicating that your recent metrics need quiet rest and careful attention.',
  },
};

export class ThemeService {
  /**
   * Resolves whether Dark / Night mode should be active based on user profile and system mode (OS preference).
   * Default is 'system' mode.
   */
  public static resolveIsDarkMode(themeMode: 'system' | 'dark' | 'light' = 'system'): boolean {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;

    // 'system' mode: detects OS daylight/night dark mode preference automatically
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default fallback to night/dark theme
  }

  public static getThemeForCategory(
    category: WellbeingStateCategory,
    isDark: boolean = true
  ): WellbeingTheme {
    const table = isDark ? DARK_WELLBEING_THEMES : LIGHT_WELLBEING_THEMES;
    return table[category] || table.good;
  }

  public static getThemeForAvatarState(
    avatarState?: WellbeingAvatarState,
    profile?: UserProfile
  ): WellbeingTheme {
    const isDark = this.resolveIsDarkMode(profile?.themeMode || 'system');
    if (!avatarState) return this.getThemeForCategory('good', isDark);
    return this.getThemeForCategory(avatarState.category, isDark);
  }
}
