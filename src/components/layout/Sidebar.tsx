import React from 'react';
import { AppTab, UserProfile, WellbeingAvatarState } from '../../types/health';
import { DynamicWellbeingAvatar } from '../common/DynamicWellbeingAvatar';
import { 
  Sparkles, 
  Activity, 
  Bell, 
  Footprints, 
  CalendarClock, 
  Utensils, 
  Camera, 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Sliders,
  Bot
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  profile: UserProfile;
  alertCount: number;
  isTodayDone: boolean;
  avatarState?: WellbeingAvatarState;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

interface NavItem {
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  accentColor: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  alertCount,
  isTodayDone,
  avatarState,
  onOpenSettings,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const currentAvatarState = avatarState || {
    category: 'good',
    score: 80,
    label: 'Balanced & Steady',
    emoji: '😊',
    bgGradient: 'from-emerald-500 to-teal-400',
    ringColor: 'border-emerald-400 ring-emerald-400/40',
    statusMessage: 'Vitals and health indicators are in a steady balance.',
    prolongedBelowNormal: false,
    prolongedDaysCount: 0,
    averageMood: 'good',
    averageEnergy: 7.5,
    averageSleep: 7.5,
    recommendation: 'Stay hydrated and enjoy your daily routine.',
  };
  const userFirstName = profile.name ? profile.name.trim().split(' ')[0] : 'friend';
  const navSections: NavSection[] = [
    {
      title: `Good to see you again ${userFirstName}`,
      items: [
        {
          id: 'conversational',
          label: 'AI Check-In',
          shortLabel: 'AI Check-In',
          icon: Sparkles,
          badge: isTodayDone ? 'Done ✓' : 'Today',
          badgeColor: isTodayDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500 text-white font-black',
          accentColor: 'text-amber-400',
        },
        {
          id: 'scanner',
          label: 'AI Food Scanner',
          shortLabel: 'Scanner',
          icon: Camera,
          badge: 'AI',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          accentColor: 'text-cyan-400',
        },
        {
          id: 'activities',
          label: 'Physical Activities',
          shortLabel: 'Activities',
          icon: Footprints,
          accentColor: 'text-teal-400',
        },
        {
          id: 'reminders',
          label: 'Reminders & Tasks',
          shortLabel: 'Reminders',
          icon: CalendarClock,
          accentColor: 'text-indigo-400',
        },
        {
          id: 'assistant',
          label: 'Voice & Text Assistant',
          shortLabel: 'Voice & Text',
          icon: Bot,
          badge: 'Live AI',
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
          accentColor: 'text-purple-400',
        },
      ],
    },
    {
      title: 'Clinical & Vitals',
      items: [
        {
          id: 'timeline',
          label: 'Vitals & Medications',
          shortLabel: 'Vitals',
          icon: Activity,
          accentColor: 'text-blue-400',
        },
        {
          id: 'alerts',
          label: 'Smart Health Alerts',
          shortLabel: 'Alerts',
          icon: Bell,
          badge: alertCount > 0 ? alertCount : undefined,
          badgeColor: 'bg-rose-500 text-white font-extrabold animate-pulse',
          accentColor: 'text-rose-400',
        },
      ],
    },
    {
      title: 'Health',
      items: [
        {
          id: 'recipes',
          label: 'Healthy Meals & Recipes',
          shortLabel: 'Recipes',
          icon: Utensils,
          accentColor: 'text-emerald-400',
        },
        {
          id: 'happenings',
          label: 'Bay Area Happenings',
          shortLabel: 'Events',
          icon: Compass,
          accentColor: 'text-amber-400',
        },
      ],
    },
  ];

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header with Dynamic Wellbeing Avatar */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
        <DynamicWellbeingAvatar
          avatarState={currentAvatarState}
          isCollapsed={isCollapsed}
          size="md"
        />

        {/* Desktop Collapse / Expand Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[11px] font-extrabold tracking-wide text-slate-400/90">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'timeline' && activeTab === 'medicine');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-2xl font-bold text-sm transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-xl ${isActive ? 'bg-white/20 text-white' : `bg-slate-800/70 ${item.accentColor} group-hover:bg-slate-750`}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isCollapsed && (
                        <span className="truncate font-semibold tracking-tight">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed active indicator bar */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Profile & Privacy Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="space-y-2.5">
            {/* User Profile Pill */}
            <div 
              onClick={onOpenSettings}
              className="flex items-center justify-between p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-inner">
                  {profile.name.charAt(0)}
                </div>
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-extrabold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Age {profile.age} • Settings
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="p-1.5 rounded-lg text-slate-400 group-hover:text-white hover:bg-slate-700"
                title="Open Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy Badge */}
            <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 Encrypted • Local SQLite</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-extrabold text-xs transition-colors"
              title={`Profile: ${profile.name} (Click for Settings)`}
            >
              {profile.name.charAt(0)}
            </button>
            <div title="AES-256 Encrypted & Local Storage">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          />
          <aside 
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
            className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 text-slate-200 shadow-2xl z-10 animate-slideRight flex flex-col h-full"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
