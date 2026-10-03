import React from 'react';
import { UserProfile, AppTab } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { DynamicWellbeingAvatar } from '../common/DynamicWellbeingAvatar';
import { 
  Settings, 
  Menu, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Layers,
  Heart,
  Bot,
  Activity,
  AlertTriangle,
  Camera,
  Compass,
  Utensils,
  BookOpen,
  ListTodo,
  LogOut
} from 'lucide-react';

interface TopBarProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  activeTab: AppTab;
  avatarState?: any;
  onOpenSettings: () => void;
  onOpenMobileMenu: () => void;
  onSelectScenario: (scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue') => void;
  alertCount?: number;
  onLogout?: () => void;
  username?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  onUpdateProfile,
  activeTab,
  avatarState,
  onOpenSettings,
  onOpenMobileMenu,
  onSelectScenario,
  alertCount = 0,
  onLogout,
  username,
}) => {
  // Voice Persona cycling
  const currentPersona = CURATED_VOICE_PERSONAS.find((p) => p.id === (profile.voicePersona || 'samantha')) || CURATED_VOICE_PERSONAS[0];

  const cycleVoicePersona = () => {
    const currentIndex = CURATED_VOICE_PERSONAS.findIndex((p) => p.id === currentPersona.id);
    const nextIndex = (currentIndex + 1) % CURATED_VOICE_PERSONAS.length;
    const nextPersona = CURATED_VOICE_PERSONAS[nextIndex];
    onUpdateProfile({
      ...profile,
      voicePersona: nextPersona.id,
      voiceId: undefined,
    });
    if (profile.soundEnabled) {
      SpeechService.speak(`Voice changed to ${nextPersona.name}.`, profile.voiceSpeed, undefined, nextPersona.id, nextPersona.defaultPitch);
    }
  };

  // Sound toggle
  const toggleSound = () => {
    const nextSound = !profile.soundEnabled;
    onUpdateProfile({ ...profile, soundEnabled: nextSound });
    if (nextSound) {
      SpeechService.speak('Voice assistant audio is active', profile.voiceSpeed);
    }
  };

  // Text Scaling cycle
  const cycleTextScale = () => {
    const scales: ('normal' | 'large' | 'extra-large')[] = ['normal', 'large', 'extra-large'];
    const currentIndex = scales.indexOf(profile.textScale);
    const nextScale = scales[(currentIndex + 1) % scales.length];
    onUpdateProfile({ ...profile, textScale: nextScale });
  };

  // Voice Speed Cycle
  const cycleVoiceSpeed = () => {
    const currentSpeed = profile.voiceSpeed || 1.0;
    const nextSpeed = currentSpeed === 0.85 ? 1.0 : currentSpeed === 1.0 ? 1.25 : 0.85;
    onUpdateProfile({ ...profile, voiceSpeed: nextSpeed });
    if (profile.soundEnabled) {
      SpeechService.speak(
        nextSpeed === 0.85 ? 'Speaking slower for comfort' : nextSpeed === 1.25 ? 'Speaking faster' : 'Normal voice speed',
        nextSpeed
      );
    }
  };

  // Tab Title & Icon mapping
  const getTabInfo = () => {
    switch (activeTab) {
      case 'conversational':
      case 'checkin':
        return { title: 'AI Daily Check-In', subtitle: 'Voice Check-In & Wellbeing Summary', icon: Bot };
      case 'timeline':
      case 'medicine':
        return { title: 'Medications & Vitals', subtitle: 'Prescriptions, BP Log & Vitals', icon: Heart };
      case 'alerts':
        return { title: 'Smart Health Alerts', subtitle: 'Trend & Vital Signs Monitoring', icon: AlertTriangle };
      case 'activities':
        return { title: 'Activities & Exercise', subtitle: 'Walks, Stretches & Fitness Logs', icon: Activity };
      case 'reminders':
        return { title: 'Reminders & Tasks', subtitle: 'Daily Routine & Medication Schedule', icon: ListTodo };
      case 'happenings':
        return { title: 'Bay Area Fun & Outings', subtitle: 'Senior Outings, Low-Salt Dining & Fairs', icon: Compass };
      case 'recipes':
        return { title: 'Healthy Meals & Recipes', subtitle: 'Low-Sodium & Heart-Healthy Cooking', icon: Utensils };
      case 'scanner':
        return { title: 'AI Food Scanner', subtitle: 'Plate Capture, Calories, Carbs & Sodium', icon: Camera };
      case 'assistant':
        return { title: 'Voice & Text AI Assistant', subtitle: 'Linked Medical & Health Companion', icon: BookOpen };
      default:
        return { title: 'Daily Health Check-In', subtitle: 'Senior Care & Wellness Dashboard', icon: Heart };
    }
  };

  const currentTabInfo = getTabInfo();
  const CurrentIcon = currentTabInfo.icon;

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formatSpeedLabel = (speed?: number) => {
    if (!speed || speed < 1.0) return '0.85x Slow';
    if (speed <= 1.0) return '1.0x Normal';
    return '1.25x Fast';
  };

  return (
    <header 
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg text-white transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Mobile hamburger & Active View Heading */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0 cursor-pointer border border-slate-700"
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
                <div className="hidden sm:flex p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                  {currentTabInfo.title}
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{todayFormatted}</span>
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
              <p className="text-xs text-slate-400 font-medium truncate hidden sm:block mt-0.5">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Accessibility Controls & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Demo Data Preset Switcher */}
            <div className="hidden sm:flex items-center bg-slate-950/80 rounded-xl p-0.5 sm:p-1 border border-slate-800">
              <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 flex-shrink-0" />
              <select
                onChange={(e) => onSelectScenario(e.target.value as any)}
                defaultValue="balanced"
                className="bg-transparent text-xs font-bold text-slate-300 py-1 px-1 focus:outline-none cursor-pointer"
                title="Switch demo clinical scenario"
              >
                <option value="balanced" className="bg-slate-900 text-white">Demo: Balanced</option>
                <option value="rising_bp" className="bg-slate-900 text-white">Demo: Rising BP</option>
                <option value="missed_meds" className="bg-slate-900 text-white">Demo: Missed Meds</option>
                <option value="dizziness_fatigue" className="bg-slate-900 text-white">Demo: Dizziness</option>
              </select>
            </div>

            {/* Voice Persona Selector */}
            <button
              onClick={cycleVoicePersona}
              className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl font-bold text-xs border border-indigo-500/30 transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              title={`Active Voice: ${currentPersona.name} (${currentPersona.accent}). Click to change.`}
            >
              <span className="text-sm">{currentPersona.emoji}</span>
              <span className="hidden md:inline text-[11px] text-indigo-400 font-semibold">Voice:</span>
              <span className="truncate max-w-[80px] text-white">{currentPersona.name}</span>
            </button>

            {/* Voice Speed Button */}
            <button
              onClick={cycleVoiceSpeed}
              className="hidden lg:flex px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl font-bold text-xs border border-indigo-500/30 transition-colors items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
              title="Click to adjust talking speed"
            >
              <span className="text-[11px] text-indigo-400 font-semibold">Speed:</span>
              <span className="text-white">{formatSpeedLabel(profile.voiceSpeed).split(' ')[0]}</span>
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={cycleTextScale}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
              title="Change Text Size for Comfort"
            >
              <span className="text-[11px] text-slate-400">Text:</span>
              <span className="capitalize font-black text-white">{profile.textScale === 'extra-large' ? 'XL' : profile.textScale === 'large' ? 'L' : 'M'}</span>
            </button>

            {/* Audio narration mute / unmute */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center shadow-sm cursor-pointer ${
                profile.soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
              title={profile.soundEnabled ? 'Voice assistance enabled' : 'Voice assistance muted'}
            >
              {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm relative cursor-pointer"
              title="Open Settings & Medications"
            >
              <Settings className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {/* User Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors shadow-sm cursor-pointer"
                title={`Logged in as ${username ? `@${username}` : profile.name}. Click to log out.`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
