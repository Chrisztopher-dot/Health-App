import React, { useState } from 'react';
import { UserProfile, MedicationItem } from '../../types/health';
import { SpeechService } from '../../services/speechService';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Pill, 
  Activity, 
  Sliders, 
  Volume2, 
  RotateCcw,
  User,
  Play
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetData: (scenario: 'balanced' | 'rising_bp' | 'missed_meds' | 'dizziness_fatigue') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetData,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('');

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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
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

          {/* Voice & Accessibility Settings */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" />
                AI Talking Speed ({formData.voiceSpeed}x)
              </h3>
              <button
                type="button"
                onClick={() => {
                  SpeechService.speak(
                    "Good morning! This is a test of the AI talking speed.",
                    formData.voiceSpeed
                  );
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-700" />
                Listen to Sample
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { speed: 0.75, label: '0.75x Very Slow' },
                { speed: 0.9, label: '0.9x Senior (Recommended)' },
                { speed: 1.0, label: '1.0x Normal' },
                { speed: 1.25, label: '1.25x Fast' },
              ].map((item) => (
                <button
                  key={item.speed}
                  type="button"
                  onClick={() => setFormData({ ...formData, voiceSpeed: item.speed })}
                  className={`py-2.5 px-2 rounded-xl font-bold text-xs border-2 text-center transition-all ${
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
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>0.6x (Slowest)</span>
                <span>1.5x (Fastest)</span>
              </div>
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
