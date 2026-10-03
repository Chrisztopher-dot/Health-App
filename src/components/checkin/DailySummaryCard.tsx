import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckInRecord, DailySummary, UserProfile } from '../../types/health';
import { SpeechService } from '../../services/speechService';
import { WeatherHealthCard } from '../common/WeatherHealthCard';
import { 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  Sun, 
  RotateCcw, 
  Camera, 
  Activity 
} from 'lucide-react';

interface DailySummaryCardProps {
  record: CheckInRecord;
  summary: DailySummary;
  profile: UserProfile;
  onRedoCheckIn: () => void;
  onGoToTimeline: () => void;
  onGoToScanner?: () => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  record,
  summary,
  profile,
  onRedoCheckIn,
  onGoToTimeline,
  onGoToScanner,
}) => {
  useEffect(() => {
    // Joyful celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch (_) {}

    if (profile.soundEnabled) {
      const fullSpeech = `${summary.headline}. ${summary.insights.join('. ')}. Motivation for today: ${summary.motivation}`;
      SpeechService.speak(fullSpeech, profile.voiceSpeed);
    }

    return () => {
      SpeechService.stopSpeaking();
    };
  }, []);

  const speakSummary = () => {
    const fullSpeech = `${summary.headline}. ${summary.insights.join('. ')}. Daily positive suggestion: ${summary.motivation}`;
    SpeechService.speak(fullSpeech, profile.voiceSpeed);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn text-slate-100">
      
      {/* Main Success Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-0.5 rounded-full border border-emerald-500/30">
                Daily Check-In Completed ✓
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
                {summary.headline}
              </h2>
            </div>
          </div>

          <button
            onClick={speakSummary}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-emerald-300 border border-slate-700 transition-colors shadow-md"
            title="Read summary aloud"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* AI Clinical Insights List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Daily Health Highlights</span>
            </h3>
            <div className="space-y-2.5">
              {summary.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-sm"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <p className="text-base sm:text-lg font-bold text-slate-200 leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Positive Motivation Box */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/30 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-amber-300">
              <Sun className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg sm:text-xl font-black">Today's Positive Well-Being Suggestion</h4>
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-100 pl-8">
              ✅ {summary.motivation}
            </p>
          </div>

          {/* Checked-In Snapshot Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Mood</span>
              <span className="text-xl font-black capitalize text-white mt-1 block">
                {record.mood.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Energy & Sleep</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {record.energyLevel}/10 • {record.sleepQuality}/10
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
              <span className="text-xl font-black text-rose-400 mt-1 block">
                {record.bloodPressure.measured && record.bloodPressure.systolic
                  ? `${record.bloodPressure.systolic}/${record.bloodPressure.diastolic}`
                  : 'Skipped'}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Prescriptions</span>
              <span className="text-xl font-black text-indigo-400 mt-1 block capitalize">
                {record.medicationStatus === 'taken' ? '✅ Taken' : record.medicationStatus}
              </span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onRedoCheckIn}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Redo Today's Check-In</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onGoToScanner && (
                <button
                  onClick={onGoToScanner}
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Scan Food Plate</span>
                </button>
              )}

              <button
                onClick={onGoToTimeline}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Activity className="w-4 h-4" />
                <span>View Medication & Vitals →</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Senior Weather & Environmental Card */}
      <WeatherHealthCard />

    </div>
  );
};
