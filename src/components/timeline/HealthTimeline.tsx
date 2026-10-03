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
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { HealthAnalyticsService } from '../../services/healthAnalytics';
import { AITimelineQuery } from './AITimelineQuery';
import { MedicineTracker } from '../medicine/MedicineTracker';
import { DoctorVisitsManager } from './DoctorVisitsManager';
import { VitalsAndBpManager } from './VitalsAndBpManager';

interface HealthTimelineProps {
  history: CheckInRecord[];
  profile: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  onHistoryUpdated?: (updatedHistory: CheckInRecord[]) => void;
  defaultSection?: 'diagram' | 'medicine' | 'vitals' | 'doctor';
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  history,
  profile,
  onUpdateProfile,
  onHistoryUpdated,
  defaultSection = 'medicine',
}) => {
  const [activeSection, setActiveSection] = useState<'diagram' | 'medicine' | 'vitals' | 'doctor'>(defaultSection);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fadeIn">
      
      {/* Hero Header & Vitals / Medication Overview Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Prescriptions & Vitals Care
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Live Register
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <span>Medication & Vitals Management</span>
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Track daily prescriptions, monitor blood pressure & pulse targets, review clinical doctor notes, and explore 30-day health trends.
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] uppercase font-black text-slate-400 block">30D Adherence</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">{adherenceRate}%</span>
              <span className="text-[10px] font-bold text-slate-500 block">Prescription Compliance</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] uppercase font-black text-slate-400 block">Average BP</span>
              <span className="text-lg sm:text-xl font-black text-rose-400">{avgSys}/{avgDia}</span>
              <span className="text-[10px] font-bold text-slate-500 block">Target &lt;{profile.targetSystolicMax}/{profile.targetDiastolicMax}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] uppercase font-black text-slate-400 block">Daily Meds</span>
              <span className="text-lg sm:text-xl font-black text-indigo-400">{profile.medications.length}</span>
              <span className="text-[10px] font-bold text-slate-500 block">Scheduled Prescriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Sub-Tabs with Glowing Active Highlight */}
      <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-800 p-1.5 sm:p-2 shadow-xl flex items-center justify-center gap-2 max-w-4xl mx-auto flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveSection('medicine')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'medicine'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="truncate">Medication Schedule</span>
        </button>

        <button
          onClick={() => setActiveSection('vitals')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'vitals'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="truncate">BP & Pulse Register</span>
        </button>

        <button
          onClick={() => setActiveSection('doctor')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'doctor'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="truncate">Doctor & Clinical</span>
        </button>

        <button
          onClick={() => setActiveSection('diagram')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSection === 'diagram'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="truncate">Trends & Diagrams</span>
        </button>
      </div>

      {activeSection === 'medicine' && (
        <MedicineTracker
          profile={profile}
          onUpdateProfile={onUpdateProfile || (() => {})}
        />
      )}

      {activeSection === 'vitals' && (
        <VitalsAndBpManager
          history={history}
          profile={profile}
          onVitalsUpdated={onHistoryUpdated}
        />
      )}

      {activeSection === 'doctor' && (
        <DoctorVisitsManager
          profile={profile}
          history={history}
        />
      )}

      {activeSection === 'diagram' && (
        <div className="space-y-6">
          {/* Top Banner & Time Range Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-emerald-400" />
                  <span>Health Trends & Diagrams</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-medium">
                  Tracking your blood pressure, sleep, medications, and wellbeing over time.
                </p>
              </div>

              <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    timeRange === '7d' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Past 7 Days
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    timeRange === '30d' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Past 30 Days
                </button>
                <button
                  onClick={() => setTimeRange('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    timeRange === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* AI Trend Insights Banner */}
            <div className="mt-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Clinical Trend Highlights</span>
              </div>
              <div className="space-y-1.5">
                {trendInsights.map((insight, idx) => (
                  <p key={idx} className="text-sm sm:text-base font-semibold text-slate-200 flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{insight}</span>
                  </p>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-slate-400 italic pt-1">
                {HealthAnalyticsService.MEDICAL_DISCLAIMER}
              </p>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveMetric('bp')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeMetric === 'bp'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Blood Pressure ({avgSys}/{avgDia})</span>
            </button>

            <button
              onClick={() => setActiveMetric('energy_sleep')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeMetric === 'energy_sleep'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Energy & Sleep</span>
            </button>

            <button
              onClick={() => setActiveMetric('meds')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeMetric === 'meds'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Pill className="w-4 h-4 text-emerald-400" />
              <span>Medication Adherence ({adherenceRate}%)</span>
            </button>

            <button
              onClick={() => setActiveMetric('weight')}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeMetric === 'weight'
                  ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-950/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Weight Trend</span>
            </button>
          </div>

          {/* Main Interactive Chart Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            {activeMetric === 'bp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      Systolic & Diastolic Blood Pressure (mmHg)
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">
                      Target threshold: &lt; {profile.targetSystolicMax}/{profile.targetDiastolicMax} mmHg
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis domain={[50, 180]} stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: 16, 
                          border: '1px solid #334155', 
                          fontWeight: 'bold', 
                          color: '#f8fafc' 
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 13, color: '#f8fafc' }} />
                      <ReferenceLine y={profile.targetSystolicMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Target Max', fill: '#f87171', fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        name="Systolic (mmHg)"
                        stroke="#f87171"
                        strokeWidth={3.5}
                        dot={{ r: 5, fill: '#f87171' }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        name="Diastolic (mmHg)"
                        stroke="#60a5fa"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#60a5fa' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pulse"
                        name="Pulse (bpm)"
                        stroke="#34d399"
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
                    <h3 className="text-xl font-black text-white">
                      Daily Energy & Sleep Quality (Scale 1–10)
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">
                      Visualizing restorative sleep alongside daytime vitality
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: 16, 
                          border: '1px solid #334155', 
                          fontWeight: 'bold', 
                          color: '#f8fafc' 
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 13, color: '#f8fafc' }} />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energy Level (1–10)"
                        stroke="#fbbf24"
                        strokeWidth={3.5}
                        dot={{ r: 5, fill: '#fbbf24' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep Quality (1–10)"
                        stroke="#818cf8"
                        strokeWidth={3.5}
                        dot={{ r: 5, fill: '#818cf8' }}
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
                    <h3 className="text-xl font-black text-white">
                      Daily Medication Adherence
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">
                      Green = Taken, Red = Missed
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: 16, 
                          border: '1px solid #334155', 
                          fontWeight: 'bold', 
                          color: '#f8fafc' 
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 13, color: '#f8fafc' }} />
                      <Bar dataKey="medTaken" name="Medications Taken" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="medMissed" name="Missed Dose" fill="#f87171" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveSection('medicine')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/50"
                  >
                    <Pill className="w-4 h-4" />
                    <span>Open Daily Medicine Tracker & Schedule →</span>
                  </button>
                </div>
              </div>
            )}

            {activeMetric === 'weight' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      Weight Trend (lbs)
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">
                      Gradual morning weight changes
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.filter(d => d.weight !== null)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: 16, 
                          border: '1px solid #334155', 
                          fontWeight: 'bold', 
                          color: '#f8fafc' 
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: 13, color: '#f8fafc' }} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        name="Weight (lbs)"
                        stroke="#2dd4bf"
                        strokeWidth={3.5}
                        dot={{ r: 6, fill: '#2dd4bf' }}
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
