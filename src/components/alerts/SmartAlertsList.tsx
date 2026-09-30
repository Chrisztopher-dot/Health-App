import React from 'react';
import { SmartAlert, UserProfile } from '../../types/health';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Activity, 
  HeartHandshake, 
  Stethoscope, 
  Check, 
  PhoneCall, 
  Info
} from 'lucide-react';

interface SmartAlertsListProps {
  alerts: SmartAlert[];
  profile?: UserProfile;
  onDismissAlert: (id: string) => void;
}

export const SmartAlertsList: React.FC<SmartAlertsListProps> = ({
  alerts,
  onDismissAlert,
}) => {
  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-8 h-8 text-rose-600" />;
      case 'blood_pressure':
        return <Activity className="w-8 h-8 text-rose-600" />;
      case 'wellness':
        return <HeartHandshake className="w-8 h-8 text-amber-600" />;
      case 'doctor_followup':
        return <Stethoscope className="w-8 h-8 text-rose-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-amber-600" />;
    }
  };

  const getAlertStyle = (severity: SmartAlert['severity']) => {
    if (severity === 'critical') {
      return {
        card: 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200',
        badge: 'bg-rose-600 text-white',
        title: 'text-rose-950',
      };
    }
    if (severity === 'warning') {
      return {
        card: 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-200',
        badge: 'bg-amber-600 text-white',
        title: 'text-amber-950',
      };
    }
    return {
      card: 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-200',
      badge: 'bg-blue-600 text-white',
      title: 'text-blue-950',
    };
  };

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-emerald-700" />
              Smart Health Alerts & Monitoring
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-1 font-medium">
              Proactive trend analysis detecting potential health concerns early.
            </p>
          </div>
          <span className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-sm font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
            {alerts.length} Active {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Check className="w-9 h-9" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">
            No Active Health Alerts
          </h3>
          <p className="text-lg text-slate-600 max-w-lg mx-auto font-medium">
            Your blood pressure, medication adherence, and daily wellbeing indicators are running smoothly within your expected ranges.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const style = getAlertStyle(alert.severity);
            return (
              <div
                key={alert.id}
                className={`rounded-3xl border-2 p-6 sm:p-8 transition-all shadow-md ${style.card}`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex-shrink-0">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${style.badge}`}>
                          {alert.severity} • {alert.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {new Date(alert.dateTriggered).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className={`text-2xl font-extrabold ${style.title}`}>
                        {alert.title}
                      </h3>
                      <p className="text-lg font-bold text-slate-800 leading-relaxed max-w-2xl">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 font-bold text-sm flex-shrink-0 transition-colors"
                  >
                    Acknowledge & Dismiss
                  </button>
                </div>

                {/* Doctor Follow-Up Recommendation Box */}
                <div className="mt-5 pt-4 border-t border-slate-300/60 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <div className="flex items-center gap-2 text-rose-900">
                    <PhoneCall className="w-5 h-5 text-rose-600" />
                    <span>Consider noting this during your next appointment with Dr. Vance.</span>
                  </div>
                  <span className="text-xs italic text-slate-500">
                    Not medical advice • Informational trend analysis only
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Senior Safety Note */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-300 flex items-start gap-3">
        <Info className="w-6 h-6 text-slate-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm font-semibold text-slate-700 space-y-1">
          <p className="font-extrabold text-slate-900">Emergency Reminder</p>
          <p>
            If you ever experience sudden chest pain, difficulty breathing, severe weakness, or fainting, do not wait for a check-in alert. Call 911 or your local emergency number immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
