import React, { useState, useEffect } from 'react';
import { UserProfile, MedicationItem } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { HealthStorageService } from '../../services/healthStorage';
import { BackupService, BackupSnapshotRecord } from '../../services/backupService';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Pill, 
  Activity, 
  Sliders, 
  Volume2, 
  VolumeX,
  RotateCcw, 
  User, 
  Play,
  Check,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  Palette,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetData: (scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue') => void;
  onLogout?: () => void;
  username?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
  onLogout,
  username,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('');
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [snapshotList, setSnapshotList] = useState<BackupSnapshotRecord[]>([]);

  const loadSnapshots = async () => {
    const list = await BackupService.fetchSnapshotHistory();
    setSnapshotList(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'As directed',
      instructions: newMedInstructions.trim() || 'Take in the morning',
      timeOfDay: 'morning',
    };
    setFormData({
      ...formData,
      medications: [...formData.medications, newMed],
    });
    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
  };

  const handleRemoveMedication = (id: string) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((m) => m.id !== id),
    });
  };

  const handleSave = () => {
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-extrabold">Health Settings & Medications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* User Profile Info */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              User Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-base p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 75 })}
                  className="w-full text-base p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>
            </div>

            {/* Account & Password Hash Security Badge */}
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>Account: {username ? `@${username}` : formData.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      Private & Protected
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Protected password security keeps your private health logs safe on this device
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Theme & Appearance Mode (System Default, Dark, Light) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-5 h-5 text-teal-600" />
                  Appearance & Layout Theme
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Choose how your application layout renders. Defaults to your device&apos;s system mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* System Mode (Default) */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'system' })}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 ${
                  (formData.themeMode || 'system') === 'system'
                    ? 'border-teal-600 bg-teal-50/80 shadow-sm ring-2 ring-teal-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">System Mode</div>
                      <div className="text-[10px] font-black uppercase text-teal-700 bg-teal-100/80 px-1.5 py-0.2 rounded w-fit">
                        Recommended (Default)
                      </div>
                    </div>
                  </div>
                  {(formData.themeMode || 'system') === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Automatically syncs with your device daylight and night settings with adaptive wellbeing colors.
                </p>
              </button>

              {/* Dark / Night Mode */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'dark' })}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 ${
                  formData.themeMode === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-800 text-indigo-300">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">Dark / Night</div>
                      <div className="text-[10px] font-bold text-slate-500">Low Eye Strain</div>
                    </div>
                  </div>
                  {formData.themeMode === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Deep slate atmosphere with glowing ambient wellbeing palettes suited for night and sensitive eyes.
                </p>
              </button>

              {/* Light Mode */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'light' })}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 ${
                  formData.themeMode === 'light'
                    ? 'border-amber-600 bg-amber-50/80 shadow-sm ring-2 ring-amber-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">Light Mode</div>
                      <div className="text-[10px] font-bold text-slate-500">Daytime Clarity</div>
                    </div>
                  </div>
                  {formData.themeMode === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Clean, bright daytime aesthetic with crisp contrast and pastel health-adaptive highlights.
                </p>
              </button>
            </div>
          </div>

          {/* Target Blood Pressure */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              Target Blood Pressure Baseline
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Systolic Max (Top)</label>
                <input
                  type="number"
                  value={formData.targetSystolicMax}
                  onChange={(e) => setFormData({ ...formData, targetSystolicMax: Number(e.target.value) || 130 })}
                  className="w-full text-base p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diastolic Max (Bottom)</label>
                <input
                  type="number"
                  value={formData.targetDiastolicMax}
                  onChange={(e) => setFormData({ ...formData, targetDiastolicMax: Number(e.target.value) || 85 })}
                  className="w-full text-base p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Medications Manager */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              Scheduled Morning Medications ({formData.medications.length})
            </h3>
            
            {/* Meds List */}
            <div className="space-y-2">
              {formData.medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div>
                    <span className="font-extrabold text-slate-900 text-base">{med.name}</span>
                    <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {med.dosage}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{med.instructions}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove Medication"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Medication Row */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-700">Add New Medication</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Medication name (e.g. Amlodipine)"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 5 mg)"
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Instructions (e.g. Take with morning glass of water)"
                value={newMedInstructions}
                onChange={(e) => setNewMedInstructions(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
              />
              <button
                onClick={handleAddMedication}
                disabled={!newMedName.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>
          </div>

          {/* Voice & Speaker Settings */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-indigo-600" />
                  AI Voice & Speaker Selection
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Choose your preferred AI speaking persona and test how it sounds
                </p>
              </div>
            </div>

            {/* Mute Voice AI Setting Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all bg-slate-50 border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${formData.soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {formData.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>AI Voice Audio:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      formData.soundEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {formData.soundEnabled ? 'Active (Speaking)' : 'Muted (Default)'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {formData.soundEnabled
                      ? 'AI bot speaks questions and guidance aloud'
                      : 'AI bot is silent; all questions and messages appear on screen'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, soundEnabled: !formData.soundEnabled })}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all active:scale-95 border ${
                  formData.soundEnabled
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                }`}
              >
                {formData.soundEnabled ? 'Mute Voice' : 'Unmute Voice'}
              </button>
            </div>

            {/* Curated Voice Personas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURATED_VOICE_PERSONAS.map((persona) => {
                const isSelected = (formData.voicePersona || 'samantha') === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        voicePersona: persona.id,
                        voiceId: undefined, // Clear specific voiceURI to use persona mapping
                      });
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl flex-shrink-0">{persona.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-sm">{persona.name}</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                              {persona.accent}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-700 block">
                            {persona.label.split('•')[1]?.trim() || persona.gender}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {persona.description}
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          SpeechService.speak(
                            persona.sampleText,
                            formData.voiceSpeed,
                            undefined,
                            persona.id,
                            formData.voicePitch || persona.defaultPitch
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-slate-200 hover:border-indigo-300 flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                        title={`Listen to ${persona.name}`}
                      >
                        <Play className="w-3 h-3 fill-indigo-700 text-indigo-700" />
                        <span>Play Sample</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Talking Speed Settings */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">
                  Talking Speed ({formData.voiceSpeed}x)
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {formData.voiceSpeed <= 0.75 ? 'Very Slow' : formData.voiceSpeed <= 0.9 ? 'Senior Friendly' : formData.voiceSpeed <= 1.0 ? 'Normal' : 'Fast'}
                </span>
              </div>

              {/* Speed Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { speed: 0.75, label: '0.75x Slow' },
                  { speed: 0.9, label: '0.9x Relaxed' },
                  { speed: 1.0, label: '1.0x Normal (Default)' },
                  { speed: 1.25, label: '1.25x Fast' },
                ].map((item) => (
                  <button
                    key={item.speed}
                    type="button"
                    onClick={() => setFormData({ ...formData, voiceSpeed: item.speed })}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border-2 text-center transition-all ${
                      Math.abs(formData.voiceSpeed - item.speed) < 0.05
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Fine-tuning range slider */}
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={formData.voiceSpeed}
                onChange={(e) => setFormData({ ...formData, voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Feature #5: SQLite Database & Automated Backup & Restore */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">💾</span>
                Local Database & Backup Snapshots
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SQLite Active
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Your health check-ins, medication adherence, and reminders are saved to a local high-performance SQLite database. You can export complete backups anytime or restore previous records.
            </p>

            {/* Backup & Restore Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export / Download Backup Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const checkIns = HealthStorageService.getCheckIns();
                    const reminders = HealthStorageService.getAllReminders();
                    const activities = HealthStorageService.getAllActivityLogs();
                    const result = await BackupService.exportAndDownloadBackup({
                      profile: formData,
                      checkIns,
                      reminders,
                      activities,
                    });
                    setBackupStatus(`✅ Downloaded: ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
                    loadSnapshots();
                  } catch (e: any) {
                    setBackupStatus(`❌ Export failed: ${e?.message || 'Unknown error'}`);
                  }
                }}
                className="p-3.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-98"
              >
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-blue-950">Download Backup File</div>
                  <div className="text-xs text-blue-700">Save full JSON snapshot to your computer</div>
                </div>
              </button>

              {/* Restore from File Button */}
              <label className="p-3.5 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-2xl flex items-center gap-3 text-left cursor-pointer transition-all active:scale-98">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-purple-950">Restore from Backup</div>
                  <div className="text-xs text-purple-700">Upload and import a previous backup file</div>
                </div>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await BackupService.parseBackupFile(file);
                      if (data.profile) {
                        setFormData(data.profile);
                        HealthStorageService.saveProfile(data.profile);
                      }
                      if (data.checkIns && data.checkIns.length > 0) {
                        HealthStorageService.saveCheckIns(data.checkIns);
                      }
                      if (data.reminders && data.reminders.length > 0) {
                        HealthStorageService.saveAllReminders(data.reminders);
                      }
                      if (data.activities) {
                        if (Array.isArray(data.activities)) {
                          // convert array to record if needed
                          const recordLogs: Record<string, any[]> = {};
                          for (const act of data.activities) {
                            if (!recordLogs[act.date]) recordLogs[act.date] = [];
                            recordLogs[act.date].push(act);
                          }
                          HealthStorageService.saveAllActivityLogs(recordLogs);
                        } else {
                          HealthStorageService.saveAllActivityLogs(data.activities);
                        }
                      }
                      setBackupStatus(`✅ Successfully restored ${data.checkIns.length} check-ins and profile data.`);
                      setTimeout(() => {
                        window.location.reload();
                      }, 1200);
                    } catch (err: any) {
                      setBackupStatus(`❌ Restore error: ${err?.message || 'Invalid file'}`);
                    }
                  }}
                />
              </label>
            </div>

            {backupStatus && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 animate-fadeIn">
                {backupStatus}
              </div>
            )}

            {/* Snapshot history list if available */}
            {snapshotList.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recent Local Snapshots
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {snapshotList.slice(0, 5).map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                        {snap.filename}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {snap.total_records} records • {(snap.file_size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Encryption */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🔒</span>
              Security & Privacy Guarantee
            </h3>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm font-semibold text-emerald-950 space-y-1.5">
              <p className="font-extrabold text-emerald-900">100% On-Device & Zero Cloud Transmission</p>
              <p>• All health records, check-in history, notes, and medication lists are stored locally on your device.</p>
              <p>• Data is encrypted using military-grade <strong>AES-GCM 256-bit encryption</strong> via the Web Crypto API.</p>
              <p>• No personal health information (PHI) is sold, tracked, or sent to external marketing servers.</p>
            </div>
          </div>

          {/* Reset Demo Data Scenarios */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-slate-600" />
              Seed Demo Clinical Scenarios
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onResetData('balanced'); onClose(); }}
                className="p-3 text-xs font-extrabold rounded-xl border border-slate-300 hover:bg-emerald-50 text-slate-800 text-left"
              >
                🌱 1. Balanced & Active Senior
              </button>
              <button
                onClick={() => { onResetData('rising_bp'); onClose(); }}
                className="p-3 text-xs font-extrabold rounded-xl border border-slate-300 hover:bg-rose-50 text-slate-800 text-left"
              >
                📈 2. Rising BP Trend (Hypertension)
              </button>
              <button
                onClick={() => { onResetData('missed_meds'); onClose(); }}
                className="p-3 text-xs font-extrabold rounded-xl border border-slate-300 hover:bg-amber-50 text-slate-800 text-left"
              >
                💊 3. Medication Miss Pattern
              </button>
              <button
                onClick={() => { onResetData('dizziness_fatigue'); onClose(); }}
                className="p-3 text-xs font-extrabold rounded-xl border border-slate-300 hover:bg-purple-50 text-slate-800 text-left"
              >
                🩺 4. Dizziness & Doctor Alert
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
