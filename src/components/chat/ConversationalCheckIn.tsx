import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckInRecord, 
  HealthMood, 
  MedicationStatus, 
  UserProfile 
} from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX,
  Sparkles, 
  CheckCircle2, 
  Heart,
  Activity,
  Pill,
  Moon,
  Flame
} from 'lucide-react';

interface ConversationalCheckInProps {
  profile: UserProfile;
  onComplete: (record: CheckInRecord) => void;
  onCancel: () => void;
  onUpdateVoiceSpeed?: (speed: number) => void;
  onUpdateVoicePersona?: (personaId: string) => void;
  onToggleSound?: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

type ConversationalStage = 
  | 'greeting_mood'
  | 'energy'
  | 'sleep'
  | 'pain'
  | 'blood_pressure'
  | 'medication'
  | 'symptoms'
  | 'weight_notes'
  | 'completed';

export const ConversationalCheckIn: React.FC<ConversationalCheckInProps> = ({
  profile,
  onComplete,
  onCancel,
  onUpdateVoiceSpeed,
  onUpdateVoicePersona,
  onToggleSound,
}) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(profile.voiceSpeed || 1.0);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>(profile.voicePersona || 'samantha');
  const [stage, setStage] = useState<ConversationalStage>('greeting_mood');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'chat' | 'record'>('chat');

  // Extracted Record State
  const [extractedRecord, setExtractedRecord] = useState<Partial<CheckInRecord>>({
    mood: 'good',
    energyLevel: 7,
    sleepQuality: 7,
    painLevel: 0,
    bloodPressure: { measured: false },
    medicationStatus: 'taken',
    symptoms: [],
    dailyNotes: '',
    inputMode: 'conversational',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const userFirst = profile.name ? profile.name.trim().split(' ')[0] : 'friend';
    const initialGreeting = `Good day, ${userFirst}! I am your AI Health Assistant. Let's do your quick daily check-in. How are you feeling overall today?`;
    
    setMessages([
      {
        id: 'msg-1',
        sender: 'ai',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['😀 Feeling Great', '🙂 Good & Relaxed', '😐 Doing Okay', '🙁 Not Great', '☹ Feeling Unwell'],
      },
    ]);

    if (profile.soundEnabled) {
      SpeechService.speak(initialGreeting, profile.voiceSpeed);
    }
  }, []);

  const activePersona = CURATED_VOICE_PERSONAS.find((p) => p.id === currentPersonaId) || CURATED_VOICE_PERSONAS[0];

  const speakText = (text: string) => {
    SpeechService.speak(text, currentSpeed, undefined, activePersona.id, activePersona.defaultPitch);
  };

