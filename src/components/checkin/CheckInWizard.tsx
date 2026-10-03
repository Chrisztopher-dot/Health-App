import React, { useState, useEffect } from 'react';
import { 
  CheckInRecord, 
  HealthMood, 
  MedicationStatus, 
  UserProfile 
} from '../../types/health';
import { SpeechService } from '../../services/speechService';
import { 
  Zap, 
  Moon, 
  Activity, 
  Pill, 
  AlertCircle, 
  Scale, 
  Mic, 
  MicOff, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';

interface CheckInWizardProps {
  profile: UserProfile;
  onComplete: (record: CheckInRecord) => void;
  initialData?: Partial<CheckInRecord>;
}

const TOTAL_STEPS = 9;

const MOOD_OPTIONS: { value: HealthMood; emoji: string; label: string; bg: string; border: string; text: string }[] = [
  { value: 'very_good', emoji: '😀', label: 'Very Good', bg: 'bg-emerald-950/40 hover:bg-emerald-900/50', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  { value: 'good', emoji: '🙂', label: 'Good', bg: 'bg-green-950/40 hover:bg-green-900/50', border: 'border-green-500/40', text: 'text-green-300' },
  { value: 'okay', emoji: '😐', label: 'Okay', bg: 'bg-amber-950/40 hover:bg-amber-900/50', border: 'border-amber-500/40', text: 'text-amber-300' },
  { value: 'not_great', emoji: '🙁', label: 'Not Great', bg: 'bg-orange-950/40 hover:bg-orange-900/50', border: 'border-orange-500/40', text: 'text-orange-300' },
  { value: 'poor', emoji: '☹', label: 'Poor', bg: 'bg-rose-950/40 hover:bg-rose-900/50', border: 'border-rose-500/40', text: 'text-rose-300' },
];

const SYMPTOM_OPTIONS = [
  'Dizziness',
  'Fatigue',
  'Headache',
  'Chest discomfort',
  'Shortness of breath',
  'Stress',
  'Nausea',
  'Pain',
  'Other',
];

const COMMON_PAIN_AREAS = ['Lower Back', 'Knee', 'Shoulder', 'Neck', 'Hip', 'Hands/Wrists', 'Head'];

export const CheckInWizard: React.FC<CheckInWizardProps> = ({
  profile,
  onComplete,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Form State
  const [mood, setMood] = useState<HealthMood>(initialData?.mood || 'good');
  const [energyLevel, setEnergyLevel] = useState<number>(initialData?.energyLevel || 7);
  const [sleepQuality, setSleepQuality] = useState<number>(initialData?.sleepQuality || 7);
  const [painLevel, setPainLevel] = useState<number>(initialData?.painLevel || 0);
  const [painNotes, setPainNotes] = useState<string>(initialData?.painNotes || '');
  
  // Blood Pressure
  const [bpMeasured, setBpMeasured] = useState<boolean>(initialData?.bloodPressure?.measured || false);
  const [systolic, setSystolic] = useState<string>(initialData?.bloodPressure?.systolic ? String(initialData.bloodPressure.systolic) : '120');
  const [diastolic, setDiastolic] = useState<string>(initialData?.bloodPressure?.diastolic ? String(initialData.bloodPressure.diastolic) : '80');
  const [pulse, setPulse] = useState<string>(initialData?.bloodPressure?.pulse ? String(initialData.bloodPressure.pulse) : '72');

  // Medication
  const [medicationStatus, setMedicationStatus] = useState<MedicationStatus>(initialData?.medicationStatus || 'taken');
  const [medNotes, setMedNotes] = useState<string>(initialData?.medicationNotes || '');

  // Symptoms
  const [symptoms, setSymptoms] = useState<string[]>(initialData?.symptoms || []);
  const [symptomNotes, setSymptomNotes] = useState<string>(initialData?.symptomNotes || '');

  // Weight
  const [weight, setWeight] = useState<string>(initialData?.weight ? String(initialData.weight) : '');

  // Daily Notes
  const [dailyNotes, setDailyNotes] = useState<string>(initialData?.dailyNotes || '');

  // Auto-speak question on step change if sound enabled
  useEffect(() => {
    if (!profile.soundEnabled) return;

    const stepQuestions: Record<number, string> = {
      1: "Good morning! Let's do today's health check-in. How are you feeling today?",
      2: "Rate your energy today, on a scale from 1 to 10.",
      3: "How did you sleep last night, on a scale from 1 to 10?",
      4: "Do you have any pain today, on a scale from 0 to 10?",
      5: "Have you measured your blood pressure today?",
      6: "Have you taken your morning medications?",
      7: "Select any symptoms you experienced today.",
      8: "Would you like to record your weight today?",
      9: "Anything else you would like to record today?",
    };

    const question = stepQuestions[currentStep];
    if (question) {
      SpeechService.speak(question, profile.voiceSpeed);
    }

    return () => {
      SpeechService.stopSpeaking();
    };
  }, [currentStep, profile.soundEnabled, profile.voiceSpeed]);

  const speakPrompt = (text: string) => {
    SpeechService.speak(text, profile.voiceSpeed);
  };

  const handleToggleVoiceInput = (targetSetter: (val: (prev: string) => string) => void) => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setVoiceError(null);
    setIsListening(true);

    SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          targetSetter((prev) => (prev ? `${prev} ${text}` : text));
          setIsListening(false);
        }
      },
      (err) => {
        setVoiceError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const togglePainArea = (area: string) => {
    setPainNotes((prev) => {
      if (prev.includes(area)) {
        return prev.replace(area, '').replace(/,\s*,/g, ',').trim();
      }
      return prev ? `${prev}, ${area}` : area;
    });
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: CheckInRecord = {
      id: `checkin-${Date.now()}`,
      date: todayStr,
      timestamp: new Date().toISOString(),
      mood,
      energyLevel,
      sleepQuality,
      painLevel,
      painNotes: painLevel > 0 ? painNotes : undefined,
      bloodPressure: {
        measured: bpMeasured,
        systolic: bpMeasured ? Number(systolic) || undefined : undefined,
        diastolic: bpMeasured ? Number(diastolic) || undefined : undefined,
        pulse: bpMeasured ? Number(pulse) || undefined : undefined,
      },
      medicationStatus,
      medicationNotes: medNotes || undefined,
      symptoms,
      symptomNotes: symptomNotes || undefined,
      weight: weight ? Number(weight) || undefined : undefined,
      dailyNotes: dailyNotes || undefined,
      inputMode: 'standard',
    };

    onComplete(newRecord);
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-w-3xl mx-auto my-2 sm:my-4 transition-all text-slate-100 backdrop-blur-md">
      {/* Top Banner & Progress */}
      <div className="bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white p-4 sm:p-8 border-b border-emerald-500/20">
        <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
          <div>
            <span className="text-[11px] sm:text-sm uppercase tracking-widest font-extrabold text-emerald-200">
              Morning Check-In • Under 2 Minutes
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-0.5 sm:mt-1 leading-tight">
              "Good morning. Let's do today's check-in."
            </h2>
          </div>
          <button
            onClick={() => speakPrompt("Good morning. Let's do today's health check-in.")}
            className="p-2.5 sm:p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-colors flex-shrink-0"
            title="Read greeting aloud"
          >
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4">
          <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-100">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-slate-950/60 rounded-full h-3 sm:h-3.5 p-0.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="p-4 sm:p-8 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
        {/* Step 1: Health Status */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  How are you feeling today?
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Tap the option that best matches your overall mood right now.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("How are you feeling today?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 pt-2">
              {MOOD_OPTIONS.map((opt) => {
                const isSelected = mood === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setMood(opt.value);
                      speakPrompt(`You selected ${opt.label}`);
                    }}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all text-center gap-1.5 sm:gap-2 active:scale-95 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/70 ring-2 ring-emerald-500/50 shadow-md font-bold text-white'
                        : `${opt.bg} ${opt.border} text-slate-200`
                    }`}
                  >
                    <span className="text-3xl sm:text-5xl">{opt.emoji}</span>
                    <span className="text-sm sm:text-lg font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Energy Level */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3 leading-tight">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 fill-amber-400/20 flex-shrink-0" />
                  <span>Rate your energy today</span>
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  1 means very low energy; 10 means energetic and lively.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Rate your energy today, on a scale from 1 to 10.")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="text-center py-2 sm:py-4">
              <span className="text-5xl sm:text-6xl font-black text-emerald-400">{energyLevel}</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500"> / 10</span>
              <p className="text-sm sm:text-base font-semibold text-slate-400 mt-1">
                {energyLevel <= 3 ? 'Low Energy / Rest day needed' : energyLevel <= 7 ? 'Moderate Energy' : 'High Vitality & Energy'}
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setEnergyLevel(num)}
                  className={`h-12 sm:h-16 rounded-xl sm:rounded-2xl font-extrabold text-lg sm:text-xl border transition-all flex items-center justify-center active:scale-90 ${
                    energyLevel === num
                      ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Sleep Quality */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3 leading-tight">
                  <Moon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 fill-indigo-400/20 flex-shrink-0" />
                  <span>How did you sleep last night?</span>
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  1 means restless or insomnia; 10 means deep, restful sleep.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("How did you sleep last night, on a scale from 1 to 10?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="text-center py-2 sm:py-4">
              <span className="text-5xl sm:text-6xl font-black text-indigo-400">{sleepQuality}</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500"> / 10</span>
              <p className="text-sm sm:text-base font-semibold text-slate-400 mt-1">
                {sleepQuality <= 4 ? 'Disrupted or poor sleep' : sleepQuality <= 7 ? 'Good, normal sleep' : 'Deep, restorative sleep'}
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setSleepQuality(num)}
                  className={`h-12 sm:h-16 rounded-xl sm:rounded-2xl font-extrabold text-lg sm:text-xl border transition-all flex items-center justify-center active:scale-90 ${
                    sleepQuality === num
                      ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Pain Level */}
        {currentStep === 4 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  Do you have any pain today?
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  0 means completely pain-free; 10 means severe discomfort.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Do you have any pain today, on a scale from 0 to 10?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="text-center py-2">
              <span className={`text-5xl sm:text-6xl font-black ${painLevel === 0 ? 'text-emerald-400' : painLevel <= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                {painLevel}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-500"> / 10</span>
              <p className="text-sm sm:text-base font-semibold text-slate-400 mt-1">
                {painLevel === 0 ? 'No pain (Comfortable)' : painLevel <= 3 ? 'Mild aches' : 'Noticeable discomfort'}
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setPainLevel(num)}
                  className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl font-extrabold text-base sm:text-lg border transition-all flex items-center justify-center active:scale-90 ${
                    painLevel === num
                      ? num === 0
                        ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50'
                        : 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* If pain level > 3, allow additional notes */}
            {painLevel > 3 && (
              <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-3.5 sm:p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm sm:text-base">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Where is the discomfort located?</span>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {COMMON_PAIN_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => togglePainArea(area)}
                      className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                        painNotes.includes(area)
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-rose-950/40'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={painNotes}
                    onChange={(e) => setPainNotes(e.target.value)}
                    placeholder="Describe pain details (e.g. sharp when walking)..."
                    className="w-full text-sm sm:text-base p-3 pr-12 rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none bg-slate-950 text-white placeholder-slate-500 font-medium"
                  />
                  <button
                    onClick={() => handleToggleVoiceInput(setPainNotes)}
                    className={`absolute right-2 top-2 p-1.5 rounded-lg ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Speak notes"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Blood Pressure */}
        {currentStep === 5 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3 leading-tight">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 flex-shrink-0" />
                  <span>Have you measured your blood pressure today?</span>
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Enter your morning monitor readings if available.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Have you measured your blood pressure today?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setBpMeasured(true)}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  bpMeasured
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                Yes, Measured
              </button>

              <button
                onClick={() => setBpMeasured(false)}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  !bpMeasured
                    ? 'bg-slate-700 text-white border-slate-600 ring-2 ring-slate-500/50 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
              >
                No, Not Today
              </button>
            </div>

            {bpMeasured && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                      Systolic (Top)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        placeholder="120"
                        className="w-full text-2xl sm:text-3xl font-black p-3 sm:p-3.5 rounded-2xl border border-slate-700 focus:border-emerald-500 text-center bg-slate-900 text-white"
                      />
                      <span className="absolute right-3 bottom-3 sm:bottom-4 text-[10px] sm:text-xs font-bold text-slate-500">mmHg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                      Diastolic (Bottom)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-full text-2xl sm:text-3xl font-black p-3 sm:p-3.5 rounded-2xl border border-slate-700 focus:border-emerald-500 text-center bg-slate-900 text-white"
                      />
                      <span className="absolute right-3 bottom-3 sm:bottom-4 text-[10px] sm:text-xs font-bold text-slate-500">mmHg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                      Pulse (Heart Rate)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="72"
                        className="w-full text-2xl sm:text-3xl font-black p-3 sm:p-3.5 rounded-2xl border border-slate-700 focus:border-emerald-500 text-center bg-slate-900 text-white"
                      />
                      <span className="absolute right-3 bottom-3 sm:bottom-4 text-[10px] sm:text-xs font-bold text-slate-500">BPM</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Target healthy range for Eleanor: &lt; 130 / 85 mmHg.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Medication Check */}
        {currentStep === 6 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3 leading-tight">
                  <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 flex-shrink-0" />
                  <span>Have you taken your morning medication?</span>
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Review your prescribed morning routine.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Have you taken your morning medication?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Scheduled medications display */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3.5 sm:p-4 space-y-2">
              <span className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider block">
                Scheduled Morning Medications ({profile.medications.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {profile.medications.map((med) => (
                  <div key={med.id} className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm">
                    <p className="font-extrabold text-white text-sm sm:text-base">{med.name}</p>
                    <p className="text-xs font-semibold text-emerald-400">{med.dosage}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{med.instructions}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <button
                onClick={() => setMedicationStatus('taken')}
                className={`p-3.5 sm:p-5 rounded-2xl border font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
                  medicationStatus === 'taken'
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                    : 'bg-slate-800/80 hover:bg-emerald-950/40 text-slate-200 border-slate-700'
                }`}
              >
                <span className="text-xl sm:text-2xl">✅</span>
                <span>Taken</span>
              </button>

              <button
                onClick={() => setMedicationStatus('not_yet')}
                className={`p-3.5 sm:p-5 rounded-2xl border font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
                  medicationStatus === 'not_yet'
                    ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-500/50 shadow-md'
                    : 'bg-slate-800/80 hover:bg-amber-950/40 text-slate-200 border-slate-700'
                }`}
              >
                <span className="text-xl sm:text-2xl">⏰</span>
                <span>Not Yet</span>
              </button>

              <button
                onClick={() => setMedicationStatus('missed')}
                className={`p-3.5 sm:p-5 rounded-2xl border font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 ${
                  medicationStatus === 'missed'
                    ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-md'
                    : 'bg-slate-800/80 hover:bg-rose-950/40 text-slate-200 border-slate-700'
                }`}
              >
                <span className="text-xl sm:text-2xl">❌</span>
                <span>Missed</span>
              </button>
            </div>

            {medicationStatus !== 'taken' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  placeholder="Optional note (e.g. Taking with lunch, refill needed)..."
                  className="w-full text-sm sm:text-base p-3 rounded-xl border border-slate-700 font-medium bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 7: Symptom Check */}
        {currentStep === 7 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  Select any symptoms experienced today
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Tap all that apply or leave unselected if feeling well.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Select any symptoms experienced today.")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {SYMPTOM_OPTIONS.map((sym) => {
                const isChecked = symptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`p-2.5 sm:p-3.5 rounded-2xl font-bold text-sm sm:text-base border text-left flex items-center justify-between transition-all active:scale-95 ${
                      isChecked
                        ? 'bg-rose-950/50 border-rose-500 text-rose-200 ring-2 ring-rose-500/40 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{sym}</span>
                    <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center text-xs ${
                      isChecked ? 'bg-rose-600 text-white font-bold' : 'border border-slate-600 bg-slate-900'
                    }`}>
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Free text symptom notes */}
            <div className="relative">
              <input
                type="text"
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="Optional notes about symptoms..."
                className="w-full text-sm sm:text-base p-3 sm:p-3.5 pr-12 rounded-2xl border border-slate-700 focus:border-emerald-500 bg-slate-950 text-white placeholder-slate-500 font-medium focus:outline-none"
              />
              <button
                onClick={() => handleToggleVoiceInput(setSymptomNotes)}
                className={`absolute right-2.5 top-2.5 p-1.5 rounded-xl ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Speak symptom notes"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Weight Check */}
        {currentStep === 8 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3 leading-tight">
                  <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400 flex-shrink-0" />
                  <span>Optional Weight Check</span>
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Enter your morning weight if you stepped on the scale.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Would you like to record your weight today?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="max-w-xs mx-auto text-center space-y-3 py-4">
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="152.0"
                  className="w-full text-3xl sm:text-4xl font-black p-3.5 sm:p-4 rounded-3xl border border-slate-700 focus:border-teal-500 text-center bg-slate-950 text-white"
                />
                <span className="absolute right-4 bottom-4 sm:bottom-5 text-xs sm:text-sm font-bold text-slate-500">lbs</span>
              </div>
              <p className="text-xs font-semibold text-slate-400">
                Leave blank if not weighed today.
              </p>
            </div>
          </div>
        )}

        {/* Step 9: Daily Notes */}
        {currentStep === 9 && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  Anything else to record today?
                </h3>
                <p className="text-sm sm:text-lg text-slate-400 mt-1 font-medium">
                  Type or tap the microphone to speak your notes.
                </p>
              </div>
              <button
                onClick={() => speakPrompt("Anything else you would like to record today?")}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 flex-shrink-0"
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder="e.g. Went for a walk in the morning, drank 3 glasses of water..."
                  className="w-full text-base sm:text-lg p-3 sm:p-4 rounded-2xl border border-slate-700 focus:border-emerald-500 focus:outline-none bg-slate-950 text-white placeholder-slate-500 font-medium"
                />
              </div>

              {/* Voice-to-Text Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleVoiceInput(setDailyNotes)}
                  className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-extrabold text-sm sm:text-base flex items-center gap-2 sm:gap-3 transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-500/30'
                      : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                  <span>{isListening ? 'Listening...' : 'Tap to Speak (Voice)'}</span>
                </button>

                {voiceError && (
                  <span className="text-xs font-semibold text-rose-400">{voiceError}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-6 sm:pt-8 border-t border-slate-800 mt-4 sm:mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2 border transition-all active:scale-95 ${
              currentStep === 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-extrabold text-base sm:text-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 ml-auto flex-1 sm:flex-initial"
          >
            <span>{currentStep === TOTAL_STEPS ? 'Complete Check-In' : 'Next Step'}</span>
            {currentStep === TOTAL_STEPS ? (
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
