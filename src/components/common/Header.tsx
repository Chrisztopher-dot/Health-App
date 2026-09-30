import { UserProfile, AppTab } from '../../types/health';
import { 
  Heart, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Settings, 
  Calendar,
  Layers,
  Footprints,
  Bell,
  Compass,
  Utensils,
  Camera
} from 'lucide-react';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
  alertCount: number;
  onSelectScenario: (scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  activeTab,
  setActiveTab,
  onOpenSettings,
  alertCount,
  onSelectScenario,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleSound = () => {
    onUpdateProfile({
      ...profile,
      soundEnabled: !profile.soundEnabled,
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
    if (speed <= 0.75) return '0.75x (Slow)';
    if (speed <= 0.9) return '0.9x (Senior)';
    if (speed <= 1.0) return '1.0x (Normal)';
    return '1.25x (Fast)';
  };

  return (
    <header className="bg-white border-b-2 border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top bar: Greetings & Accessibility controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Greeting & Date */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    Good Morning, {profile.name.split(' ')[0]}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Daily Check-In
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{todayFormatted}</span>
                </p>
              </div>
            </div>

            {/* Mobile quick actions: Sound & Settings */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                  profile.soundEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title={profile.soundEnabled ? 'Voice assistance enabled' : 'Voice assistance muted'}
              >
                {profile.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Accessibility Bar */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-start md:justify-end">
            {/* Demo Data Scenario Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 sm:p-1 border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5 flex-shrink-0" />
              <select
                onChange={(e) => onSelectScenario(e.target.value as any)}
                defaultValue="balanced"
                className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 py-1 px-1.5 focus:outline-none cursor-pointer"
                title="Switch demo history profile"
              >
                <option value="balanced">Demo: Balanced</option>
                <option value="rising_bp">Demo: Rising BP</option>
                <option value="missed_meds">Demo: Missed Meds</option>
                <option value="dizziness_fatigue">Demo: Dizziness</option>
              </select>
            </div>

            {/* Voice Speed Button */}
            <button
              onClick={cycleVoiceSpeed}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl font-bold text-xs sm:text-sm border border-indigo-200 transition-colors flex items-center gap-1 active:scale-95"
              title="Click to adjust voice talking speed"
            >
              <span className="text-[10px] sm:text-xs text-indigo-600 font-semibold">Voice:</span>
              <span>{formatSpeedLabel(profile.voiceSpeed)}</span>
            </button>

            {/* Text Size Switcher */}
            <button
              onClick={cycleTextScale}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs sm:text-sm border border-slate-200 transition-colors flex items-center gap-1 active:scale-95"
              title="Change Text Size"
            >
              <span className="text-[10px] sm:text-xs text-slate-500">Text:</span>
              <span className="capitalize">{profile.textScale}</span>
            </button>

            {/* Desktop-only Sound & Settings */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                  profile.soundEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
                title={profile.soundEnabled ? 'Voice assistance enabled' : 'Voice assistance muted'}
              >
                {profile.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="Open Settings & Medications"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              🔒 AES-256
            </span>
          </div>
        </div>

        {/* Navigation Tabs - 2 Clean Rows for Instant Access Without Horizontal Scrolling */}
        <nav className="space-y-1.5 pt-2">
          {/* Row 1: Core Health & Check-Ins */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'checkin'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500 flex-shrink-0" />
              <span className="hidden sm:inline">Daily Check-In</span>
              <span className="sm:hidden text-[11px] leading-tight">Check-In</span>
            </button>

            <button
              onClick={() => setActiveTab('conversational')}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'conversational'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
              <span className="hidden sm:inline">Voice / Chat</span>
              <span className="sm:hidden text-[11px] leading-tight">Voice AI</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'timeline'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="text-xs sm:text-base flex-shrink-0">📊</span>
              <span className="hidden sm:inline">Health</span>
              <span className="sm:hidden text-[11px] leading-tight">Health</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center relative ${
                activeTab === 'alerts'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="text-xs sm:text-base flex-shrink-0">🔔</span>
              <span className="hidden sm:inline">Alerts</span>
              <span className="sm:hidden text-[11px] leading-tight">Alerts</span>
              {alertCount > 0 && (
                <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.2 rounded-full text-[9px] sm:text-xs font-extrabold bg-rose-500 text-white animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Activities, Reminders, Bay Area Happenings, Healthy Recipes, Food Scanner */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">

            <button
              onClick={() => setActiveTab('activities')}
              className={`px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'activities'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
              <span className="hidden sm:inline">Activities</span>
              <span className="sm:hidden text-[10px] leading-tight">Activities</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'reminders'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
              <span className="hidden sm:inline">Reminders</span>
              <span className="sm:hidden text-[10px] leading-tight">Reminders</span>
            </button>

            <button
              onClick={() => setActiveTab('happenings')}
              className={`px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'happenings'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
              <span className="hidden sm:inline">Bay Area Fun</span>
              <span className="sm:hidden text-[10px] leading-tight">Bay Fun</span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'recipes'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
              <span className="hidden sm:inline">Healthy Food</span>
              <span className="sm:hidden text-[10px] leading-tight">Recipes</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-base transition-all flex items-center justify-center gap-1 sm:gap-2 text-center ${
                activeTab === 'scanner'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
              <span className="hidden sm:inline">AI Scanner</span>
              <span className="sm:hidden text-[10px] leading-tight">Scanner</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