  const handlePersonaChange = (personaId: string) => {
    setCurrentPersonaId(personaId);
    if (onUpdateVoicePersona) {
      onUpdateVoicePersona(personaId);
    }
    const found = CURATED_VOICE_PERSONAS.find((p) => p.id === personaId);
    if (found && profile.soundEnabled) {
      SpeechService.speak(`Hello, I am ${found.name}. Voice ready!`, currentSpeed, undefined, found.id, found.defaultPitch);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    if (onUpdateVoiceSpeed) {
      onUpdateVoiceSpeed(speed);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const userText = textToSend || inputText;
    if (!userText.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInputText('');

    // State machine logic
    processStageResponse(userText.trim(), stage, currentHistory);
  };

  const processStageResponse = (userText: string, currentStage: ConversationalStage, currentHistory: Message[]) => {
    const lower = userText.toLowerCase();
    let nextStage: ConversationalStage = 'energy';
    let aiResponse = '';
    let suggestions: string[] = [];

    if (currentStage === 'greeting_mood') {
      let mood: HealthMood = 'good';
      if (lower.includes('great') || lower.includes('very good') || lower.includes('fantastic') || lower.includes('wonderful')) {
        mood = 'very_good';
      } else if (lower.includes('okay') || lower.includes('fair') || lower.includes('alright') || lower.includes('so so')) {
        mood = 'okay';
      } else if (lower.includes('not great') || lower.includes('bad')) {
        mood = 'not_great';
      } else if (lower.includes('poor') || lower.includes('unwell') || lower.includes('terrible') || lower.includes('awful')) {
        mood = 'poor';
      }
      setExtractedRecord((prev) => ({ ...prev, mood }));
      nextStage = 'energy';
      aiResponse = `Wonderful to hear. How would you rate your energy level today on a scale of 1 to 10?`;
      suggestions = ['🔋 8 - Energetic & Active', '⚡ 7 - Normal Energy', '😴 5 - Mildly Low', '🪫 3 - Very Tired'];
    } 
    else if (currentStage === 'energy') {
      const numMatch = lower.match(/\b([1-9]|10)\b/);
      let energy = 7;
      if (numMatch) energy = parseInt(numMatch[1], 10);
      else if (lower.includes('high') || lower.includes('great') || lower.includes('full')) energy = 8;
      else if (lower.includes('low') || lower.includes('tired') || lower.includes('sluggish')) energy = 4;

      setExtractedRecord((prev) => ({ ...prev, energyLevel: energy }));
      nextStage = 'sleep';
      aiResponse = `Got it, energy logged at ${energy}/10. How was your sleep last night? (Hours or quality 1–10)`;
      suggestions = ['🌙 Slept 8 hours soundly', '🛌 Slept 7 hours well', '🥱 Woke up a few times (5/10)', '❌ Poor sleep'];
    }
    else if (currentStage === 'sleep') {
      const numMatch = lower.match(/\b([1-9]|10)\b/);
      let sleep = 7;
      if (numMatch) sleep = parseInt(numMatch[1], 10);
      else if (lower.includes('great') || lower.includes('soundly') || lower.includes('8') || lower.includes('well')) sleep = 8;
      else if (lower.includes('poor') || lower.includes('woke up') || lower.includes('bad')) sleep = 4;

      setExtractedRecord((prev) => ({ ...prev, sleepQuality: sleep }));
      nextStage = 'pain';
      aiResponse = `Recorded sleep quality at ${sleep}/10. Are you feeling any physical aches, joint stiffness, or pain today?`;
      suggestions = ['🟢 No pain (0/10)', '🟡 Mild stiffness (2/10)', '🟠 Moderate ache (4/10)', '🔴 Noticeable pain (6/10)'];
    }
    else if (currentStage === 'pain') {
      let pain = 0;
      let notes = '';
      const numMatch = lower.match(/\b([0-9]|10)\b/);
      if (numMatch) pain = parseInt(numMatch[1], 10);
      else if (lower.includes('no') || lower.includes('none') || lower.includes('zero')) pain = 0;
      else if (lower.includes('mild') || lower.includes('stiff') || lower.includes('little')) pain = 2;
      else if (lower.includes('moderate') || lower.includes('ache')) pain = 4;
      else if (lower.includes('severe') || lower.includes('lot') || lower.includes('bad')) pain = 7;

      if (pain > 0) notes = userText;

      setExtractedRecord((prev) => ({ ...prev, painLevel: pain, painNotes: notes || undefined }));
      nextStage = 'blood_pressure';
      aiResponse = pain > 0 
        ? `Noted pain level at ${pain}/10. Did you measure your blood pressure today? If so, what was your reading?`
        : `Great to hear no pain! Did you measure your blood pressure today? (e.g. 120/80 or tap Skip)`;
      suggestions = ['120 / 80', '125 / 82', '130 / 85', 'Skip blood pressure today'];
    }
    else if (currentStage === 'blood_pressure') {
      const bpMatch = lower.match(/(\d{2,3})\s*(?:\/|\s+over\s+)\s*(\d{2,3})/);
      if (bpMatch) {
        const sys = parseInt(bpMatch[1], 10);
        const dia = parseInt(bpMatch[2], 10);
        setExtractedRecord((prev) => ({
          ...prev,
          bloodPressure: { measured: true, systolic: sys, diastolic: dia, pulse: 72 },
        }));
        aiResponse = `Logged blood pressure at ${sys}/${dia} mmHg. Have you taken your scheduled morning medications today?`;
      } else {
        setExtractedRecord((prev) => ({
          ...prev,
          bloodPressure: { measured: false },
        }));
        aiResponse = `No problem, skipped BP for now. Have you taken your scheduled morning medications today?`;
      }
      nextStage = 'medication';
      suggestions = ['✅ Yes, took all morning meds', '⏰ Not yet, taking soon', '❌ Missed a dose'];
    }
    else if (currentStage === 'medication') {
      let status: MedicationStatus = 'taken';
      if (lower.includes('miss') || lower.includes('forgot') || lower.includes('no')) {
        status = 'missed';
      } else if (lower.includes('not yet') || lower.includes('later') || lower.includes('soon')) {
        status = 'not_yet';
      }
      setExtractedRecord((prev) => ({ ...prev, medicationStatus: status }));
      nextStage = 'symptoms';
      aiResponse = `Noted. Are you experiencing any specific symptoms today like dizziness, fatigue, shortness of breath, or headache?`;
      suggestions = ['No symptoms, all clear', 'Mild dizziness', 'Fatigue / Tiredness', 'Headache', 'Stress'];
    }
    else if (currentStage === 'symptoms') {
      const symList: string[] = [];
      if (lower.includes('dizz')) symList.push('Dizziness');
      if (lower.includes('fatigue') || lower.includes('tired')) symList.push('Fatigue');
      if (lower.includes('headache') || lower.includes('head ache')) symList.push('Headache');
      if (lower.includes('chest')) symList.push('Chest discomfort');
      if (lower.includes('breath')) symList.push('Shortness of breath');
      if (lower.includes('stress') || lower.includes('anxious')) symList.push('Stress');
      if (lower.includes('nausea') || lower.includes('stomach')) symList.push('Nausea');

      setExtractedRecord((prev) => ({ 
        ...prev, 
        symptoms: symList,
        symptomNotes: symList.length > 0 ? userText : undefined,
      }));
      nextStage = 'weight_notes';
      aiResponse = `Recorded! Anything else you'd like to add today, such as your morning weight or a quick note about your day?`;
      suggestions = ['Everything looks great, all done', 'Weight is 152 lbs', 'Going for a park walk later'];
    }
    else if (currentStage === 'weight_notes') {
      const weightMatch = lower.match(/(\d{2,3}(?:\.\d)?)\s*(?:lbs|pounds|kg)?/);
      const foundWeight = weightMatch ? parseFloat(weightMatch[1]) : undefined;

      setExtractedRecord((prev) => ({
        ...prev,
        weight: foundWeight,
        dailyNotes: userText,
      }));
      nextStage = 'completed';
      aiResponse = `All done! Your daily health check-in record is complete. Please review the live summary on the right and click "Save & Finish Check-In".`;
    }

    setStage(nextStage);

    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions,
      };
      setMessages([...currentHistory, aiMsg]);
      if (profile.soundEnabled) {
        speakText(aiResponse);
      }
    }, 400);
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);

