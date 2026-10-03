import React, { useState } from 'react';
import { WellbeingAvatarState } from '../../types/health';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  X, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Moon,
  Zap,
  Palette,
  HeartHandshake
} from 'lucide-react';
import { ThemeService } from '../../services/themeService';

interface DynamicWellbeingAvatarProps {
  avatarState: WellbeingAvatarState;
  isCollapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showModalOnClick?: boolean;
  onClick?: () => void;
}

export const DynamicWellbeingAvatar: React.FC<DynamicWellbeingAvatarProps> = ({
  avatarState,
  isCollapsed = false,
  size = 'md',
  showLabel = true,
  showModalOnClick = true,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
    if (showModalOnClick) {
      setIsModalOpen(true);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-3xl',
  }[size];

  return (
    <>
      <div 
        onClick={handleClick}
        className="flex items-center gap-3 cursor-pointer group select-none transition-all"
        title={`Wellbeing: ${avatarState.label} (${avatarState.score}/100) • AES-256 Encrypted`}
      >
        {/* Animated Smiley Avatar Container */}
        <div className="relative flex-shrink-0">
          <div
            className={`${sizeClasses} rounded-2xl bg-gradient-to-tr ${avatarState.bgGradient} text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 border ${avatarState.ringColor} ring-2 ring-offset-2 ring-offset-slate-900 group-hover:scale-110 transition-transform duration-200`}
          >
            <span 
              className={`transform transition-transform group-hover:rotate-6 ${
                avatarState.prolongedBelowNormal ? 'animate-bounce' : ''
              }`}
              role="img" 
              aria-label={avatarState.label}
            >
              {avatarState.emoji}
            </span>
          </div>

          {/* Prolonged Below-Normal Awareness Indicator Badge */}
          {avatarState.prolongedBelowNormal && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-900"></span>
            </span>
          )}
        </div>

        {/* Text Details (When not collapsed) */}
        {!isCollapsed && showLabel && (
          <div className="overflow-hidden text-left flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-base tracking-tight text-white font-sans truncate">
                MyHealthSafe
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {avatarState.score}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate flex items-center gap-1" title={avatarState.statusMessage || avatarState.label}>
              <span className="text-emerald-300 font-semibold truncate">{avatarState.label}</span>
            </p>
          </div>
        )}
      </div>

      {/* Interactive Wellbeing & Security Details Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${avatarState.bgGradient} relative text-white flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-inner shadow-black/20">
                  {avatarState.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">{avatarState.label}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white/25 backdrop-blur-md">
                      {avatarState.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-white/90 mt-0.5 font-medium">
                    Dynamic Wellbeing Avatar & Health Harmony
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Awareness Notification for Prolonged Below-Normal state */}
              {avatarState.prolongedBelowNormal && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 flex items-start gap-3.5 shadow-lg shadow-rose-950/30">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 mt-0.5 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-200">
                      Wellbeing Awareness Notice ({avatarState.prolongedDaysCount} Consecutive Days)
                    </h4>
                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                      Your energy, mood, or comfort ratings have been lower than normal recently. Taking quiet rest, staying well hydrated, or reaching out to a doctor or family member is warmly encouraged.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Message & Recommendation */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Current State & Gentle Guidance</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {avatarState.statusMessage}
                </p>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-emerald-300 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{avatarState.recommendation}</span>
                </div>
              </div>

              {/* Wellbeing Factor Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Recent Multi-Factor Wellbeing Index</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="flex justify-center mb-1 text-slate-400">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-lg font-black text-white">{avatarState.averageEnergy}/10</div>
                    <div className="text-[11px] font-semibold text-slate-400">Avg Energy</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="flex justify-center mb-1 text-slate-400">
                      <Moon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-lg font-black text-white">{avatarState.averageSleep}/10</div>
                    <div className="text-[11px] font-semibold text-slate-400">Avg Sleep</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="flex justify-center mb-1 text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-lg font-black text-white capitalize">{avatarState.averageMood.replace('_', ' ')}</div>
                    <div className="text-[11px] font-semibold text-slate-400">Recent Mood</div>
                  </div>
                </div>
              </div>

              {/* Adaptive Health Theme Atmosphere */}
              {(() => {
                const currentTheme = avatarState.theme || ThemeService.getThemeForAvatarState(avatarState);
                return (
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Palette className="w-4 h-4 text-purple-400" />
                        <span>Adaptive Health Theme & Colors</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder}`}>
                        {currentTheme.name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentTheme.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Atmosphere automatically reflects your latest {avatarState.score}% wellbeing composite.</span>
                    </div>
                  </div>
                );
              })()}

              {/* Data Privacy & AES-256 Encryption Guarantee */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Data Safety & Encryption Guarantee</span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  All your health logs, voice transcripts, medication history, and personal vitals are encrypted client-side using military-grade <strong className="text-white">AES-GCM 256-bit cryptography</strong> with hardware-isolated PBKDF2 keys.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 border border-emerald-500/20">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>AES-256 GCM Storage</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/70 border border-emerald-500/20">
                    <KeyRound className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>Zero-Knowledge Cloud PHI</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
