import React from 'react';
import { UserProfile, AppTab, WellbeingAvatarState } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { DynamicWellbeingAvatar } from '../common/DynamicWellbeingAvatar';
import { 
  Menu, 
  Volume2, 
  VolumeX, 
  Settings, 
  Layers, 
  Calendar, 
  Sparkles, 
  Activity, 
  Bell, 
  Footprints, 
  CalendarClock, 
  Utensils, 
  Camera, 
  Compass,
  Bot
} from 'lucide-react';

interface TopBarProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  activeTab: AppTab;
  avatarState?: WellbeingAvatarState;
  onOpenSettings: () => void;
  onOpenMobileMenu: () => void;
  onSelectScenario: (scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue') => void;
  alertCount: number;
}

const TAB_TITLES: Record<AppTab, { title: string; subtitle: string; icon: React.ElementType }> = {
  checkin: {
    title: 'Daily Wellness Check-In',
    subtitle: 'Track your mood, vitals, blood pressure, and morning medications',
    icon: Sparkles,
  },
  conversational: {
    title: 'AI Check-In',
    subtitle: 'Talk or type to record your daily check-in and access instant health answers',
    icon: Sparkles,
  },
  timeline: {
    title: 'Vitals & Medication Adherence',
    subtitle: 'Interactive charts, 30-day blood pressure trends, and medication schedules',
    icon: Activity,
  },
  alerts: {
    title: 'Smart Clinical Risk Alerts',
    subtitle: 'Automated AI monitoring for blood pressure trends and medication gaps',
    icon: Bell,
  },
  medicine: {
    title: 'Medication Tracker',
    subtitle: 'Manage prescription schedule and daily adherence logs',
    icon: Activity,
  },
  activities: {
    title: 'Physical Activity & Longevity',
    subtitle: 'Log walks, nature hikes, pickleball, stretching, and daily vitality',
    icon: Footprints,
  },
  reminders: {
    title: 'Reminders & Daily Tasks',
    subtitle: 'Keep track of doctor visits, prescription refills, and family calls',
    icon: CalendarClock,
  },
  recipes: {
    title: 'Healthy Meals & Low-Sodium Recipes',
    subtitle: 'Delicious senior-friendly, heart-healthy and low-glycemic recipes',
    icon: Utensils,
  },
  scanner: {
    title: 'AI Food & Dining Out Scanner',
    subtitle: 'Analyze meal photos or restaurant items for sodium, carbs, and blood pressure safety',
    icon: Camera,
  },
  happenings: {
    title: 'Bay Area Fun & Community Events',
    subtitle: 'Curated senior-friendly outdoor activities, cultural events, and festivals',
    icon: Compass,
  },
  assistant: {
    title: 'Voice & Text AI Assistant',
    subtitle: 'Hands-free voice speaker or text chat with linked access to all medical, food, and vitals data',
    icon: Bot,
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  onUpdateProfile,
  activeTab,
  avatarState,
  onOpenSettings,
  onOpenMobileMenu,
  onSelectScenario,
  alertCount,
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.checkin;
  const CurrentIcon = currentTabInfo.icon;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const currentPersona = CURATED_VOICE_PERSONAS.find((p) => p.id === (profile.voicePersona || 'samantha')) || CURATED_VOICE_PERSONAS[0];

  const cycleVoicePersona = () => {
    const personas = CURATED_VOICE_PERSONAS;
    const currentIndex = personas.findIndex((p) => p.id === (profile.voicePersona || 'samantha'));
    const nextPersona = personas[(currentIndex + 1) % personas.length];
    onUpdateProfile({
      ...profile,
      voicePersona: nextPersona.id,
      voiceId: undefined,
    });
    if (profile.soundEnabled) {
      SpeechService.speak(`Voice changed to ${nextPersona.name}`, profile.voiceSpeed, undefined, nextPersona.id, nextPersona.defaultPitch);
    }
  };

  const toggleSound = () => {
    const newSound = !profile.soundEnabled;
    if (profile.soundEnabled) {
      SpeechService.stopSpeaking();
    }
    onUpdateProfile({
      ...profile,
      soundEnabled: newSound,
    });
  };

  const cycleTextScale = () => {
    const nextScale: Record<UserProfile['textScale'], UserProfile['textScale']> = {
      normal: 'large',
      large: 'extra-large',
      'extra-large': 'normal',
    };
    onUpdateProfile({
      ...profile,
      textScale: nextScale[profile.textScale],
    });
  };

  const cycleVoiceSpeed = () => {
    const speeds = [0.75, 0.9, 1.0, 1.25];
    const currentIndex = speeds.findIndex((s) => Math.abs(s - profile.voiceSpeed) < 0.05);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    onUpdateProfile({
      ...profile,
      voiceSpeed: nextSpeed,
    });
  };

  const formatSpeedLabel = (speed: number) => {
    if (speed <= 0.75) return '0.75x Slow';
    if (speed <= 0.9) return '0.9x Senior';
    if (speed <= 1.0) return '1.0x Normal';
    return '1.25x Fast';
  };

  return (
    <header 
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Mobile hamburger & Active View Heading */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Wellbeing Avatar Trigger */}
            {avatarState && (
              <div className="md:hidden flex items-center flex-shrink-0">
                <DynamicWellbeingAvatar
                  avatarState={avatarState}
                  size="sm"
                  showLabel={false}
                />
              </div>
            )}

            {/* View Title & Breadcrumb */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex-shrink-0">
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  {currentTabInfo.title}
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  {todayFormatted}
                </span>

                {/* Desktop Wellbeing Avatar Mood Indicator */}
                {avatarState && (
                  <div className="hidden xl:flex items-center ml-1">
                    <DynamicWellbeingAvatar
                      avatarState={avatarState}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate hidden sm:block mt-0.5">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Accessibility Controls & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Demo Data Preset Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-0.5 sm:p-1 border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5 flex-shrink-0" />
              <select
                onChange={(e) => onSelectScenario(e.target.value as any)}
                defaultValue="balanced"
                className="bg-transparent text-xs font-bold text-slate-700 py-1 px-1 focus:outline-none cursor-pointer"
                title="Switch demo clinical scenario"
              >
                <option value="balanced">Demo: Balanced</option>
                <option value="rising_bp">Demo: Rising BP</option>
                <option value="missed_meds">Demo: Missed Meds</option>
                <option value="dizziness_fatigue">Demo: Dizziness</option>
              </select>
            </div>

            {/* Voice Persona Selector */}
            <button
              onClick={cycleVoicePersona}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl font-bold text-xs border border-indigo-200 transition-colors flex items-center gap-1.5 active:scale-95 shadow-xs"
              title={`Active Voice: ${currentPersona.name} (${currentPersona.accent}). Click to change.`}
            >
              <span className="text-sm">{currentPersona.emoji}</span>
              <span className="hidden md:inline text-[11px] text-indigo-600 font-semibold">Voice:</span>
              <span className="truncate max-w-[80px]">{currentPersona.name}</span>
            </button>

            {/* Voice Speed Button */}
            <button
              onClick={cycleVoiceSpeed}
              className="hidden lg:flex px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl font-bold text-xs border border-indigo-200 transition-colors items-center gap-1 active:scale-95 shadow-xs"
              title="Click to adjust talking speed"
            >
              <span className="text-[11px] text-indigo-600 font-semibold">Speed:</span>
              <span>{formatSpeedLabel(profile.voiceSpeed).split(' ')[0]}</span>
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={cycleTextScale}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1 active:scale-95 shadow-xs"
              title="Change Text Size for Comfort"
            >
              <span className="text-[11px] text-slate-500">Text:</span>
              <span className="capitalize font-black">{profile.textScale === 'extra-large' ? 'XL' : profile.textScale === 'large' ? 'L' : 'M'}</span>
            </button>

            {/* Audio narration mute / unmute */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center shadow-xs ${
                profile.soundEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
              title={profile.soundEnabled ? 'Voice assistance enabled' : 'Voice assistance muted'}
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-xs relative"
              title="Open Settings & Medications"
            >
              <Settings className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
