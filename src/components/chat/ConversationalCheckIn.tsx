import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckInRecord, 
  HealthMood, 
  MedicationStatus, 
  UserProfile,
  ReminderItem,
  ReminderPriority
} from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Heart
} from 'lucide-react';

interface ConversationalCheckInProps {
  profile: UserProfile;
  onComplete: (record: CheckInRecord) => void;
  onCancel: () => void;
  onUpdateVoiceSpeed?: (speed: number) => void;
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
}) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(profile.voiceSpeed || 0.9);
  const [stage, setStage] = useState<ConversationalStage>('greeting_mood');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
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
    const initialGreeting = `Good morning, ${profile.name.split(' ')[0]}! I am here to help with today's quick health check-in. How are you feeling today?`;
    
    setMessages([
      {
        id: 'msg-1',
        sender: 'ai',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['😀 Very Good', '🙂 Good', '😐 Okay', '🙁 Not Great', '☹ Poor'],
      },
    ]);

    if (profile.soundEnabled) {
      SpeechService.speak(initialGreeting, profile.voiceSpeed);
    }
  }, []);

  const speakText = (text: string) => {
    SpeechService.speak(text, currentSpeed);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setCurrentSpeed(newSpeed);
    if (onUpdateVoiceSpeed) {
      onUpdateVoiceSpeed(newSpeed);
    }
    SpeechService.speak(`Talking speed set to ${newSpeed}x`, newSpeed);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');

    // Progress conversational stage & extract info
    processUserInput(content, stage, newMessages);
  };

  const processUserInput = (
    userText: string,
    currentStage: ConversationalStage,
    currentHistory: Message[]
  ) => {
    const lower = userText.toLowerCase();
    let nextStage: ConversationalStage = currentStage;
    let aiResponse = '';
    let suggestions: string[] = [];
    let reminderNote = '';

    // Check if user requested to add a reminder or asked about reminders
    if (lower.includes('remind me to') || lower.includes('add a reminder') || lower.includes('add reminder') || lower.includes("don't let me forget") || lower.includes('remember to')) {
      let detectedPriority: ReminderPriority = 'less_urgent';
      const isUrgentKeywords = [
        'urgent', 'doctor', 'physician', 'hospital', 'appointment', 'emergency',
        'prescription', 'refill', 'medication', 'pills', 'medicine', 'blood pressure',
        'critical', 'important', 'test', 'dentist', 'clinic', 'asap'
      ];
      if (isUrgentKeywords.some((kw) => lower.includes(kw))) {
        detectedPriority = 'urgent';
      }

      let cleanTitle = userText
        .replace(/^(remind me to|add a reminder to|add reminder to|add urgent reminder to|add less urgent reminder to|don't let me forget to|please remind me to|set reminder for|remember to)\s+/i, '')
        .replace(/\s*\((urgent|less urgent)\)$/i, '')
        .trim();

      if (cleanTitle) {
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        const todayStr = new Date().toISOString().split('T')[0];
        const newRem: ReminderItem = {
          id: `rem-conv-${Date.now()}`,
          title: cleanTitle,
          priority: detectedPriority,
          dueDate: todayStr,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        HealthStorageService.addReminder(newRem);
        reminderNote = `(I also added a ${detectedPriority === 'urgent' ? '🚨 Urgent' : '📝 Less Urgent'} reminder: "${cleanTitle}" to your Reminders list!) `;
      }
    }

    // Check if user asked about Bay Area events or festivals
    if (lower.includes('happenings') || lower.includes('bay area fun') || lower.includes('food festival') || lower.includes('bay area events') || lower.includes('things to do in sf') || lower.includes('pumpkin festival')) {
      reminderNote += `(By the way, check the "Bay Area Fun" tab for upcoming events like the Ghirardelli Chocolate Festival, Ferry Plaza Market, and Half Moon Bay Pumpkin Fair!) `;
    }

    // Check if user asked for low-sodium recipes or vegetarian food suggestions
    if (lower.includes('recipe') || lower.includes('low sodium') || lower.includes('non salty') || lower.includes('salt free') || lower.includes('vegetarian') || lower.includes('what to eat') || lower.includes('healthy food')) {
      reminderNote += `(I have wonderful non-salty and vegetarian recipes in your "Healthy Food" tab, like Tuscan White Bean Stew and Lentil Bourguignon!) `;
    }

    if (currentStage === 'greeting_mood') {
      let detectedMood: HealthMood = 'good';
      if (lower.includes('very good') || lower.includes('great') || lower.includes('wonderful') || lower.includes('excellent')) {
        detectedMood = 'very_good';
      } else if (lower.includes('poor') || lower.includes('terrible') || lower.includes('bad') || lower.includes('awful')) {
        detectedMood = 'poor';
      } else if (lower.includes('not great') || lower.includes('unwell') || lower.includes('sick')) {
        detectedMood = 'not_great';
      } else if (lower.includes('okay') || lower.includes('fine') || lower.includes('so-so') || lower.includes('tired')) {
        detectedMood = 'okay';
      }

      setExtractedRecord((prev) => ({ ...prev, mood: detectedMood }));
      nextStage = 'energy';
      aiResponse = `Thank you. How would you rate your energy level today on a scale from 1 (very low) to 10 (high)?`;
      suggestions = ['8 - Good energy', '6 - Moderate', '3 - Low energy'];
    } 
    else if (currentStage === 'energy') {
      const match = lower.match(/\b([1-9]|10)\b/);
      const energy = match ? parseInt(match[1], 10) : 7;
      setExtractedRecord((prev) => ({ ...prev, energyLevel: energy }));
      nextStage = 'sleep';
      aiResponse = `Got it! Energy rated at ${energy}/10. How did you sleep last night (also rated 1 to 10)?`;
      suggestions = ['8 - Slept well', '6 - Fair sleep', '4 - Woke up often'];
    }
    else if (currentStage === 'sleep') {
      const match = lower.match(/\b([1-9]|10)\b/);
      const sleep = match ? parseInt(match[1], 10) : 7;
      setExtractedRecord((prev) => ({ ...prev, sleepQuality: sleep }));
      nextStage = 'pain';
      aiResponse = `Recorded sleep at ${sleep}/10. Do you have any pain or discomfort today (0 for none, up to 10)?`;
      suggestions = ['0 - No pain', '2 - Mild aches', '5 - Moderate back pain'];
    }
    else if (currentStage === 'pain') {
      const match = lower.match(/\b([0-9]|10)\b/);
      const pain = match ? parseInt(match[1], 10) : 0;
      setExtractedRecord((prev) => ({ 
        ...prev, 
        painLevel: pain,
        painNotes: pain > 0 ? userText : undefined,
      }));
      nextStage = 'blood_pressure';
      aiResponse = `Understood. Have you measured your blood pressure today? You can say "No" or provide your reading (e.g. "120 over 80").`;
      suggestions = ['120 / 80', '125 / 82', 'No, did not measure'];
    }
    else if (currentStage === 'blood_pressure') {
      const bpMatch = lower.match(/(\d{2,3})\s*(?:\/|over|\s)\s*(\d{2,3})/);
      if (bpMatch) {
        const sys = parseInt(bpMatch[1], 10);
        const dia = parseInt(bpMatch[2], 10);
        setExtractedRecord((prev) => ({
          ...prev,
          bloodPressure: { measured: true, systolic: sys, diastolic: dia, pulse: 72 },
        }));
        aiResponse = `Logged blood pressure at ${sys}/${dia} mmHg. Have you taken your morning medications?`;
      } else {
        setExtractedRecord((prev) => ({
          ...prev,
          bloodPressure: { measured: false },
        }));
        aiResponse = `No problem! Have you taken your scheduled morning medications today?`;
      }
      nextStage = 'medication';
      suggestions = ['✅ Taken', '⏰ Not yet', '❌ Missed'];
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
      aiResponse = `Noted. Are you experiencing any symptoms today like dizziness, fatigue, headache, or stress?`;
      suggestions = ['No symptoms, feeling good', 'A little dizziness', 'Mild fatigue', 'Stress', 'Headache'];
    }
    else if (currentStage === 'symptoms') {
      const symList: string[] = [];
      if (lower.includes('dizz')) symList.push('Dizziness');
      if (lower.includes('fatigue') || lower.includes('tired')) symList.push('Fatigue');
      if (lower.includes('headache') || lower.includes('head ache')) symList.push('Headache');
      if (lower.includes('chest')) symList.push('Chest discomfort');
      if (lower.includes('breath')) symList.push('Shortness of breath');
      if (lower.includes('stress') || lower.includes('anxious') || lower.includes('worried')) symList.push('Stress');
      if (lower.includes('nausea') || lower.includes('stomach')) symList.push('Nausea');
      if (lower.includes('pain') || lower.includes('ache') || lower.includes('stiff')) symList.push('Pain');

      setExtractedRecord((prev) => ({ 
        ...prev, 
        symptoms: symList,
        symptomNotes: symList.length > 0 ? userText : undefined,
      }));
      nextStage = 'weight_notes';
      aiResponse = `Got it. Anything else you would like to record today, such as your weight or notes about your day?`;
      suggestions = ['Everything else looks good', 'Weight is 152 lbs', 'Going for a walk later'];
    }
    else if (currentStage === 'weight_notes') {
      const weightMatch = lower.match(/(\d{2,3}(?:\.\d)?)\s*(?:lbs|pounds|kg)?/);
      let foundWeight = weightMatch ? parseFloat(weightMatch[1]) : undefined;

      setExtractedRecord((prev) => ({
        ...prev,
        weight: foundWeight,
        dailyNotes: userText,
      }));
      nextStage = 'completed';
      aiResponse = `All done! I have populated your complete health record. You can review the details on the side and click "Save & Finish Check-In".`;
    }

    setStage(nextStage);

    setTimeout(() => {
      const finalAiResponse = reminderNote ? `${reminderNote}\n\n${aiResponse}` : aiResponse;
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: finalAiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions,
      };
      setMessages([...currentHistory, aiMsg]);
      if (profile.soundEnabled) {
        speakText(finalAiResponse);
      }
    }, 400);
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setVoiceError(null);
    setIsListening(true);

    SpeechService.startListening(
      (text, isFinal) => {
        setInputText(text);
        if (isFinal) {
          setIsListening(false);
          handleSendMessage(text);
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
    <div className="max-w-5xl mx-auto my-2 sm:my-4 space-y-4">
      {/* Mobile-only view toggle bar */}
      <div className="flex lg:hidden items-center bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
        <button
          onClick={() => setMobileView('chat')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
            mobileView === 'chat'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>💬 Voice / Chat</span>
        </button>

        <button
          onClick={() => setMobileView('record')}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
            mobileView === 'record'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-300" />
          <span>📋 Live Record</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Chat Window */}
        <div className={`lg:col-span-2 bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden flex flex-col h-[520px] sm:h-[600px] lg:h-[640px] ${
          mobileView === 'record' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-3.5 sm:p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold leading-tight">Voice Assistant</h2>
                <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                  Talk or type — logging check-in automatically
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Form Mode
            </button>
          </div>

          {/* Speed Adjustment Bar */}
          <div className="bg-emerald-900/90 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-1.5 text-xs border-b border-emerald-800/60">
            <span className="font-bold flex items-center gap-1 text-emerald-200 text-[11px] sm:text-xs">
              <Volume2 className="w-3.5 h-3.5" />
              Voice Speed:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {[
                { val: 0.75, label: '0.75x' },
                { val: 0.9, label: '0.9x Senior' },
                { val: 1.0, label: '1.0x' },
                { val: 1.25, label: '1.25x' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => handleSpeedChange(s.val)}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md font-bold text-[11px] sm:text-xs transition-all ${
                    Math.abs(currentSpeed - s.val) < 0.05
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-3.5 sm:p-5 font-semibold text-base sm:text-lg leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-900 border-2 border-slate-200 rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg flex-shrink-0"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick suggestion chips */}
                {msg.suggestions && msg.suggestions.length > 0 && stage !== 'completed' && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 max-w-[90%] sm:max-w-[85%]">
                    {msg.suggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 font-bold text-xs sm:text-sm border-2 border-slate-200 hover:border-emerald-400 shadow-sm transition-all active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 px-2">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t-2 border-slate-200 space-y-2">
            {voiceError && (
              <p className="text-xs font-bold text-rose-600 px-2">{voiceError}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleVoiceInput}
                className={`p-3 sm:p-4 rounded-2xl font-extrabold flex items-center justify-center transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff className="w-5 h-5 sm:w-7 sm:h-7" /> : <Mic className="w-5 h-5 sm:w-7 sm:h-7" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? 'Listening...' : 'Type or speak here...'}
                className="flex-1 text-base sm:text-lg p-2.5 sm:p-3.5 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none font-medium bg-slate-50 min-w-0"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-3 sm:p-4 rounded-2xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white transition-all flex-shrink-0"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Health Record Extraction Card */}
        <div className={`bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-5 sm:p-6 flex flex-col justify-between h-[520px] sm:h-[600px] lg:h-[640px] ${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                Live Extracted Record
              </h3>
              <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Auto-Populated
              </span>
            </div>

            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Mood:</span>
                <span className="font-extrabold capitalize text-slate-900">{extractedRecord.mood?.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Energy Level:</span>
                <span className="font-extrabold text-slate-900">{extractedRecord.energyLevel} / 10</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Sleep Quality:</span>
                <span className="font-extrabold text-slate-900">{extractedRecord.sleepQuality} / 10</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Pain Level:</span>
                <span className="font-extrabold text-slate-900">{extractedRecord.painLevel} / 10</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Blood Pressure:</span>
                <span className="font-extrabold text-slate-900">
                  {extractedRecord.bloodPressure?.measured && extractedRecord.bloodPressure.systolic
                    ? `${extractedRecord.bloodPressure.systolic}/${extractedRecord.bloodPressure.diastolic} mmHg`
                    : 'Not measured'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Medications:</span>
                <span className="font-extrabold capitalize text-slate-900">{extractedRecord.medicationStatus}</span>
              </div>

              <div className="py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500 block mb-1">Symptoms:</span>
                <div className="flex flex-wrap gap-1">
                  {extractedRecord.symptoms && extractedRecord.symptoms.length > 0 ? (
                    extractedRecord.symptoms.map((s, i) => (
                      <span key={i} className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">None reported</span>
                  )}
                </div>
              </div>

              {extractedRecord.dailyNotes && (
                <div className="py-1">
                  <span className="font-medium text-slate-500 text-xs block mb-1">Notes:</span>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    {extractedRecord.dailyNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleFinalSave}
              className="w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-base sm:text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Save & Finish Check-In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
