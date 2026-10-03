import React, { useState, useEffect } from 'react';
import { UserProfile, MedicationItem, MedicationLogEntry, TimeOfDay } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Pill, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3,
  Sparkles, 
  Mic, 
  MicOff, 
  Sun, 
  Sunset, 
  Moon, 
  Sunrise,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Volume2,
  CalendarDays,
  Filter
} from 'lucide-react';

interface MedicineTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

const TIME_SLOT_CONFIG: {
  key: TimeOfDay;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
}[] = [
  {
    key: 'morning',
    label: 'Morning Routine',
    sublabel: 'Breakfast & Early Morning (07:00 – 10:00 AM)',
    icon: Sunrise,
    accentColor: 'text-amber-400',
    bgGradient: 'from-amber-950/30 via-slate-900 to-slate-900/90',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    key: 'afternoon',
    label: 'Afternoon / Lunch',
    sublabel: 'Midday & Mealtime (12:00 – 02:00 PM)',
    icon: Sun,
    accentColor: 'text-yellow-400',
    bgGradient: 'from-yellow-950/30 via-slate-900 to-slate-900/90',
    borderColor: 'border-yellow-500/30',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  {
    key: 'evening',
    label: 'Evening / Dinner',
    sublabel: 'Dinner & Early Dusk (06:00 – 08:00 PM)',
    icon: Sunset,
    accentColor: 'text-orange-400',
    bgGradient: 'from-orange-950/30 via-slate-900 to-slate-900/90',
    borderColor: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    sublabel: 'Night Routine (09:00 – 11:00 PM)',
    icon: Moon,
    accentColor: 'text-indigo-400',
    bgGradient: 'from-indigo-950/30 via-slate-900 to-slate-900/90',
    borderColor: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
];

const PRESET_MEDICATIONS = [
  { name: 'Lisinopril', dosage: '10 mg', timeOfDay: 'morning' as TimeOfDay, instructions: 'Take with full glass of water for blood pressure' },
  { name: 'Metformin', dosage: '500 mg', timeOfDay: 'morning' as TimeOfDay, instructions: 'Take with food for blood sugar support' },
  { name: 'Atorvastatin', dosage: '20 mg', timeOfDay: 'bedtime' as TimeOfDay, instructions: 'Take at bedtime for cholesterol control' },
  { name: 'Amlodipine', dosage: '5 mg', timeOfDay: 'morning' as TimeOfDay, instructions: 'Take daily for cardiovascular pressure' },
  { name: 'Vitamin D3', dosage: '1000 IU', timeOfDay: 'morning' as TimeOfDay, instructions: 'Bone & immune wellness supplement' },
  { name: 'Baby Aspirin', dosage: '81 mg', timeOfDay: 'morning' as TimeOfDay, instructions: 'Cardiovascular protection' },
  { name: 'Melatonin', dosage: '3 mg', timeOfDay: 'bedtime' as TimeOfDay, instructions: 'Take 30 minutes before sleep' },
  { name: 'CoQ10', dosage: '100 mg', timeOfDay: 'afternoon' as TimeOfDay, instructions: 'Heart health with lunch' },
];

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [activeSlotFilter, setActiveSlotFilter] = useState<'all' | TimeOfDay>('all');
  const [logs, setLogs] = useState<MedicationLogEntry[]>([]);
  const [matrixRevision, setMatrixRevision] = useState<number>(0);
  
  // Modals & State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMedication, setEditingMedication] = useState<MedicationItem | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // Form State
  const [medName, setMedName] = useState<string>('');
  const [medDosage, setMedDosage] = useState<string>('');
  const [medInstructions, setMedInstructions] = useState<string>('');
  const [medTimeOfDay, setMedTimeOfDay] = useState<TimeOfDay>('morning');

  // Load date logs
  useEffect(() => {
    const dateLogs = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(dateLogs);
  }, [selectedDate, profile.medications, matrixRevision]);

  // Compute 7 days for weekly matrix
  const weekDays = React.useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    const day = cur.getDay();
    const diffToMonday = cur.getDate() - day + (day === 0 ? -6 : 1);

    return Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(y, m - 1, diffToMonday + i);
      const yStr = dt.getFullYear();
      const mStr = String(dt.getMonth() + 1).padStart(2, '0');
      const dStr = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      return {
        dateStr,
        dayName: dt.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: dt.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      };
    });
  }, [selectedDate, todayStr]);

  // Weekly logs map
  const weeklyLogs = React.useMemo(() => {
    const res: Record<string, MedicationLogEntry[]> = {};
    weekDays.forEach((wd) => {
      res[wd.dateStr] = HealthStorageService.getMedicationLogsForDate(wd.dateStr);
    });
    return res;
  }, [weekDays, matrixRevision]);

  const handleDateChange = (daysDelta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const cur = new Date(y, m - 1, d + daysDelta);
    const yStr = cur.getFullYear();
    const mStr = String(cur.getMonth() + 1).padStart(2, '0');
    const dStr = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleToggleStatus = (medicationId: string, currentStatus: MedicationLogEntry['status'], targetDate = selectedDate) => {
    const nextStatus: MedicationLogEntry['status'] =
      currentStatus === 'taken' ? 'missed' : currentStatus === 'missed' ? 'pending' : 'taken';

    HealthStorageService.updateMedicationLogStatus(targetDate, medicationId, nextStatus);
    setMatrixRevision((prev) => prev + 1);

    if (profile.soundEnabled) {
      const med = (profile.medications || []).find((l) => l.id === medicationId);
      const statusText = nextStatus === 'taken' ? 'confirmed taken' : nextStatus === 'missed' ? 'marked as missed' : 'reset to pending';
      SpeechService.speak(`${med?.name || 'Medication'} ${statusText}`, profile.voiceSpeed);
    }
  };

  const handleSetExplicitStatus = (medicationId: string, status: MedicationLogEntry['status'], targetDate = selectedDate) => {
    HealthStorageService.updateMedicationLogStatus(targetDate, medicationId, status);
    setMatrixRevision((prev) => prev + 1);

    if (profile.soundEnabled) {
      const med = (profile.medications || []).find((l) => l.id === medicationId);
      const statusText = status === 'taken' ? 'confirmed taken' : status === 'missed' ? 'marked as missed' : 'reset to pending';
      SpeechService.speak(`${med?.name || 'Medication'} ${statusText}`, profile.voiceSpeed);
    }
  };

  const handleMarkSlotAllTaken = (slot: TimeOfDay) => {
    HealthStorageService.markTimeSlotStatus(selectedDate, slot, 'taken');
    setMatrixRevision((prev) => prev + 1);

    const slotLabel = TIME_SLOT_CONFIG.find((s) => s.key === slot)?.label || slot;
    const msg = `All ${slotLabel} medications marked as taken.`;
    setAiVoiceFeedback(msg);

    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const openAddModal = () => {
    setEditingMedication(null);
    setMedName('');
    setMedDosage('');
    setMedInstructions('');
    setMedTimeOfDay('morning');
    setIsModalOpen(true);
  };

  const openEditModal = (med: MedicationItem) => {
    setEditingMedication(med);
    setMedName(med.name);
    setMedDosage(med.dosage);
    setMedInstructions(med.instructions);
    setMedTimeOfDay(med.timeOfDay);
    setIsModalOpen(true);
  };

  const handleSaveMedication = () => {
    if (!medName.trim()) return;

    if (editingMedication) {
      const updated: MedicationItem = {
        ...editingMedication,
        name: medName.trim(),
        dosage: medDosage.trim() || 'As prescribed',
        instructions: medInstructions.trim() || 'Take as directed',
        timeOfDay: medTimeOfDay,
        active: true,
      };
      HealthStorageService.updateMedicationInProfile(updated);
      const updatedProfile = HealthStorageService.getProfile();
      onUpdateProfile(updatedProfile);
      setMatrixRevision((prev) => prev + 1);
      setIsModalOpen(false);

      const msg = `Updated ${updated.name}.`;
      setAiVoiceFeedback(msg);
      if (profile.soundEnabled) SpeechService.speak(msg, profile.voiceSpeed);
    } else {
      const newMed: MedicationItem = {
        id: `med-${Date.now()}`,
        name: medName.trim(),
        dosage: medDosage.trim() || 'As directed',
        instructions: medInstructions.trim() || 'Take with water',
        timeOfDay: medTimeOfDay,
        active: true,
      };
      HealthStorageService.addMedicationToProfile(newMed);
      const updatedProfile = HealthStorageService.getProfile();
      onUpdateProfile(updatedProfile);
      setMatrixRevision((prev) => prev + 1);
      setIsModalOpen(false);

      const msg = `Added ${newMed.name} to ${medTimeOfDay} routine.`;
      setAiVoiceFeedback(msg);
      if (profile.soundEnabled) SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleDeleteMedication = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your active medication schedule?`)) {
      return;
    }
    HealthStorageService.deleteMedicationFromProfile(id);
    const updatedProfile = HealthStorageService.getProfile();
    onUpdateProfile(updatedProfile);
    setMatrixRevision((prev) => prev + 1);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${name} from schedule.`, profile.voiceSpeed);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_MEDICATIONS[0]) => {
    setMedName(preset.name);
    setMedDosage(preset.dosage);
    setMedTimeOfDay(preset.timeOfDay);
    setMedInstructions(preset.instructions);
  };

  // AI Voice Medication Assistant Parser
  const handleProcessVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    let feedback = '';

    if (lower.includes('morning') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('morning');
      return;
    }
    if (lower.includes('afternoon') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('afternoon');
      return;
    }
    if (lower.includes('evening') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('evening');
      return;
    }
    if (lower.includes('bedtime') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('bedtime');
      return;
    }

    const matchingMed = logs.find((l) => lower.includes(l.medicationName.toLowerCase()));
    if (matchingMed) {
      if (lower.includes('miss') || lower.includes('forgot') || lower.includes("didn't")) {
        handleSetExplicitStatus(matchingMed.medicationId, 'missed');
        feedback = `Marked ${matchingMed.medicationName} as missed for today.`;
      } else {
        handleSetExplicitStatus(matchingMed.medicationId, 'taken');
        feedback = `Marked ${matchingMed.medicationName} as taken for today.`;
      }
    } else if (lower.includes('what') || lower.includes('list') || lower.includes('schedule')) {
      const pendingCount = logs.filter((l) => l.status === 'pending').length;
      feedback = `You have ${logs.length} scheduled medications today. ${pendingCount} are pending.`;
    } else {
      handleMarkSlotAllTaken('morning');
      return;
    }

    setAiVoiceFeedback(feedback);
    if (profile.soundEnabled && feedback) {
      SpeechService.speak(feedback, profile.voiceSpeed);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setAiVoiceFeedback('Listening to your medication update...');

    SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          handleProcessVoiceCommand(text);
        }
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  // Calculations for adherence scorecard
  const totalCount = logs.length;
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const missedCount = logs.filter((l) => l.status === 'missed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const isToday = selectedDate === todayStr;
  const [sY, sM, sD] = selectedDate.split('-').map(Number);
  const dateObj = new Date(sY, sM - 1, sD);
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const activeMedications = (profile.medications || []).filter((m) => m.active !== false);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      
      {/* Top Banner & Date Navigator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Pill className="w-3.5 h-3.5" />
                Prescription & Routine Manager
              </span>
              {isToday && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Daily Medication Schedule</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Track morning, afternoon, evening, and bedtime prescriptions with adherence verification.
            </p>
          </div>

          {/* Add New Medication CTA */}
          <button
            onClick={openAddModal}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Add Medication</span>
          </button>
        </div>

        {/* Date Navigator Bar & Mode Toggles */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-5">
          {/* Day Stepper */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go back to previous day"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Previous</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 rounded-2xl border border-slate-700 flex-1 sm:flex-initial justify-center">
              <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-black text-white text-center truncate">
                {formattedDateTitle}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go to next day"
            >
              <span className="hidden sm:inline text-xs font-bold">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Controls: Mode Switcher & Jump to Today */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  viewMode === 'daily'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Daily Routine</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  viewMode === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>7-Day Matrix</span>
              </button>
            </div>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-colors text-center"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-950/50'
                : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
            }`}
            title="Speak medication update"
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-emerald-300" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(aiVoiceFeedback || 'Say "Took morning meds" or "Took Lisinopril"', profile.voiceSpeed)}
                className="p-0.5 rounded hover:bg-slate-800 text-emerald-300"
                title="Listen to feedback"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-black text-xs sm:text-sm text-white tracking-tight truncate">Voice Prescription Assistant</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">
              {aiVoiceFeedback || 'Tap mic and say: "Took morning meds", "Took Lisinopril", or "What meds do I take?"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Shortcut Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('I took all my morning medications')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "Took morning meds"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('I took all my evening medications')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "Took evening meds"
          </button>
        </div>
      </div>

      {/* DAILY ROUTINE VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {/* Adherence Overview Scorecard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Daily Adherence
              </span>
              <div className="my-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{adherencePercent}%</span>
                <span className="text-xs text-slate-400 font-bold">compliance</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${adherencePercent}%` }} 
                />
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-3xl shadow-lg">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Taken ({takenCount})
              </span>
              <span className="text-3xl font-black text-emerald-400 my-1 block">
                {takenCount}
              </span>
              <span className="text-xs font-medium text-slate-300">Confirmed prescribed doses</span>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-3xl shadow-lg">
              <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Missed ({missedCount})
              </span>
              <span className="text-3xl font-black text-rose-400 my-1 block">
                {missedCount}
              </span>
              <span className="text-xs font-medium text-slate-300">Reported missed doses</span>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-3xl shadow-lg">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Pending ({pendingCount})
              </span>
              <span className="text-3xl font-black text-amber-400 my-1 block">
                {pendingCount}
              </span>
              <span className="text-xs font-medium text-slate-300">Remaining for the day</span>
            </div>
          </div>

          {/* Time Slot Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 px-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setActiveSlotFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeSlotFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              All Times ({logs.length})
            </button>
            {TIME_SLOT_CONFIG.map((slot) => {
              const count = logs.filter((l) => l.timeOfDay === slot.key).length;
              return (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlotFilter(slot.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeSlotFilter === slot.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {slot.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Time Slot Sections */}
          <div className="space-y-5">
            {TIME_SLOT_CONFIG.map((slot) => {
              if (activeSlotFilter !== 'all' && activeSlotFilter !== slot.key) return null;

              const slotLogs = logs.filter((l) => l.timeOfDay === slot.key);
              if (slotLogs.length === 0 && activeSlotFilter !== slot.key) return null;

              const SlotIcon = slot.icon;
              const allSlotTaken = slotLogs.length > 0 && slotLogs.every((l) => l.status === 'taken');
              const slotTakenCount = slotLogs.filter((l) => l.status === 'taken').length;

              return (
                <div
                  key={slot.key}
                  className={`rounded-3xl border p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-md bg-gradient-to-br ${slot.bgGradient} ${slot.borderColor}`}
                >
                  {/* Slot Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white">
                        <SlotIcon className={`w-6 h-6 ${slot.accentColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-black text-white">
                            {slot.label}
                          </h3>
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${slot.badgeBg}`}>
                            {slotTakenCount}/{slotLogs.length} Taken
                          </span>
                          {allSlotTaken && slotLogs.length > 0 && (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Complete ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-400">
                          {slot.sublabel}
                        </p>
                      </div>
                    </div>

                    {slotLogs.length > 0 && (
                      <button
                        onClick={() => handleMarkSlotAllTaken(slot.key)}
                        className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-end sm:self-center"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark All {slot.key.charAt(0).toUpperCase() + slot.key.slice(1)} Taken</span>
                      </button>
                    )}
                  </div>

                  {/* Empty state for slot */}
                  {slotLogs.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                      <p className="text-xs font-semibold">No medications scheduled for {slot.label.toLowerCase()}.</p>
                      <button
                        onClick={openAddModal}
                        className="mt-2 text-xs font-black text-emerald-400 hover:underline"
                      >
                        + Add a prescription for this time
                      </button>
                    </div>
                  ) : (
                    /* Medication Cards Grid */
                    <div className="grid grid-cols-1 gap-3">
                      {slotLogs.map((log) => {
                        const isTaken = log.status === 'taken';
                        const isMissed = log.status === 'missed';
                        const medItem = activeMedications.find((m) => m.id === log.medicationId);

                        return (
                          <div
                            key={log.id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isTaken
                                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                                : isMissed
                                ? 'bg-rose-950/30 border-rose-500/40 shadow-sm'
                                : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              {/* One-click Checkbox Button */}
                              <button
                                onClick={() => handleToggleStatus(log.medicationId, log.status)}
                                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all active:scale-90 flex-shrink-0 ${
                                  isTaken
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                                    : isMissed
                                    ? 'bg-rose-600 border-rose-400 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-500'
                                }`}
                                title="Click to cycle Taken / Missed / Pending"
                              >
                                {isTaken ? <Check className="w-6 h-6 text-white stroke-[3]" /> : isMissed ? <XCircle className="w-6 h-6 text-white stroke-[2.5]" /> : <span className="w-3 h-3 rounded-full bg-slate-600" />}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base sm:text-lg font-black text-white">
                                    {log.medicationName}
                                  </span>
                                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {log.dosage}
                                  </span>
                                </div>

                                <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                                  {medItem?.instructions || log.dosage || 'Take as directed'}
                                </p>

                                {log.takenTime && isTaken && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 mt-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    <Clock className="w-3 h-3" />
                                    Confirmed taken at {log.takenTime}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status Segmented Switcher & Edit Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                              {/* Explicit 3-State Buttons */}
                              <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-750">
                                <button
                                  onClick={() => handleSetExplicitStatus(log.medicationId, 'taken')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                    isTaken
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-emerald-300'
                                  }`}
                                  title="Mark taken"
                                >
                                  ✓ Taken
                                </button>
                                <button
                                  onClick={() => handleSetExplicitStatus(log.medicationId, 'pending')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                    !isTaken && !isMissed
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-amber-300'
                                  }`}
                                  title="Mark pending"
                                >
                                  ⏳ Pending
                                </button>
                                <button
                                  onClick={() => handleSetExplicitStatus(log.medicationId, 'missed')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                    isMissed
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-rose-300'
                                  }`}
                                  title="Mark missed"
                                >
                                  ✕ Missed
                                </button>
                              </div>

                              {/* Edit Medicine */}
                              {medItem && (
                                <button
                                  onClick={() => openEditModal(medItem)}
                                  className="p-2 text-slate-400 hover:text-blue-300 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                                  title="Edit medication details"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Medicine */}
                              <button
                                onClick={() => handleDeleteMedication(log.medicationId, log.medicationName)}
                                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                                title="Remove from schedule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-DAY WEEKLY SCHEDULE MATRIX VIEW */}
      {viewMode === 'weekly' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-emerald-400" />
                <span>7-Day Medication Adherence Matrix</span>
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
                Overview of all scheduled doses across the week. Click any status circle to toggle confirmation.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" /> Taken</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-rose-600 inline-block" /> Missed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700 inline-block" /> Pending</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 min-w-[200px]">Medication & Routine</th>
                  {weekDays.map((wd) => (
                    <th 
                      key={wd.dateStr} 
                      className={`py-3 px-2 text-center min-w-[70px] ${
                        wd.isSelected ? 'bg-emerald-500/10 rounded-t-xl text-emerald-300 font-black' : ''
                      }`}
                    >
                      <div className="text-[11px] text-slate-400">{wd.dayName}</div>
                      <div className={`text-base font-black ${wd.isToday ? 'text-emerald-400 underline' : 'text-slate-200'}`}>
                        {wd.dayNumber}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[80px]">7D Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {activeMedications.map((med) => {
                  let weekTakenCount = 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm sm:text-base">
                            {med.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {med.dosage}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium capitalize mt-0.5 flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400">{med.timeOfDay}</span>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{med.instructions}</span>
                        </div>
                      </td>

                      {weekDays.map((wd) => {
                        const dayLogs = weeklyLogs[wd.dateStr] || [];
                        const medLog = dayLogs.find((l) => l.medicationId === med.id);
                        const status = medLog?.status || 'pending';
                        if (status === 'taken') weekTakenCount++;

                        return (
                          <td 
                            key={wd.dateStr} 
                            className={`py-3 px-2 text-center align-middle ${
                              wd.isSelected ? 'bg-emerald-500/5' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggleStatus(med.id, status, wd.dateStr)}
                              className={`w-9 h-9 mx-auto rounded-xl border flex items-center justify-center font-black text-sm transition-all active:scale-90 shadow-sm ${
                                status === 'taken'
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/50'
                                  : status === 'missed'
                                  ? 'bg-rose-600 border-rose-500 text-white shadow-rose-950/50'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                              }`}
                              title={`${med.name} on ${wd.dateStr}: ${status.toUpperCase()} (Click to toggle)`}
                            >
                              {status === 'taken' ? '✓' : status === 'missed' ? '✕' : '•'}
                            </button>
                          </td>
                        );
                      })}

                      {/* 7-Day Adherence Percentage for this med */}
                      <td className="py-3 px-3 text-center align-middle font-black text-sm text-emerald-400">
                        {Math.round((weekTakenCount / 7) * 100)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Pill className="w-6 h-6 text-emerald-400" />
                <span>{editingMedication ? 'Edit Medication' : 'Add New Medication'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets (Only on Add mode) */}
            {!editingMedication && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Quick Senior Presets (Tap to Fill)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {PRESET_MEDICATIONS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                    >
                      + {p.name} ({p.dosage})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lisinopril, Metformin, Atorvastatin"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 mg, 1 tablet"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Time Routine
                  </label>
                  <select
                    value={medTimeOfDay}
                    onChange={(e) => setMedTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="morning">Morning 🌅</option>
                    <option value="afternoon">Afternoon ☀️</option>
                    <option value="evening">Evening 🌆</option>
                    <option value="bedtime">Bedtime 🌙</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Instructions / Doctor Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with morning glass of water before breakfast"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMedication}
                disabled={!medName.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black shadow-lg flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingMedication ? 'Save Changes' : 'Add to Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
