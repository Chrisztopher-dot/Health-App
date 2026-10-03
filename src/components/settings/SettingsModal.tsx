import React, { useState, useEffect } from 'react';
import { UserProfile, MedicationItem } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { BackupService } from '../../services/backupService';
import { HealthStorageService } from '../../services/healthStorage';
import { 
  X, 
  Save, 
  User, 
  Activity, 
  Pill, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Check, 
  Sliders, 
  Play, 
  Palette, 
  Moon, 
  Sun, 
  Monitor, 
  ShieldCheck, 
  LogOut, 
  Download, 
  Upload 
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
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;

    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard Dose',
      instructions: newMedInstructions.trim() || 'Take with water',
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn text-white">
        {/* Modal Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Health Settings & Profile</h2>
              <p className="text-xs text-slate-400 font-medium">Personalize your care parameters, medications & AI companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* User Profile Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>User Profile</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">User Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 75 })}
                  className="w-full text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Account & Security Badge */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>Account: {username ? `@${username}` : formData.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Private & Protected
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Military-grade on-device encryption protects your private records
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
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Theme & Appearance Mode */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Appearance & Theme</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* System Mode */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'system' })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                  (formData.themeMode || 'system') === 'system'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm">System Mode</div>
                      <div className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded w-fit">
                        Recommended
                      </div>
                    </div>
                  </div>
                  {(formData.themeMode || 'system') === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Automatically syncs with daylight and dark environment settings.
                </p>
              </button>

              {/* Dark / Night Mode */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'dark' })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                  formData.themeMode === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 text-indigo-400 border border-slate-800">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm">Dark / Night</div>
                      <div className="text-[10px] font-bold text-slate-400">Low Eye Strain</div>
                    </div>
                  </div>
                  {formData.themeMode === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Deep dark glassmorphism atmosphere suited for night and eye comfort.
                </p>
              </button>

              {/* Light Mode */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, themeMode: 'light' })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                  formData.themeMode === 'light'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm">Light Mode</div>
                      <div className="text-[10px] font-bold text-slate-400">Daytime Clarity</div>
                    </div>
                  </div>
                  {formData.themeMode === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Clean daylight high-contrast palette with soft highlights.
                </p>
              </button>
            </div>
          </div>

          {/* Target Blood Pressure */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Target Blood Pressure Baseline</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Systolic Max (Top)</label>
                <input
                  type="number"
                  value={formData.targetSystolicMax}
                  onChange={(e) => setFormData({ ...formData, targetSystolicMax: Number(e.target.value) || 130 })}
                  className="w-full text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Diastolic Max (Bottom)</label>
                <input
                  type="number"
                  value={formData.targetDiastolicMax}
                  onChange={(e) => setFormData({ ...formData, targetDiastolicMax: Number(e.target.value) || 85 })}
                  className="w-full text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Medications Manager */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <span>Scheduled Medications ({formData.medications.length})</span>
            </h3>
            
            {/* Meds List */}
            <div className="space-y-2">
              {formData.medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl"
                >
                  <div>
                    <span className="font-black text-white text-sm">{med.name}</span>
                    <span className="ml-2 text-[11px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {med.dosage}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{med.instructions}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Remove Medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Medication Row */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
              <span className="text-xs font-black uppercase text-slate-400">Add New Medication</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Medication name (e.g. Amlodipine)"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 5 mg)"
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Instructions (e.g. Take with morning glass of water)"
                value={newMedInstructions}
                onChange={(e) => setNewMedInstructions(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 text-xs font-semibold bg-slate-900 text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleAddMedication}
                disabled={!newMedName.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Add Medication</span>
              </button>
            </div>
          </div>

          {/* Voice & Speaker Settings */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>AI Voice & Speaker Selection</span>
            </h3>

            {/* Mute Voice AI Setting Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border transition-all bg-slate-950/70 border-slate-800 shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${formData.soundEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                  {formData.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>AI Voice Audio:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      formData.soundEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {formData.soundEnabled ? 'Active (Speaking)' : 'Muted'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {formData.soundEnabled
                      ? 'AI bot speaks questions and guidance aloud'
                      : 'AI bot is silent; questions appear on screen'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, soundEnabled: !formData.soundEnabled })}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 border cursor-pointer ${
                  formData.soundEnabled
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
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
                        voiceId: undefined,
                      });
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl flex-shrink-0">{persona.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-white text-sm">{persona.name}</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-slate-300 border border-slate-700">
                              {persona.accent}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-400 block mt-0.5">
                            {persona.label.split('•')[1]?.trim() || persona.gender}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
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
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 font-black text-xs border border-slate-700 hover:border-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
                        title={`Listen to ${persona.name}`}
                      >
                        <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
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
                <label className="text-xs font-bold text-slate-300">
                  Talking Speed ({formData.voiceSpeed}x)
                </label>
                <span className="text-xs font-bold text-indigo-400">
                  {formData.voiceSpeed <= 0.75 ? 'Very Slow' : formData.voiceSpeed <= 0.9 ? 'Senior Friendly' : formData.voiceSpeed <= 1.0 ? 'Normal' : 'Fast'}
                </span>
              </div>

              {/* Speed Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { speed: 0.75, label: '0.75x Slow' },
                  { speed: 0.9, label: '0.9x Relaxed' },
                  { speed: 1.0, label: '1.0x Normal' },
                  { speed: 1.25, label: '1.25x Fast' },
                ].map((item) => (
                  <button
                    key={item.speed}
                    type="button"
                    onClick={() => setFormData({ ...formData, voiceSpeed: item.speed })}
                    className={`py-2 px-2 rounded-xl font-black text-xs border text-center transition-all cursor-pointer ${
                      Math.abs(formData.voiceSpeed - item.speed) < 0.05
                        ? 'bg-indigo-500 text-slate-950 border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SQLite Database & Backup Snapshots */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <span className="text-base">💾</span>
                <span>Local Database & Backup Snapshots</span>
              </h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SQLite Active</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your health check-ins, medication logs, and reminders are stored in a local SQLite database on your device. You can download complete JSON snapshots or restore previous backups anytime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Download Backup */}
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
                  } catch (e: any) {
                    setBackupStatus(`❌ Export failed: ${e?.message || 'Unknown error'}`);
                  }
                }}
                className="p-3.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer shadow-inner"
              >
                <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Download Backup File</div>
                  <div className="text-xs text-slate-400">Save full snapshot to computer</div>
                </div>
              </button>

              {/* Restore Backup */}
              <label className="p-3.5 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl flex items-center gap-3 text-left cursor-pointer transition-all shadow-inner">
                <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">Restore from Backup</div>
                  <div className="text-xs text-slate-400">Import a previous snapshot file</div>
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
                      setBackupStatus(`✅ Restored ${data.checkIns.length} records.`);
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
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 animate-fadeIn">
                {backupStatus}
              </div>
            )}
          </div>

          {/* Seed Demo Clinical Scenarios */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Seed Demo Clinical Scenarios</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onResetData('balanced'); onClose(); }}
                className="p-3 text-xs font-bold rounded-xl border border-slate-800 hover:border-emerald-500/50 bg-slate-950/70 hover:bg-slate-900 text-slate-200 text-left cursor-pointer transition-colors"
              >
                🌱 1. Balanced Senior
              </button>
              <button
                onClick={() => { onResetData('rising_bp'); onClose(); }}
                className="p-3 text-xs font-bold rounded-xl border border-slate-800 hover:border-rose-500/50 bg-slate-950/70 hover:bg-slate-900 text-slate-200 text-left cursor-pointer transition-colors"
              >
                📈 2. Rising BP Trend
              </button>
              <button
                onClick={() => { onResetData('missed_meds'); onClose(); }}
                className="p-3 text-xs font-bold rounded-xl border border-slate-800 hover:border-amber-500/50 bg-slate-950/70 hover:bg-slate-900 text-slate-200 text-left cursor-pointer transition-colors"
              >
                💊 3. Missed Meds
              </button>
              <button
                onClick={() => { onResetData('dizziness_fatigue'); onClose(); }}
                className="p-3 text-xs font-bold rounded-xl border border-slate-800 hover:border-purple-500/50 bg-slate-950/70 hover:bg-slate-900 text-slate-200 text-left cursor-pointer transition-colors"
              >
                🩺 4. Dizziness & Fatigue
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/90 p-4 sm:p-6 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
