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
  Sparkles, 
  Mic, 
  MicOff, 
  Sun, 
  Sunset, 
  Moon, 
  Sunrise,
  Check,
  Volume2,
  CalendarDays
} from 'lucide-react';

interface MedicineTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

const TIME_SLOT_CONFIG: {
  key: TimeOfDay;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  border: string;
  badge: string;
}[] = [
  {
    key: 'morning',
    label: 'Morning Routine',
    icon: Sunrise,
    bg: 'bg-slate-900/80',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    key: 'afternoon',
    label: 'Afternoon / Lunch',
    icon: Sun,
    bg: 'bg-slate-900/80',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  {
    key: 'evening',
    label: 'Evening / Dinner',
    icon: Sunset,
    bg: 'bg-slate-900/80',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    icon: Moon,
    bg: 'bg-slate-900/80',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
];

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [logs, setLogs] = useState<MedicationLogEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // New medication form state
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('');
  const [newMedTimeOfDay, setNewMedTimeOfDay] = useState<TimeOfDay>('morning');

  // Load logs whenever selectedDate changes
  useEffect(() => {
    const dateLogs = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(dateLogs);
  }, [selectedDate]);

  // Compute 7 days of the week for the selected date
  const weekDays = React.useMemo(() => {
    const cur = new Date(selectedDate + 'T00:00:00');
    const day = cur.getDay();
    const diffToMonday = cur.getDate() - day + (day === 0 ? -6 : 1);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(cur);
      d.setDate(diffToMonday + i);
      const dStr = d.toISOString().split('T')[0];
      return {
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      };
    });
  }, [selectedDate, todayStr]);

  // Load all logs for the week
  const weeklyLogs = React.useMemo(() => {
    const res: Record<string, MedicationLogEntry[]> = {};
    weekDays.forEach((wd) => {
      res[wd.dateStr] = HealthStorageService.getMedicationLogsForDate(wd.dateStr);
    });
    return res;
  }, [weekDays, logs]);

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + daysDelta);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleToggleStatus = (medicationId: string, currentStatus: MedicationLogEntry['status'], targetDate = selectedDate) => {
    const nextStatus: MedicationLogEntry['status'] =
      currentStatus === 'taken' ? 'missed' : currentStatus === 'missed' ? 'pending' : 'taken';

    HealthStorageService.updateMedicationLogStatus(targetDate, medicationId, nextStatus);
    const updatedLogs = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(updatedLogs);

    if (profile.soundEnabled) {
      const med = logs.find((l) => l.medicationId === medicationId);
      const statusText = nextStatus === 'taken' ? 'marked as taken' : nextStatus === 'missed' ? 'marked as missed' : 'set to pending';
      SpeechService.speak(`${med?.medicationName || 'Medicine'} ${statusText}`, profile.voiceSpeed);
    }
  };

  const handleMarkSlotAllTaken = (slot: TimeOfDay) => {
    HealthStorageService.markTimeSlotStatus(selectedDate, slot, 'taken');
    const updated = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(updated);

    const slotLabel = TIME_SLOT_CONFIG.find((s) => s.key === slot)?.label || slot;
    const msg = `All ${slotLabel} medications have been marked as taken.`;
    setAiVoiceFeedback(msg);

    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleAddNewMedication = () => {
    if (!newMedName.trim()) return;

    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'As directed',
      instructions: newMedInstructions.trim() || 'Take with water',
      timeOfDay: newMedTimeOfDay,
      active: true,
    };

    HealthStorageService.addMedicationToProfile(newMed);
    const updatedProfile = HealthStorageService.getProfile();
    onUpdateProfile(updatedProfile);

    // Refresh logs for current view
    const refreshed = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(refreshed);

    // Reset form
    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setIsAddModalOpen(false);

    const msg = `Added ${newMed.name} to your ${newMedTimeOfDay} schedule.`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleDeleteMedication = (id: string, name: string) => {
    HealthStorageService.deleteMedicationFromProfile(id);
    const updatedProfile = HealthStorageService.getProfile();
    onUpdateProfile(updatedProfile);

    const refreshed = HealthStorageService.getMedicationLogsForDate(selectedDate);
    setLogs(refreshed);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${name} from schedule.`, profile.voiceSpeed);
    }
  };

  // AI Voice Medication Assistant Parser
  const handleProcessVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    let feedback = '';

    // Check for "mark morning taken"
    if (lower.includes('morning') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('morning');
      return;
    }
    // Check for "mark afternoon taken"
    if (lower.includes('afternoon') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('afternoon');
      return;
    }
    // Check for "mark evening taken"
    if (lower.includes('evening') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('evening');
      return;
    }
    // Check for "mark bedtime taken"
    if (lower.includes('bedtime') && (lower.includes('took') || lower.includes('taken') || lower.includes('mark'))) {
      handleMarkSlotAllTaken('bedtime');
      return;
    }

    // Match specific medicine by name
    const matchingMed = logs.find((l) => lower.includes(l.medicationName.toLowerCase()));
    if (matchingMed) {
      if (lower.includes('miss') || lower.includes('forgot') || lower.includes("didn't")) {
        HealthStorageService.updateMedicationLogStatus(selectedDate, matchingMed.medicationId, 'missed');
        feedback = `Marked ${matchingMed.medicationName} as missed for today.`;
      } else {
        HealthStorageService.updateMedicationLogStatus(selectedDate, matchingMed.medicationId, 'taken');
        feedback = `Marked ${matchingMed.medicationName} as taken for today.`;
      }
      const updated = HealthStorageService.getMedicationLogsForDate(selectedDate);
      setLogs(updated);
    } else if (lower.includes('what') || lower.includes('list') || lower.includes('schedule')) {
      const pendingCount = logs.filter((l) => l.status === 'pending').length;
      feedback = `You have ${logs.length} scheduled medications today. ${pendingCount} are still pending.`;
    } else {
      // Default: mark all morning medications taken
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
    setAiVoiceFeedback('Listening to your medicine update...');

    SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          handleProcessVoiceCommand(text);
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

  // Calculations for adherence scorecard
  const totalCount = logs.length;
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const missedCount = logs.filter((l) => l.status === 'missed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const adherencePercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const isToday = selectedDate === todayStr;
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Date Navigator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
                Daily Prescription Care
              </span>
              {isToday && (
                <span className="text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2 sm:gap-3">
              <Pill className="w-7 h-7 text-emerald-400 flex-shrink-0" />
              <span>Medication Schedule & History</span>
            </h2>
          </div>

          {/* Add Medicine Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Medicine</span>
          </button>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go back to previous day"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Previous</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 rounded-2xl border border-slate-700 flex-1 sm:flex-initial justify-center">
              <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-black text-white text-center truncate">
                {formattedDateTitle}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl border border-slate-700 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go to next day"
            >
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Next</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* View Mode Toggle: Daily Routine vs 7-Day Schedule Matrix */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
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
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                onClick={() => SpeechService.speak(aiVoiceFeedback || 'Say e.g. "Took morning meds" or "Took Lisinopril"', profile.voiceSpeed)}
                className="p-0.5 rounded hover:bg-slate-800 text-emerald-300"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-black text-xs sm:text-sm text-white tracking-tight truncate">Voice Logging Assistant</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">
              {aiVoiceFeedback || 'Say e.g. "Took morning meds" or "Took Lisinopril"'}
            </p>
          </div>
        </div>

        {/* Quick voice chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('I took all my morning medications')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "Took morning meds"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('I took all my evening medications')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "Took evening meds"
          </button>
        </div>
      </div>

      {/* 7-DAY WEEKLY SCHEDULE MATRIX VIEW */}
      {viewMode === 'weekly' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-emerald-400" />
                <span>7-Day Medication Adherence Matrix</span>
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                Overview of all scheduled doses across the week. Click any status circle to toggle confirmation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 min-w-[200px]">Medicine & Routine</th>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {profile.medications.filter((m) => m.active !== false).map((med) => (
                  <tr key={med.id} className="hover:bg-slate-850 transition-colors">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAILY ROUTINE VIEW */}
      {viewMode === 'daily' && (
        <>
          {/* Daily Adherence Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl text-center shadow-lg">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Adherence Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
                {adherencePercent}%
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {takenCount} of {totalCount} Taken
              </span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-3xl text-center shadow-lg">
              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                Taken ✅
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
                {takenCount}
              </span>
              <span className="text-xs font-semibold text-emerald-300/80">Confirmed Doses</span>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-3xl text-center shadow-lg">
              <span className="text-xs font-black text-rose-300 uppercase tracking-wider block">
                Missed ❌
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 block">
                {missedCount}
              </span>
              <span className="text-xs font-semibold text-rose-300/80">Missed Doses</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-3xl text-center shadow-lg">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                Pending ⏳
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">
                {pendingCount}
              </span>
              <span className="text-xs font-semibold text-amber-300/80">Remaining Today</span>
            </div>
          </div>

          {/* Time Slots Checklist */}
          <div className="space-y-4 sm:space-y-6">
            {TIME_SLOT_CONFIG.map((slot) => {
              const slotLogs = logs.filter((l) => l.timeOfDay === slot.key);
              if (slotLogs.length === 0) return null;

              const SlotIcon = slot.icon;
              const allSlotTaken = slotLogs.length > 0 && slotLogs.every((l) => l.status === 'taken');

              return (
                <div
                  key={slot.key}
                  className={`rounded-3xl border p-5 sm:p-7 space-y-4 shadow-xl backdrop-blur-md ${slot.bg} ${slot.border}`}
                >
                  {/* Slot Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white">
                        <SlotIcon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            {slot.label}
                          </h3>
                          {allSlotTaken && (
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              All Taken ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-400">
                          {slotLogs.length} prescribed {slotLogs.length === 1 ? 'medicine' : 'medicines'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkSlotAllTaken(slot.key)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark All {slot.key.charAt(0).toUpperCase() + slot.key.slice(1)} Taken</span>
                      </button>
                    </div>
                  </div>

                  {/* Medication Cards List */}
                  <div className="grid grid-cols-1 gap-3">
                    {slotLogs.map((log) => {
                      const isTaken = log.status === 'taken';
                      const isMissed = log.status === 'missed';

                      return (
                        <div
                          key={log.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isTaken
                              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                              : isMissed
                              ? 'bg-rose-950/30 border-rose-500/40'
                              : 'bg-slate-850 border-slate-750 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Checkbox Button */}
                            <button
                              onClick={() => handleToggleStatus(log.medicationId, log.status)}
                              className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all active:scale-90 flex-shrink-0 ${
                                isTaken
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                                  : isMissed
                                  ? 'bg-rose-600 border-rose-500 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-500'
                              }`}
                              title="Click to toggle Taken / Missed / Pending"
                            >
                              {isTaken ? '✓' : isMissed ? '✕' : ''}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-black text-white">
                                  {log.medicationName}
                                </span>
                                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {log.dosage}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
                                {profile.medications.find((m) => m.id === log.medicationId)?.instructions || 'Take as directed'}
                              </p>

                              {log.takenTime && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Confirmed at {log.takenTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Badges & Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleToggleStatus(log.medicationId, log.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider transition-all ${
                                isTaken
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : isMissed
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                              }`}
                            >
                              {isTaken ? '✅ Taken' : isMissed ? '❌ Missed' : '⏳ Pending'}
                            </button>

                            <button
                              onClick={() => handleDeleteMedication(log.medicationId, log.medicationName)}
                              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                              title="Delete from schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add New Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Pill className="w-6 h-6 text-emerald-400" />
                <span>Add New Medication</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amlodipine, Aspirin, Atorvastatin"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
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
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newMedTimeOfDay}
                    onChange={(e) => setNewMedTimeOfDay(e.target.value as TimeOfDay)}
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
                  Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with morning glass of water"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewMedication}
                disabled={!newMedName.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add to Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
