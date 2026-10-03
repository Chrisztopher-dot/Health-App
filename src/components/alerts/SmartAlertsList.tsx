import React from 'react';
import { SmartAlert, UserProfile } from '../../types/health';
import { SpeechService } from '../../services/speechService';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Activity, 
  HeartHandshake, 
  Stethoscope, 
  Check, 
  PhoneCall, 
  Info,
  CheckCircle2,
  Volume2,
  BellRing
} from 'lucide-react';

interface SmartAlertsListProps {
  alerts: SmartAlert[];
  profile?: UserProfile;
  onDismissAlert: (id: string) => void;
}

export const SmartAlertsList: React.FC<SmartAlertsListProps> = ({
  alerts,
  profile,
  onDismissAlert,
}) => {
  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-6 h-6 text-rose-400" />;
      case 'blood_pressure':
        return <Activity className="w-6 h-6 text-rose-400" />;
      case 'wellness':
        return <HeartHandshake className="w-6 h-6 text-amber-400" />;
      case 'doctor_followup':
        return <Stethoscope className="w-6 h-6 text-cyan-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getAlertStyle = (severity: SmartAlert['severity']) => {
    if (severity === 'critical') {
      return {
        card: 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40',
        badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        title: 'text-rose-200',
        dot: 'bg-rose-500',
      };
    }
    if (severity === 'warning') {
      return {
        card: 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/40',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        title: 'text-amber-200',
        dot: 'bg-amber-500',
      };
    }
    return {
      card: 'bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-950/40',
      badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      title: 'text-cyan-200',
      dot: 'bg-cyan-500',
    };
  };

  const handleReadAlert = (alert: SmartAlert) => {
    const text = `Health Alert: ${alert.title}. ${alert.message}. Date: ${new Date(alert.dateTriggered).toLocaleDateString()}.`;
    SpeechService.speak(text, profile?.voiceSpeed);
  };

  return (
    <div className="max-w-5xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 backdrop-blur-md shadow-2xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                AI Clinical Safety Guard
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <BellRing className="w-3 h-3 text-amber-400" />
                Proactive Trend & Pattern Detection
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />
              </div>
              <span>Smart Health Alerts & Monitoring</span>
            </h2>

            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
              Continuous trend analysis monitoring your blood pressure spikes, medication consistency, and daily wellness patterns to surface proactive safety recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-center">
            <span className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black border flex items-center gap-2 ${
              alerts.length > 0
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/30'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{alerts.length} Active {alerts.length === 1 ? 'Alert' : 'Alerts'}</span>
            </span>
          </div>
        </div>

        {/* Alerts Content List */}
        {alerts.length === 0 ? (
          <div className="bg-slate-950/70 rounded-3xl border border-emerald-500/30 p-8 sm:p-12 text-center space-y-4 shadow-inner">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                All Clear — No Active Health Alerts
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-lg mx-auto leading-relaxed">
                Your blood pressure readings, medication schedule, and daily wellbeing indicators are running smoothly within your expected healthy target ranges.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {alerts.map((alert) => {
              const style = getAlertStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl border p-5 sm:p-7 transition-all ${style.card} space-y-4`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-md flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${style.badge}`}>
                            {alert.severity} • {alert.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {new Date(alert.dateTriggered).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <h3 className={`text-lg sm:text-xl font-black tracking-tight ${style.title}`}>
                          {alert.title}
                        </h3>

                        <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed max-w-2xl">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <button
                        onClick={() => handleReadAlert(alert)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        title="Read alert aloud"
                      >
                        <Volume2 className="w-4 h-4 text-slate-300" />
                      </button>

                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white rounded-xl border border-slate-700 font-black text-xs transition-colors flex-shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    </div>
                  </div>

                  {/* Doctor Follow-Up Recommendation Box */}
                  <div className="pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-300">
                    <div className="flex items-center gap-2 text-rose-300 font-semibold">
                      <PhoneCall className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Consider noting this during your next appointment with Dr. Vance.</span>
                    </div>
                    <span className="text-[11px] italic text-slate-400">
                      Informational trend analysis only • Not emergency triage
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Senior Emergency Reminder Box */}
        <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-rose-500/30 flex items-start gap-3.5 shadow-inner">
          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium text-slate-300 space-y-1">
            <p className="font-black text-white text-sm">Emergency Protocol Reminder</p>
            <p className="leading-relaxed">
              If you or a loved one ever experience sudden chest pain, shortness of breath, sudden facial numbness, or severe dizziness, do not wait for an app notification. Call <strong className="text-rose-400 font-black">911</strong> or your local emergency medical service immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
