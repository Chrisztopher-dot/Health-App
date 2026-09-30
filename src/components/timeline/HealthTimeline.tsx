import React, { useState } from 'react';
import { CheckInRecord, UserProfile } from '../../types/health';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  Pill, 
  Moon, 
  Scale, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { HealthAnalyticsService } from '../../services/healthAnalytics';
import { AITimelineQuery } from './AITimelineQuery';
import { MedicineTracker } from '../medicine/MedicineTracker';

interface HealthTimelineProps {
  history: CheckInRecord[];
  profile: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  defaultSection?: 'diagram' | 'medicine';
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  history,
  profile,
  onUpdateProfile,
  defaultSection = 'diagram',
}) => {
  const [activeSection, setActiveSection] = useState<'diagram' | 'medicine'>(defaultSection);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [activeMetric, setActiveMetric] = useState<'bp' | 'energy_sleep' | 'meds' | 'weight'>('bp');

  // Filter history by time range
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredHistory = React.useMemo(() => {
    if (timeRange === '7d') return sortedHistory.slice(-7);
    if (timeRange === '30d') return sortedHistory.slice(-30);
    return sortedHistory;
  }, [sortedHistory, timeRange]);

  // Chart data formatting
  const chartData = filteredHistory.map((r) => {
    const dateFormatted = new Date(r.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return {
      date: dateFormatted,
      fullDate: r.date,
      systolic: r.bloodPressure.measured ? r.bloodPressure.systolic : null,
      diastolic: r.bloodPressure.measured ? r.bloodPressure.diastolic : null,
      pulse: r.bloodPressure.measured ? r.bloodPressure.pulse : null,
      energy: r.energyLevel,
      sleep: r.sleepQuality,
      pain: r.painLevel,
      weight: r.weight || null,
      medTaken: r.medicationStatus === 'taken' ? 1 : 0,
      medMissed: r.medicationStatus === 'missed' ? 1 : 0,
      symptomsCount: r.symptoms.length,
      symptoms: r.symptoms.join(', '),
      mood: r.mood,
    };
  });

  // Calculate high-level summary stats
  const bpReadings = chartData.filter((d) => d.systolic !== null);
  const avgSys = bpReadings.length > 0 
    ? Math.round(bpReadings.reduce((sum, d) => sum + (d.systolic || 0), 0) / bpReadings.length)
    : 120;
  const avgDia = bpReadings.length > 0 
    ? Math.round(bpReadings.reduce((sum, d) => sum + (d.diastolic || 0), 0) / bpReadings.length)
    : 80;

  const adherenceRate = Math.round(
    (chartData.filter((d) => d.medTaken === 1).length / (chartData.length || 1)) * 100
  );

  const trendInsights = HealthAnalyticsService.generateTrendInsights(history);

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6">
      {/* Category Sub-Tabs: Health Diagrams & Trends vs Medicine Tracker */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-200 p-1.5 sm:p-2 shadow-sm flex items-center justify-center gap-2 max-w-lg mx-auto">
        <button
          onClick={() => setActiveSection('diagram')}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeSection === 'diagram'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Health Diagrams</span>
        </button>

        <button
          onClick={() => setActiveSection('medicine')}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-base transition-all flex items-center justify-center gap-2 ${
            activeSection === 'medicine'
              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <span>Medicine Tracker</span>
        </button>
      </div>

      {activeSection === 'medicine' ? (
        <MedicineTracker
          profile={profile}
          onUpdateProfile={onUpdateProfile || (() => {})}
        />
      ) : (
        <div className="space-y-8">
          {/* Top Banner & Time Range Controls */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-emerald-700" />
                  Health Trends & Diagrams
                </h2>
                <p className="text-base text-slate-600 mt-1 font-medium">
                  Tracking your blood pressure, sleep, medications, and wellbeing over time.
                </p>
              </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                timeRange === '7d' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                timeRange === '30d' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past 30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                timeRange === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* AI Trend Insights Banner */}
        <div className="mt-6 bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm uppercase tracking-wider">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            AI Trend Highlights
          </div>
          <div className="space-y-1.5">
            {trendInsights.map((insight, idx) => (
              <p key={idx} className="text-base font-bold text-emerald-950 flex items-start gap-2">
                <span className="text-emerald-600">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500 italic pt-1">
            {HealthAnalyticsService.MEDICAL_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setActiveMetric('bp')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center gap-2 ${
            activeMetric === 'bp'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Activity className="w-5 h-5" />
          Blood Pressure ({avgSys}/{avgDia} avg)
        </button>

        <button
          onClick={() => setActiveMetric('energy_sleep')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center gap-2 ${
            activeMetric === 'energy_sleep'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Moon className="w-5 h-5" />
          Energy & Sleep Quality
        </button>

        <button
          onClick={() => setActiveMetric('meds')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center gap-2 ${
            activeMetric === 'meds'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Pill className="w-5 h-5" />
          Medication Adherence ({adherenceRate}%)
        </button>

        <button
          onClick={() => setActiveMetric('weight')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-base border-2 transition-all flex items-center gap-2 ${
            activeMetric === 'weight'
              ? 'bg-teal-600 text-white border-teal-700 shadow-md shadow-teal-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <Scale className="w-5 h-5" />
          Weight Tracking
        </button>
      </div>

      {/* Main Interactive Chart Box */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
        {activeMetric === 'bp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Systolic & Diastolic Blood Pressure (mmHg)
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Target threshold: &lt; {profile.targetSystolicMax}/{profile.targetDiastolicMax} mmHg
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis domain={[50, 180]} stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: '2px solid #cbd5e1', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 14 }} />
                  <ReferenceLine y={profile.targetSystolicMax} stroke="#ef4444" strokeDasharray="4 4" label="Target Systolic Max" />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic (mmHg)"
                    stroke="#dc2626"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#dc2626' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic (mmHg)"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pulse"
                    name="Pulse (bpm)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeMetric === 'energy_sleep' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Daily Energy & Sleep Quality (Scale 1–10)
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Visualizing restorative sleep alongside daytime vitality
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis domain={[0, 10]} stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: '2px solid #cbd5e1', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 14 }} />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy Level (1–10)"
                    stroke="#f59e0b"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#f59e0b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    name="Sleep Quality (1–10)"
                    stroke="#6366f1"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeMetric === 'meds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Daily Medication Adherence
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Green = Taken, Red = Missed
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: '2px solid #cbd5e1', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 14 }} />
                  <Bar dataKey="medTaken" name="Medications Taken" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="medMissed" name="Missed Dose" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSection('medicine')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-900 font-extrabold text-sm transition-all"
              >
                <Pill className="w-4 h-4 text-emerald-700" />
                <span>Open Daily Medicine Tracker & Schedule →</span>
              </button>
            </div>
          </div>
        )}

        {activeMetric === 'weight' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Weight Trend (lbs)
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  Gradual morning weight changes
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.filter(d => d.weight !== null)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#64748b" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: '2px solid #cbd5e1', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 14 }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (lbs)"
                    stroke="#0d9488"
                    strokeWidth={3.5}
                    dot={{ r: 6, fill: '#0d9488' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* AI Retrospective Q&A Assistant */}
      <AITimelineQuery history={history} profile={profile} />
        </div>
      )}
    </div>
  );
};
