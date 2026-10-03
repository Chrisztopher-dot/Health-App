import React, { useState, useEffect } from 'react';
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
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Gauge 
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
  const [historyFilter, setHistoryFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Find existing record for selectedDate if present
  const existingRecordForDate = history.find((r) => r.date === selectedDate);
  const existingBp = existingRecordForDate?.bloodPressure?.measured ? existingRecordForDate.bloodPressure : null;

  // Sync inputs with existing record or recent record
  useEffect(() => {
    if (existingBp && existingBp.systolic && existingBp.diastolic) {
      setSystolic(existingBp.systolic);
      setDiastolic(existingBp.diastolic);
      if (existingBp.pulse) setPulse(existingBp.pulse);
      setNotes(existingRecordForDate?.dailyNotes || '');
    } else {
      const recentValid = history.find((r) => r.bloodPressure?.measured && r.bloodPressure.systolic);
      if (recentValid?.bloodPressure?.systolic && recentValid?.bloodPressure?.diastolic) {
        setSystolic(recentValid.bloodPressure.systolic);
        setDiastolic(recentValid.bloodPressure.diastolic);
        if (recentValid.bloodPressure.pulse) setPulse(recentValid.bloodPressure.pulse);
      }
      setNotes('');
    }
  }, [selectedDate, history]);

  // AHA Blood Pressure Classification
  const getBpClassification = (sys: number, dia: number) => {
    if (sys > 180 || dia > 120) {
      return {
        label: 'Hypertensive Crisis',
        badgeColor: 'bg-rose-600 text-white border-rose-500',
        textColor: 'text-rose-400',
        accentBorder: 'border-rose-500',
        description: 'Readings are critically high (>180 / >120). Rest quietly for 5 minutes and seek prompt clinical attention if persistent.',
        categoryIndex: 4,
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        label: 'Stage 2 Hypertension',
        badgeColor: 'bg-rose-500 text-white border-rose-400',
        textColor: 'text-rose-300',
        accentBorder: 'border-rose-500',
        description: 'Elevated blood pressure above senior targets. Ensure prescribed medicines were taken and monitor daily.',
        categoryIndex: 3,
      };
    }
    if (sys >= 130 || dia >= 80) {
      return {
        label: 'Stage 1 Hypertension',
        badgeColor: 'bg-amber-500 text-slate-950 font-black border-amber-400',
        textColor: 'text-amber-300',
        accentBorder: 'border-amber-500',
        description: 'Slightly above optimal. Consistent low-sodium meals, gentle walking, and regular hydration recommended.',
        categoryIndex: 2,
      };
    }
    if (sys >= 120 && dia < 80) {
      return {
        label: 'Elevated (Prehypertension)',
        badgeColor: 'bg-yellow-400 text-slate-950 font-black border-yellow-300',
        textColor: 'text-yellow-300',
        accentBorder: 'border-yellow-400',
        description: 'Systolic is slightly elevated while diastolic is normal. Maintain gentle daily activity and relaxation routine.',
        categoryIndex: 1,
      };
    }
    return {
      label: 'Normal & Optimal',
      badgeColor: 'bg-emerald-600 text-white border-emerald-400',
      textColor: 'text-emerald-300',
      accentBorder: 'border-emerald-500',
      description: 'Optimal blood pressure within recommended senior cardiovascular targets.',
      categoryIndex: 0,
    };
  };

  // Pulse (Heart Rate) Classification
  const getPulseClassification = (bpm: number) => {
    if (bpm < 55) {
      return {
        label: 'Low Pulse (Bradycardia)',
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        desc: 'Below typical resting rate. Normal in very active seniors, but note if dizziness occurs upon standing.',
      };
    }
    if (bpm <= 90) {
      return {
        label: 'Optimal Resting Rate',
        textColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        desc: 'Within the standard senior resting target (55–90 beats per minute).',
      };
    }
    if (bpm <= 100) {
      return {
        label: 'Normal High',
        textColor: 'text-yellow-300',
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        desc: 'Slightly higher resting pulse. Relax and take slow, deep breaths.',
      };
    }
    return {
      label: 'Elevated (Tachycardia)',
      textColor: 'text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      desc: 'Resting pulse is above 100 BPM. Sit quietly for 5–10 minutes and re-measure.',
    };
  };

  const currentBpClass = getBpClassification(systolic, diastolic);
  const currentPulseClass = getPulseClassification(pulse);

  // Check personal target match
  const isSysInTarget = systolic >= profile.targetSystolicMin && systolic <= profile.targetSystolicMax;
  const isDiaInTarget = diastolic >= profile.targetDiastolicMin && diastolic <= profile.targetDiastolicMax;

  const handleDateChange = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const cur = new Date(y, m - 1, d + delta);
    const yStr = cur.getFullYear();
    const mStr = String(cur.getMonth() + 1).padStart(2, '0');
    const dStr = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleApplyPreset = (sys: number, dia: number, bpm: number, ctx: typeof measurementContext) => {
    setSystolic(sys);
    setDiastolic(dia);
    setPulse(bpm);
    setMeasurementContext(ctx);
  };

  const handleSaveVitals = () => {
    const noteContent = notes 
      ? `Arm: ${arm.toUpperCase()} | Time: ${measurementTime} | Context: ${measurementContext} | ${notes}`
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

    setSaveMessage(`Recorded ${systolic}/${diastolic} mmHg (Pulse ${pulse} bpm) for ${selectedDate}.`);
    
    if (profile.soundEnabled) {
      SpeechService.speak(
        `Blood pressure recorded at ${systolic} over ${diastolic} with a pulse of ${pulse} beats per minute. Status is ${currentBpClass.label}.`,
        profile.voiceSpeed
      );
    }

    setTimeout(() => {
      setSaveMessage(null);
    }, 4500);
  };

  const handleDeleteReading = (dateToDelete: string) => {
    if (!window.confirm(`Are you sure you want to remove the blood pressure reading for ${dateToDelete}?`)) {
      return;
    }
    const updated = HealthStorageService.deleteBloodPressureReading(dateToDelete);
    if (onVitalsUpdated) {
      onVitalsUpdated(updated);
    }
  };

  const handleEditPastReading = (rec: CheckInRecord) => {
    setSelectedDate(rec.date);
    if (rec.bloodPressure) {
      setSystolic(rec.bloodPressure.systolic || 120);
      setDiastolic(rec.bloodPressure.diastolic || 80);
      setPulse(rec.bloodPressure.pulse || 72);
      setNotes(rec.dailyNotes || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Past readings with BP recorded
  const recordedHistory = history
    .filter((r) => r.bloodPressure && r.bloodPressure.measured && r.bloodPressure.systolic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredRecordedHistory = React.useMemo(() => {
    if (historyFilter === '7d') return recordedHistory.slice(0, 7);
    if (historyFilter === '30d') return recordedHistory.slice(0, 30);
    return recordedHistory;
  }, [recordedHistory, historyFilter]);

  // Statistics from recent recorded history
  const recent30 = recordedHistory.slice(0, 30);
  const avgSystolic = recent30.length > 0 
    ? Math.round(recent30.reduce((s, r) => s + (r.bloodPressure.systolic || 0), 0) / recent30.length)
    : 120;
  const avgDiastolic = recent30.length > 0
    ? Math.round(recent30.reduce((s, r) => s + (r.bloodPressure.diastolic || 0), 0) / recent30.length)
    : 80;
  const inTargetCount = recent30.filter((r) => {
    const s = r.bloodPressure.systolic || 0;
    const d = r.bloodPressure.diastolic || 0;
    return s >= profile.targetSystolicMin && s <= profile.targetSystolicMax && d >= profile.targetDiastolicMin && d <= profile.targetDiastolicMax;
  }).length;
  const targetCompliance = recent30.length > 0 ? Math.round((inTargetCount / recent30.length) * 100) : 100;

  const [sY, sM, sD] = selectedDate.split('-').map(Number);
  const dateObj = new Date(sY, sM - 1, sD);
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      
      {/* Top Banner & Date Navigator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Activity className="w-3.5 h-3.5" />
                Vitals & Cardiovascular Registration
              </span>
              {selectedDate === todayStr && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-400 fill-rose-500/20 flex-shrink-0" />
              <span>Blood Pressure & Pulse Tracker</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Log resting readings, compare with clinical AHA guidelines, and maintain target compliance.
            </p>
          </div>

          {/* Target Reference Badges */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">
                Personal Healthy Target
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                {profile.targetSystolicMin}–{profile.targetSystolicMax} / {profile.targetDiastolicMin}–{profile.targetDiastolicMax} <span className="text-xs text-slate-400 font-normal">mmHg</span>
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 rounded-2xl border border-slate-700 flex-1 sm:flex-initial justify-center">
              <Calendar className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-black text-white text-center truncate">
                {formattedDateTitle}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Next Day"
            >
              <span className="text-xs font-bold hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 transition-colors"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* Vitals Summary Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            30-Day Avg BP
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 block">
            {avgSystolic}/{avgDiastolic}
          </span>
          <span className="text-xs font-semibold text-slate-400">mmHg Average</span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block">
            Target Compliance
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
            {targetCompliance}%
          </span>
          <span className="text-xs font-semibold text-emerald-300/80">{inTargetCount} of {recent30.length} in Target</span>
        </div>

        <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-blue-300 uppercase tracking-wider block">
            Current Status
          </span>
          <span className="text-lg sm:text-xl font-black text-white mt-1.5 block truncate">
            {currentBpClass.label.split(' ')[0]}
          </span>
          <span className="text-xs font-semibold text-blue-300/80">AHA Category</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            Total Logs
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-400 mt-1 block">
            {recordedHistory.length}
          </span>
          <span className="text-xs font-semibold text-slate-400">Recorded Readings</span>
        </div>
      </div>

      {/* Main Registration & Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Inputs Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <span>Enter Vitals Readings</span>
            </h3>
            <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {existingBp ? '✏️ Editing logged reading' : '✨ New entry'}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Quick Presets (Tap to Fill)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(118, 76, 70, 'resting')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 transition-colors"
              >
                Optimal (118/76, 70 bpm)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(126, 82, 74, 'resting')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-amber-300 transition-colors"
              >
                Target Zone (126/82, 74 bpm)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(138, 86, 80, 'after_walk')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-rose-300 transition-colors"
              >
                Elevated (138/86, 80 bpm)
              </button>
            </div>
          </div>

          {/* Systolic & Diastolic Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Systolic (Top Number) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider block">
                    Systolic (Top)
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Pumping Pressure</span>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${isSysInTarget ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                  {isSysInTarget ? 'In Target ✓' : 'Outside Target'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
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
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-rose-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-rose-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
            <div className="p-4 sm:p-5 rounded-3xl bg-blue-950/20 border border-blue-500/30 space-y-3 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-blue-300 uppercase tracking-wider block">
                    Diastolic (Bottom)
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Resting Pressure</span>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${isDiaInTarget ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                  {isDiaInTarget ? 'In Target ✓' : 'Outside Target'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
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
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-blue-500/30 text-blue-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-blue-500/30 text-blue-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  Pulse / Heart Rate
                </span>
                <span className="text-[11px] font-medium text-slate-400">Resting beats per minute</span>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${currentPulseClass.badgeBg}`}>
                {currentPulseClass.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
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
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
                <span className="text-xs font-bold text-emerald-300/80">BPM (Beats/Min)</span>
              </div>

              <button
                type="button"
                onClick={() => setPulse((v) => Math.min(200, v + 1))}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-bold transition-all active:scale-95 flex items-center justify-center shadow-md"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Time of Day</label>
              <select
                value={measurementTime}
                onChange={(e) => setMeasurementTime(e.target.value as any)}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
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
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="left">Left Arm (Heart side)</option>
                <option value="right">Right Arm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Condition</label>
              <select
                value={measurementContext}
                onChange={(e) => setMeasurementContext(e.target.value as any)}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
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
              placeholder="e.g. Measured after 5 min quiet rest, before morning coffee"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveVitals}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-base sm:text-lg shadow-lg shadow-rose-950/50 transition-all active:scale-98 flex items-center justify-center gap-2"
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

        {/* Right Column: AHA Clinical Gauge & Education (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Real-time AHA Classification & Target Meter */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Clinical AHA Classification</span>
              </h4>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${currentBpClass.badgeColor}`}>
                {currentBpClass.label}
              </span>
            </div>

            {/* Gauge Bars Visual */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Normal (&lt;120/80)</span>
                <span>Crisis (&gt;180)</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 h-3">
                <div className={`rounded-full transition-all ${currentBpClass.categoryIndex >= 0 ? 'bg-emerald-500' : 'bg-slate-800'}`} title="Normal" />
                <div className={`rounded-full transition-all ${currentBpClass.categoryIndex >= 1 ? 'bg-yellow-400' : 'bg-slate-800'}`} title="Elevated" />
                <div className={`rounded-full transition-all ${currentBpClass.categoryIndex >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} title="Stage 1" />
                <div className={`rounded-full transition-all ${currentBpClass.categoryIndex >= 3 ? 'bg-rose-500' : 'bg-slate-800'}`} title="Stage 2" />
                <div className={`rounded-full transition-all ${currentBpClass.categoryIndex >= 4 ? 'bg-rose-700 animate-pulse' : 'bg-slate-800'}`} title="Crisis" />
              </div>
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

          {/* Golden Rules for Senior Measuring */}
          <div className="bg-slate-950/80 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <Info className="w-4 h-4" />
              <span>Accurate Senior Blood Pressure Tips</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 font-medium leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">1.</span>
                <span>Sit quietly with your back supported for <strong className="text-white">5 minutes</strong> before measuring.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">2.</span>
                <span>Keep both feet flat on the floor; do not cross legs or ankles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">3.</span>
                <span>Rest your arm on a table with cuff centered at <strong className="text-white">heart level</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">4.</span>
                <span>Measure at consistent times (e.g. morning before coffee/breakfast).</span>
              </li>
            </ul>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>All vitals data is stored securely and encrypted locally on your device.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Blood Pressure & Pulse History Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" />
              <span>Blood Pressure & Pulse History Log</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Review, edit, or remove past registered vitals records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setHistoryFilter('7d')}
                className={`px-3 py-1 rounded-lg transition-all ${historyFilter === '7d' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setHistoryFilter('30d')}
                className={`px-3 py-1 rounded-lg transition-all ${historyFilter === '30d' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${historyFilter === 'all' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All Records
              </button>
            </div>
          </div>
        </div>

        {filteredRecordedHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
            No blood pressure readings found in this range. Use the form above to register a reading.
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
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecordedHistory.map((rec) => {
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
                        {rec.dailyNotes || 'Routine check-in'}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditPastReading(rec)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit reading"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReading(rec.date)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete reading"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
