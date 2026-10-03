import React, { useState } from 'react';
import { CheckInRecord, UserProfile } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Activity, 
  Heart, 
  Calendar, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface VitalsAndBpManagerProps {
  history: CheckInRecord[];
  profile: UserProfile;
  onVitalsUpdated?: (updatedHistory: CheckInRecord[]) => void;
}

export const VitalsAndBpManager: React.FC<VitalsAndBpManagerProps> = ({
  history,
  profile,
  onVitalsUpdated,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Form states
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [measurementTime, setMeasurementTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [arm, setArm] = useState<'left' | 'right'>('left');
  const [measurementContext, setMeasurementContext] = useState<'resting' | 'after_walk' | 'after_meds' | 'feeling_dizzy'>('resting');
  const [notes, setNotes] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Find existing record for selectedDate if present
  const existingRecordForDate = history.find((r) => r.date === selectedDate);
  const existingBp = existingRecordForDate?.bloodPressure?.measured ? existingRecordForDate.bloodPressure : null;

  // Sync inputs with existing record if present
  React.useEffect(() => {
    if (existingBp && existingBp.systolic && existingBp.diastolic) {
      setSystolic(existingBp.systolic);
      setDiastolic(existingBp.diastolic);
      if (existingBp.pulse) setPulse(existingBp.pulse);
    } else {
      // Default to standard normal or recent average
      const recentValid = history.find((r) => r.bloodPressure?.measured && r.bloodPressure.systolic);
      if (recentValid?.bloodPressure?.systolic && recentValid?.bloodPressure?.diastolic) {
        setSystolic(recentValid.bloodPressure.systolic);
        setDiastolic(recentValid.bloodPressure.diastolic);
        if (recentValid.bloodPressure.pulse) setPulse(recentValid.bloodPressure.pulse);
      }
    }
  }, [selectedDate, history]);

  // AHA Blood Pressure Classification
  const getBpClassification = (sys: number, dia: number) => {
    if (sys > 180 || dia > 120) {
      return {
        label: 'Hypertensive Crisis',
        badgeColor: 'bg-rose-600 text-white border-rose-700',
        textColor: 'text-rose-700',
        description: 'Readings are urgently high. Rest quietly and seek prompt medical advice if persistent.',
        severity: 'critical',
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        label: 'Stage 2 Hypertension',
        badgeColor: 'bg-rose-500 text-white border-rose-600',
        textColor: 'text-rose-600',
        description: 'Elevated blood pressure above typical medical targets. Continue monitoring and take prescribed medicines.',
        severity: 'high',
      };
    }
    if (sys >= 130 || dia >= 80) {
      return {
        label: 'Stage 1 Hypertension',
        badgeColor: 'bg-amber-500 text-white border-amber-600',
        textColor: 'text-amber-700',
        description: 'Slightly above normal. Consistent lifestyle, low sodium, and regular routine recommended.',
        severity: 'moderate',
      };
    }
    if (sys >= 120 && dia < 80) {
      return {
        label: 'Elevated',
        badgeColor: 'bg-yellow-400 text-yellow-950 border-yellow-500',
        textColor: 'text-yellow-700',
        description: 'Systolic pressure is slightly above optimal. Maintain hydration and gentle physical activity.',
        severity: 'mild',
      };
    }
    return {
      label: 'Normal & Healthy',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700',
      textColor: 'text-emerald-700',
      description: 'Optimal blood pressure within recommended senior cardiovascular targets.',
      severity: 'normal',
    };
  };

  // Pulse (Heart Rate) Classification
  const getPulseClassification = (bpm: number) => {
    if (bpm < 50) {
      return {
        label: 'Low Pulse (Bradycardia)',
        color: 'text-amber-600',
        desc: 'Below typical resting rate. Normal in active individuals, but note if dizziness occurs.',
      };
    }
    if (bpm <= 100) {
      return {
        label: 'Normal Resting Heart Rate',
        color: 'text-emerald-700',
        desc: 'Within the standard 60–100 beats per minute resting target.',
      };
    }
    return {
      label: 'Elevated Pulse (Tachycardia)',
      color: 'text-rose-600',
      desc: 'Resting pulse is elevated. Rest quietly for 5 minutes and take slow, deep breaths.',
    };
  };

  const currentBpClass = getBpClassification(systolic, diastolic);
  const currentPulseClass = getPulseClassification(pulse);

  // Check personal target match
  const isSysInTarget = systolic >= profile.targetSystolicMin && systolic <= profile.targetSystolicMax;
  const isDiaInTarget = diastolic >= profile.targetDiastolicMin && diastolic <= profile.targetDiastolicMax;

  const handleDateChange = (delta: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleSaveVitals = () => {
    const noteContent = notes 
      ? `Arm: ${arm.toUpperCase()} | Time: ${measurementTime} | Context: ${measurementContext} | Note: ${notes}`
      : `Arm: ${arm.toUpperCase()} | Time: ${measurementTime} | Context: ${measurementContext}`;

    const updated = HealthStorageService.registerBloodPressureAndPulse(
      selectedDate,
      systolic,
      diastolic,
      pulse,
      noteContent
    );

    if (onVitalsUpdated) {
      onVitalsUpdated(updated);
    }

    setSaveMessage(`Successfully recorded ${systolic}/${diastolic} mmHg (Pulse ${pulse} bpm) for ${selectedDate}.`);
    
    if (profile.soundEnabled) {
      SpeechService.speak(
        `Blood pressure recorded at ${systolic} over ${diastolic} with a pulse of ${pulse} beats per minute. Status is ${currentBpClass.label}.`,
        profile.voiceSpeed
      );
    }

    setTimeout(() => {
      setSaveMessage(null);
    }, 5000);
  };

  // Past readings with BP recorded
  const recordedHistory = history
    .filter((r) => r.bloodPressure && r.bloodPressure.measured && r.bloodPressure.systolic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      
      {/* Top Banner & Date Navigator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-300 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Activity className="w-3.5 h-3.5" />
                Vitals & Cardiovascular Registration
              </span>
              {selectedDate === todayStr && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-400 fill-rose-500/20" />
              <span>Register Blood Pressure & Pulse</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
              Log daily readings, track your resting pulse, and compare with your target healthy zones.
            </p>
          </div>

          {/* Target Reference Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-xs font-bold text-slate-300">
              <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Your Personal Target</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                {profile.targetSystolicMin}–{profile.targetSystolicMax} / {profile.targetDiastolicMin}–{profile.targetDiastolicMax} <span className="text-xs text-slate-400 font-normal">mmHg</span>
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Previous Day</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-2xl border border-slate-700">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span className="text-sm sm:text-base font-extrabold text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Next Day"
            >
              <span className="text-xs font-bold hidden sm:inline">Next Day</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm rounded-xl border border-rose-500/40 transition-colors"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* Main Registration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <span>Enter Vitals Readings</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              {existingBp ? '✏️ Editing logged reading' : '✨ New entry'}
            </span>
          </div>

          {/* Systolic & Diastolic Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Systolic (Top Number) */}
            <div className="p-5 rounded-3xl bg-rose-950/30 border border-rose-500/30 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">
                    Systolic (Top)
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Pumping Pressure</span>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${isSysInTarget ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                  {isSysInTarget ? 'In Target ✓' : 'Outside Target'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.max(70, v - 5))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/40 text-rose-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Subtract 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.max(70, v - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-rose-500/30 text-rose-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Subtract 1"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 text-center">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-3xl sm:text-4xl font-black text-white bg-transparent focus:outline-none"
                    min={70}
                    max={250}
                  />
                  <span className="text-xs font-bold text-rose-300/80">mmHg</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.min(250, v + 1))}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-rose-500/30 text-rose-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Add 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.min(250, v + 5))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/40 text-rose-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Add 5"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Diastolic (Bottom Number) */}
            <div className="p-5 rounded-3xl bg-blue-950/30 border border-blue-500/30 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-wider block">
                    Diastolic (Bottom)
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Resting Pressure</span>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${isDiaInTarget ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                  {isDiaInTarget ? 'In Target ✓' : 'Outside Target'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.max(40, v - 5))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-blue-500/40 text-blue-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Subtract 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.max(40, v - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-blue-500/30 text-blue-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Subtract 1"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 text-center">
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-3xl sm:text-4xl font-black text-white bg-transparent focus:outline-none"
                    min={40}
                    max={150}
                  />
                  <span className="text-xs font-bold text-blue-300/80">mmHg</span>
                </div>

                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.min(150, v + 1))}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-blue-500/30 text-blue-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Add 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.min(150, v + 5))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-blue-500/40 text-blue-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
                  title="Add 5"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Pulse / Heart Rate Input */}
          <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 space-y-3 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  Pulse / Heart Rate
                </span>
                <span className="text-[11px] font-medium text-slate-400">Resting beats per minute</span>
              </div>
              <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                {currentPulseClass.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setPulse((v) => Math.max(40, v - 5))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setPulse((v) => Math.max(40, v - 1))}
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(parseInt(e.target.value) || 0)}
                  className="w-full text-center text-3xl sm:text-4xl font-black text-white bg-transparent focus:outline-none"
                  min={40}
                  max={200}
                />
                <span className="text-xs font-bold text-emerald-400/80">BPM (Beats/Min)</span>
              </div>

              <button
                type="button"
                onClick={() => setPulse((v) => Math.min(200, v + 1))}
                className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPulse((v) => Math.min(200, v + 5))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-black text-sm transition-all active:scale-95 flex items-center justify-center shadow-md"
              >
                +5
              </button>
            </div>
          </div>

          {/* Measurement Details: Time, Arm, Context */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Time of Day</label>
              <select
                value={measurementTime}
                onChange={(e) => setMeasurementTime(e.target.value as any)}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="morning">🌅 Morning (Recommended)</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
                <option value="night">🌙 Bedtime</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Arm Used</label>
              <select
                value={arm}
                onChange={(e) => setArm(e.target.value as any)}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="left">Left Arm</option>
                <option value="right">Right Arm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Condition</label>
              <select
                value={measurementContext}
                onChange={(e) => setMeasurementContext(e.target.value as any)}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="resting">🧘 Resting quietly</option>
                <option value="after_meds">💊 After medication</option>
                <option value="after_walk">🚶 After light activity</option>
                <option value="feeling_dizzy">💫 Feeling lightheaded</option>
              </select>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Personal Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Took reading after 5 min quiet rest, before coffee"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveVitals}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-lg shadow-lg shadow-rose-950/50 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Save Vitals for {selectedDate}</span>
            </button>

            {saveMessage && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold text-sm flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Instant Medical Assessment & Education (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-time AHA Classification Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Instant Clinical Evaluation</span>
              </h4>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${currentBpClass.badgeColor}`}>
                {currentBpClass.label}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-2xl font-black text-white flex items-center gap-2">
                <span>{systolic} / {diastolic}</span>
                <span className="text-xs font-bold text-slate-400">mmHg</span>
                <span className="text-base text-slate-600 font-normal">|</span>
                <span className="text-emerald-400 text-xl font-black">{pulse}</span>
                <span className="text-xs font-bold text-slate-400">BPM</span>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {currentBpClass.description}
              </p>
            </div>

            {/* Pulse Explanation */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pulse Guide: {currentPulseClass.label}</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed font-medium">
                {currentPulseClass.desc}
              </p>
            </div>
          </div>

          {/* Golden Rules for Accurate Measuring */}
          <div className="bg-slate-950/80 border border-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <Info className="w-4 h-4" />
              <span>5 Golden Rules for Accurate Readings</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 font-medium leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">1.</span>
                <span>Sit quietly with your back supported for <strong className="text-white">5 minutes</strong> before measuring.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">2.</span>
                <span>Keep both feet flat on the floor and avoid crossing your legs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">3.</span>
                <span>Rest your arm on a table so the cuff is at <strong className="text-white">heart level</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">4.</span>
                <span>Avoid caffeine, exercise, or smoking for 30 minutes beforehand.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">5.</span>
                <span>Do not talk during the measurement for the most accurate reading.</span>
              </li>
            </ul>

            <div className="pt-2.5 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>All vitals data is securely encrypted locally on your device.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Blood Pressure & Pulse Readings History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" />
              <span>Recent Blood Pressure & Pulse Log History</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Your recent recordings and vitals trends
            </p>
          </div>
          <span className="text-xs font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full">
            {recordedHistory.length} Registered Readings
          </span>
        </div>

        {recordedHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
            No blood pressure readings recorded yet. Use the form above to register your first reading.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Blood Pressure</th>
                  <th className="py-3 px-3">Pulse</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Details / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recordedHistory.slice(0, 10).map((rec) => {
                  const sys = rec.bloodPressure.systolic || 120;
                  const dia = rec.bloodPressure.diastolic || 80;
                  const bpm = rec.bloodPressure.pulse || 72;
                  const bpClass = getBpClassification(sys, dia);

                  return (
                    <tr key={rec.id || rec.date} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-200 whitespace-nowrap">
                        {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-black text-base text-white whitespace-nowrap">
                        {sys} / {dia} <span className="text-xs font-normal text-slate-400">mmHg</span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-emerald-400 whitespace-nowrap">
                        {bpm} <span className="text-xs font-normal text-slate-400">BPM</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${bpClass.badgeColor}`}>
                          {bpClass.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-300 max-w-xs truncate">
                        {rec.dailyNotes || 'Routine daily check-in reading'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