    SpeechService.startListening(
      (text, isFinal) => {
        setInputText(text);
        if (isFinal) {
          setIsListening(false);
          handleSendMessage(text);
        }
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  const handleFinalSave = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const fullRecord: CheckInRecord = {
      id: `checkin-conv-${Date.now()}`,
      date: todayStr,
      timestamp: new Date().toISOString(),
      mood: extractedRecord.mood || 'good',
      energyLevel: extractedRecord.energyLevel || 7,
      sleepQuality: extractedRecord.sleepQuality || 7,
      painLevel: extractedRecord.painLevel || 0,
      painNotes: extractedRecord.painNotes,
      bloodPressure: extractedRecord.bloodPressure || { measured: false },
      medicationStatus: extractedRecord.medicationStatus || 'taken',
      symptoms: extractedRecord.symptoms || [],
      symptomNotes: extractedRecord.symptomNotes,
      weight: extractedRecord.weight,
      dailyNotes: extractedRecord.dailyNotes,
      inputMode: 'conversational',
    };

    onComplete(fullRecord);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn text-slate-100">
      {/* Mobile-only view toggle bar */}
      <div className="flex lg:hidden items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-sm">
        <button
          onClick={() => setMobileView('chat')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
            mobileView === 'chat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>💬 Voice & Chat</span>
        </button>

        <button
          onClick={() => setMobileView('record')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
            mobileView === 'record'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>📋 Live Summary</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: AI Chat Window (7 cols) */}
        <div className={`lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[560px] sm:h-[640px] backdrop-blur-md ${
          mobileView === 'record' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight truncate">
                  AI Daily Check-In Assistant
                </h2>
                <p className="text-xs text-slate-300 font-medium truncate">
                  Talk or type — your answers build your health record automatically
                </p>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>

          {/* Voice Controls Bar: Speaker, Mute & Speed */}
          <div className="bg-slate-950/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
            {/* Persona Switcher & Mute Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (onToggleSound) onToggleSound();
                  if (profile.soundEnabled) SpeechService.stopSpeaking();
                }}
                className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 border ${
                  !profile.soundEnabled
                    ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                }`}
                title={profile.soundEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
              >
                {!profile.soundEnabled ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voice On</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 text-xs">Speaker:</span>
                <button
                  onClick={() => {
                    const personas = CURATED_VOICE_PERSONAS;
                    const idx = personas.findIndex((p) => p.id === currentPersonaId);
                    const nextP = personas[(idx + 1) % personas.length];
                    handlePersonaChange(nextP.id);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs border border-slate-700 flex items-center gap-1 transition-all active:scale-95"
                >
                  <span>{activePersona.emoji}</span>
                  <span>{activePersona.name}</span>
                </button>
              </div>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-bold text-xs">Speed:</span>
              {[
                { val: 0.75, label: '0.75x' },
                { val: 1.0, label: '1.0x' },
                { val: 1.25, label: '1.25x' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => handleSpeedChange(s.val)}
                  className={`px-2 py-0.5 rounded-lg font-black text-[11px] transition-all ${
                    Math.abs(currentSpeed - s.val) < 0.05
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 font-semibold text-sm sm:text-base leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-slate-900 text-white border border-slate-800 rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="p-1 text-slate-400 hover:text-emerald-300 rounded-lg flex-shrink-0"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick suggestion chips */}
                {msg.suggestions && msg.suggestions.length > 0 && stage !== 'completed' && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[90%] sm:max-w-[85%]">
                    {msg.suggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-3.5 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 font-black text-xs sm:text-sm border border-slate-700 hover:border-emerald-500 shadow-sm transition-all active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={handleToggleVoiceInput}
              className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-950/50'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Click to speak"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={isListening ? 'Listening to your voice...' : 'Type your answer or select an option above...'}
              className="flex-1 text-sm sm:text-base py-3 px-4 rounded-2xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-medium"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Health Summary Record (5 cols) */}
        <div className={`lg:col-span-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 backdrop-blur-md ${
          mobileView === 'chat' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>Today's Health Record</span>
            </h3>
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Sync
            </span>
          </div>

          <div className="space-y-3">
            {/* Mood & Energy Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Mood</span>
                <span className="text-xl font-black text-white mt-1 block capitalize">
                  {extractedRecord.mood === 'very_good' ? '😀 Very Good' : extractedRecord.mood === 'good' ? '🙂 Good' : extractedRecord.mood === 'okay' ? '😐 Okay' : '🙁 Unwell'}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Energy Level</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{extractedRecord.energyLevel}/10</span>
                </div>
              </div>
            </div>

            {/* Sleep & Pain */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep Quality
                </span>
                <span className="text-2xl font-black text-indigo-300 mt-1 block">
                  {extractedRecord.sleepQuality}/10
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Pain Level
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">
                  {extractedRecord.painLevel}/10
                </span>
              </div>
            </div>

            {/* Blood Pressure & Medication */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" /> Blood Pressure
                </span>
                <span className="text-sm font-black text-white">
                  {extractedRecord.bloodPressure?.measured && extractedRecord.bloodPressure.systolic
                    ? `${extractedRecord.bloodPressure.systolic}/${extractedRecord.bloodPressure.diastolic} mmHg`
                    : 'Not Measured'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-400" /> Prescriptions
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  extractedRecord.medicationStatus === 'taken'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {extractedRecord.medicationStatus === 'taken' ? '✅ Confirmed Taken' : '⏳ Pending / Missed'}
                </span>
              </div>
            </div>

            {/* Symptoms & Notes */}
            {extractedRecord.symptoms && extractedRecord.symptoms.length > 0 && (
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                  Reported Symptoms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {extractedRecord.symptoms.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Final Finish Check-In CTA */}
          <div className="pt-3">
            <button
              onClick={handleFinalSave}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-950/60 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Save & Complete Daily Check-In</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
