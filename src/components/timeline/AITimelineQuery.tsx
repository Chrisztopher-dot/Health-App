import React, { useState } from 'react';
import { CheckInRecord, UserProfile, RetrospectiveQueryResult } from '../../types/health';
import { HealthAnalyticsService } from '../../services/healthAnalytics';
import { SpeechService } from '../../services/speechService';
import { 
  Sparkles, 
  Search, 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle, 
  CheckCircle,
  Stethoscope
} from 'lucide-react';

interface AITimelineQueryProps {
  history: CheckInRecord[];
  profile: UserProfile;
}

const SAMPLE_QUERIES = [
  'How have I been feeling during the last month?',
  'Did I miss any medicine this week?',
  'When did my fatigue start?',
  'Have my blood pressure readings improved?',
  'Show me my health trend since January.',
];

export const AITimelineQuery: React.FC<AITimelineQueryProps> = ({
  history,
  profile,
}) => {
  const [queryInput, setQueryInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [result, setResult] = useState<RetrospectiveQueryResult | null>(() => {
    // Initial default answer for "How have I been feeling during the last month?"
    return HealthAnalyticsService.queryRetrospective(
      'How have I been feeling during the last month?',
      history,
      profile
    );
  });

  const handleRunQuery = (textToQuery?: string) => {
    const q = (textToQuery || queryInput).trim();
    if (!q) return;

    const res = HealthAnalyticsService.queryRetrospective(q, history, profile);
    setResult(res);
    setQueryInput('');

    if (profile.soundEnabled) {
      SpeechService.speak(res.answer, profile.voiceSpeed);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    SpeechService.startListening(
      (text, isFinal) => {
        setQueryInput(text);
        if (isFinal) {
          setIsListening(false);
          handleRunQuery(text);
        }
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const speakResult = () => {
    if (result) {
      SpeechService.speak(result.answer, profile.voiceSpeed);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Ask AI About Your Health History
            </h3>
            <p className="text-sm font-medium text-slate-300">
              Ask any question about your past check-ins, symptoms, or blood pressure trends.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Suggested Questions
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleRunQuery(sample)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500 text-sm font-bold transition-all text-left flex items-center gap-2 active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{sample}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Search Box */}
      <div className="flex items-center gap-2 pt-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
            placeholder={isListening ? 'Listening to your question...' : 'Ask e.g. "When was my blood pressure highest?"...'}
            className="w-full text-base sm:text-lg p-4 pl-12 pr-12 rounded-2xl bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4.5" />
          
          <button
            onClick={handleToggleVoice}
            className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-400 hover:text-white bg-slate-700/50'
            }`}
            title="Ask by voice"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={() => handleRunQuery()}
          className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-emerald-900/30 active:scale-95"
        >
          Ask AI
        </button>
      </div>

      {/* Result Display Box */}
      {result && (
        <div className="bg-slate-800/90 border-2 border-slate-700 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between gap-4 border-b border-slate-700 pb-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                AI Response • {result.relevantDateRange}
              </span>
              <h4 className="text-lg font-bold text-slate-300 mt-0.5">
                "{result.query}"
              </h4>
            </div>

            <button
              onClick={speakResult}
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors flex-shrink-0"
              title="Read answer aloud"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xl font-bold text-slate-100 leading-relaxed">
            {result.answer}
          </p>

          {result.bulletPoints.length > 0 && (
            <div className="space-y-2 pt-1">
              {result.bulletPoints.map((bp, i) => (
                <div key={i} className="flex items-start gap-2.5 text-slate-200 font-semibold text-base">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{bp}</span>
                </div>
              ))}
            </div>
          )}

          {result.doctorConsultSuggested && (
            <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3.5 flex items-center gap-3 text-rose-200 text-sm font-semibold">
              <Stethoscope className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <span>We recommend discussing this health history summary with your healthcare provider.</span>
            </div>
          )}

          <div className="text-xs italic text-slate-400 pt-2 border-t border-slate-700">
            {HealthAnalyticsService.MEDICAL_DISCLAIMER}
          </div>
        </div>
      )}
    </div>
  );
};
