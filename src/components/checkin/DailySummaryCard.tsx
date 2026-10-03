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
  ShieldAlert, 
  RotateCcw,
  Camera
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
    <div className="max-w-3xl mx-auto my-6 space-y-6 animate-fadeIn">
      {/* Main Success Card */}
      <div className="bg-white rounded-3xl border-2 border-emerald-300 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-9 h-9 text-emerald-100" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
                Daily Check-In Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {summary.headline}
              </h2>
            </div>
          </div>

          <button
            onClick={speakSummary}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-colors"
            title="Read summary aloud"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* AI Insights list */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Daily Summary & Health Notes
            </h3>
            <div className="space-y-2.5">
              {summary.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                  <p className="text-lg font-bold text-slate-800 leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Motivation Assistant Box */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 text-amber-900 mb-2">
              <Sun className="w-7 h-7 text-amber-600 fill-amber-300" />
              <h4 className="text-xl font-extrabold">Today's Positive Suggestion</h4>
            </div>
            <p className="text-xl font-black text-amber-950 ml-10">
              ✅ {summary.motivation}
            </p>
          </div>

          {/* Checked In Snapshot Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Mood</span>
              <span className="text-xl font-extrabold capitalize text-slate-900 mt-1 block">
                {record.mood.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Energy / Sleep</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {record.energyLevel} / {record.sleepQuality}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Blood Pressure</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {record.bloodPressure.measured && record.bloodPressure.systolic
                  ? `${record.bloodPressure.systolic}/${record.bloodPressure.diastolic}`
                  : 'Skipped'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Medications</span>
              <span className="text-xl font-extrabold capitalize text-slate-900 mt-1 block">
                {record.medicationStatus === 'taken' ? '✅ Taken' : record.medicationStatus}
              </span>
            </div>
          </div>

          {/* Required Medical Disclaimer */}
          <div className="bg-slate-100 rounded-2xl p-4 flex items-center gap-3 border border-slate-200">
            <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-slate-600 italic">
              {summary.disclaimer}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onRedoCheckIn}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 text-sm sm:text-base transition-colors"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Update Check-In</span>
            </button>

            {onGoToScanner && (
              <button
                onClick={onGoToScanner}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-900 font-extrabold text-sm sm:text-base flex items-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                <span>📸 Scan Today's Meal</span>
              </button>
            )}

            <button
              onClick={onGoToTimeline}
              className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>View Health Trends</span>
            </button>
          </div>
        </div>
      </div>

      {/* Senior Weather & Air Quality Health Advisory */}
      <WeatherHealthCard />
    </div>
  );
};
