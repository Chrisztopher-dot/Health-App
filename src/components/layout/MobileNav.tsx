import React, { useState } from 'react';
import { AppTab } from '../../types/health';
import { 
  Sparkles, 
  Activity, 
  Utensils, 
  MoreHorizontal, 
  Bell, 
  Footprints, 
  CalendarClock, 
  Camera, 
  Compass, 
  Settings,
  X 
} from 'lucide-react';

interface MobileNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  alertCount: number;
  isTodayDone: boolean;
  onOpenSettings: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  alertCount,
  isTodayDone,
  onOpenSettings,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainItems: { id: AppTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'conversational',
      label: 'AI Check-In',
      icon: Sparkles,
      badge: isTodayDone ? '✓' : undefined,
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: Footprints,
    },
    {
      id: 'timeline',
      label: 'Vitals',
      icon: Activity,
    },
    {
      id: 'recipes',
      label: 'Recipes',
      icon: Utensils,
    },
  ];

  const moreItems: { id: AppTab | 'settings'; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'reminders', label: 'Reminders & Tasks', icon: CalendarClock },
    { id: 'scanner', label: 'AI Food Scanner', icon: Camera, badge: 'AI' },
    { id: 'happenings', label: 'Bay Area Events', icon: Compass },
    { id: 'alerts', label: 'Risk Alerts', icon: Bell, badge: alertCount > 0 ? alertCount : undefined },
    { id: 'settings', label: 'Settings & Medications', icon: Settings },
  ];

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  const isMoreActive = !mainItems.some((item) => item.id === activeTab);

  return (
    <>
      {/* Floating Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-400 text-slate-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-extrabold tracking-tight truncate max-w-[60px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative ${
            isMoreActive
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">More</span>
        </button>
      </nav>

      {/* More Drawer Action Sheet */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          <div className="relative bg-slate-900 border-t-2 border-slate-700 rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slideUp z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">More Health & Lifestyle Tools</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'settings') {
                        setIsMoreOpen(false);
                        onOpenSettings();
                      } else {
                        handleSelectTab(item.id as AppTab);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-700/60 text-emerald-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      {item.badge && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
