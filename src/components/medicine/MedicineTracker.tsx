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
  Check
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
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    key: 'afternoon',
    label: 'Afternoon / Lunch',
    icon: Sun,
    bg: 'bg-yellow-50/70',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
  {
    key: 'evening',
    label: 'Evening / Dinner',
    icon: Sunset,
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    icon: Moon,
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
];

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
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

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + daysDelta);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleToggleStatus = (medicationId: string, currentStatus: MedicationLogEntry['status']) => {
    const nextStatus: MedicationLogEntry['status'] =
      currentStatus === 'taken' ? 'missed' : currentStatus === 'missed' ? 'pending' : 'taken';

    HealthStorageService.updateMedicationLogStatus(selectedDate, medicationId, nextStatus);
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
    <div className="max-w-5xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Banner & Date Navigator */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Daily Medicine Tracker
              </span>
              {isToday && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Today
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2 sm:gap-3">
              <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <span>Medication Schedule & History</span>
            </h2>
          </div>

          {/* Add Medicine Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add New Medicine
          </button>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 sm:pt-6">
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go back to previous day"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Previous</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex-1 sm:flex-initial justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-base font-extrabold text-slate-900 text-center truncate">
                {formattedDateTitle}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
              title="Go to next day"
            >
              <span className="hidden sm:inline text-xs sm:text-sm font-bold">Next</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm rounded-xl border border-emerald-300 transition-colors text-center"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* AI Voice Assistant Quick Action Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleVoice}
            className={`p-3.5 rounded-2xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Speak medication update to AI"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h4 className="font-extrabold text-lg">AI Medication Assistant</h4>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
              {aiVoiceFeedback || 'Say e.g. "I took my morning pills" or "Mark Lisinopril as taken"'}
            </p>
          </div>
        </div>

        {/* Quick voice chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleProcessVoiceCommand('I took all my morning medications')}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all"
          >
            "Took morning meds"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('I took all my evening medications')}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all"
          >
            "Took evening meds"
          </button>
        </div>
      </div>

      {/* Daily Adherence Scorecard */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
            Adherence Rate
          </span>
          <span className="text-3xl font-black text-emerald-700 mt-1 block">
            {adherencePercent}%
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {takenCount} of {totalCount} Taken
          </span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
          <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
            Taken ✅
          </span>
          <span className="text-3xl font-black text-emerald-700 mt-1 block">
            {takenCount}
          </span>
          <span className="text-xs font-semibold text-emerald-800">Confirmed Doses</span>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
          <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
            Missed ❌
          </span>
          <span className="text-3xl font-black text-rose-700 mt-1 block">
            {missedCount}
          </span>
          <span className="text-xs font-semibold text-rose-800">Missed Doses</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
          <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
            Pending ⏳
          </span>
          <span className="text-3xl font-black text-amber-700 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-xs font-semibold text-amber-800">Remaining Today</span>
        </div>
      </div>

      {/* Time Slots Checklist */}
      <div className="space-y-6">
        {TIME_SLOT_CONFIG.map((slot) => {
          const slotLogs = logs.filter((l) => l.timeOfDay === slot.key);
          if (slotLogs.length === 0) return null;

          const SlotIcon = slot.icon;
          const allSlotTaken = slotLogs.length > 0 && slotLogs.every((l) => l.status === 'taken');

          return (
            <div
              key={slot.key}
              className={`rounded-3xl border-2 p-6 sm:p-8 space-y-4 shadow-sm ${slot.bg} ${slot.border}`}
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-800">
                    <SlotIcon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {slot.label}
                      </h3>
                      {allSlotTaken && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          All Taken ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">
                      {slotLogs.length} prescribed {slotLogs.length === 1 ? 'medicine' : 'medicines'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkSlotAllTaken(slot.key)}
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded-xl border-2 border-emerald-300 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Mark All {slot.key.charAt(0).toUpperCase() + slot.key.slice(1)} Taken
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
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isTaken
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                          : isMissed
                          ? 'bg-rose-50/90 border-rose-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Checkbox Button */}
                        <button
                          onClick={() => handleToggleStatus(log.medicationId, log.status)}
                          className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-extrabold text-xl transition-all active:scale-90 flex-shrink-0 ${
                            isTaken
                              ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-200'
                              : isMissed
                              ? 'bg-rose-600 border-rose-700 text-white'
                              : 'bg-white hover:bg-slate-100 border-slate-400 text-slate-400'
                          }`}
                          title="Click to toggle Taken / Missed / Pending"
                        >
                          {isTaken ? '✓' : isMissed ? '✕' : ''}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-slate-900">
                              {log.medicationName}
                            </span>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {log.dosage}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-slate-600 mt-0.5">
                            {profile.medications.find((m) => m.id === log.medicationId)?.instructions || 'Take as directed'}
                          </p>

                          {log.takenTime && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              Recorded at {log.takenTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleStatus(log.medicationId, log.status)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border uppercase tracking-wider transition-all ${
                            isTaken
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : isMissed
                              ? 'bg-rose-600 text-white border-rose-700'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isTaken ? '✅ Taken' : isMissed ? '❌ Missed' : '⏳ Pending'}
                        </button>

                        <button
                          onClick={() => handleDeleteMedication(log.medicationId, log.medicationName)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
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

      {/* Add New Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-6 h-6 text-emerald-600" />
                Add New Medication
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amlodipine, Aspirin, Atorvastatin"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 mg, 1 tablet"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newMedTimeOfDay}
                    onChange={(e) => setNewMedTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="morning">Morning 🌅</option>
                    <option value="afternoon">Afternoon ☀️</option>
                    <option value="evening">Evening 🌆</option>
                    <option value="bedtime">Bedtime 🌙</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1">
                  Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with breakfast glass of water"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  className="w-full text-base p-3.5 rounded-2xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewMedication}
                disabled={!newMedName.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
