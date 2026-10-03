import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, CheckInRecord, AppTab, ReminderItem } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { MedicalAIService, MedicalAIResponse } from '../../services/medicalAIService';
import { HealthStorageService } from '../../services/healthStorage';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  Camera, 
  Footprints, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle,
  Clock,
  ListTodo
} from 'lucide-react';

interface VoiceOrTextAssistantProps {
  profile: UserProfile;
  history: CheckInRecord[];
  onNavigateTab: (tab: AppTab) => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  spokenAudioText?: string;
  actionSuggestions?: {
    tab: AppTab;
    label: string;
    description?: string;
  }[];
  category?: string;
  taskItems?: ReminderItem[];
}

const QUICK_PROMPTS = [
  {
    label: '📼 Listen to Tasks (Voicemail)',
    query: 'Listen to what is there to do in my tasks',
  },
  {
    label: '🚨 Play Urgent Reminders',
    query: 'Play my most urgent reminders and tasks',
  },
  {
    label: '📋 My Reminders & Tasks',
    query: 'What are my reminders and tasks for today?',
  },
  {
    label: '✅ Cross Off Tasks',
    query: 'Cross off my first pending reminder task',
  },
  {
    label: '➕ Add Doctor Reminder',
    query: 'Remind me to call cardiologist tomorrow 10 AM',
  },
  {
    label: '🥗 Food & Sodium Safety',
    query: 'How does my diet and sodium look, and how can the Food Scanner help me?',
  },
  {
    label: '🩺 BP & Pulse Status',
    query: 'What is my current blood pressure and pulse status?',
  },
  {
    label: '💊 Medication Schedule',
    query: 'What medications am I scheduled to take today and did I miss any doses?',
  },
  {
    label: '🏃 Activity & Walking Goals',
    query: 'What are my physical activity goals and recommended exercises for today?',
  },
  {
    label: '👨‍⚕️ Doctor Visits & Notes',
    query: 'What are the notes and follow-ups from my doctor visits?',
  },
  {
    label: '🚨 Health Risk Alerts',
    query: 'Are there any active health alerts or blood pressure warnings for me?',
  },
];

export const VoiceOrTextAssistant: React.FC<VoiceOrTextAssistantProps> = ({
  profile,
  history,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello ${profile.name || 'there'}! I am your Health & Medical AI Assistant. I have linked access to your blood pressure, pulse, medication schedule, food scanner records, physical activities, and doctor recommendations. You can talk to me via microphone or type your question below. How can I support you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      actionSuggestions: [
        {
          tab: 'scanner',
          label: 'Open AI Food Scanner',
          description: 'Analyze meals, sodium, carbs & restaurant menus',
        },
        {
          tab: 'timeline',
          label: 'View Vitals & BP Trends',
          description: '30-day blood pressure & heart rate analytics',
        },
        {
          tab: 'activities',
          label: 'Physical Activities',
          description: 'Daily walks, low-impact exercise & vitality logs',
        },
      ],
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(profile.voicePersona || 'samantha');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(profile.voiceSpeed ?? 1.0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningCallbackRef = useRef<(() => void) | null>(null);

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
      if (stopListeningCallbackRef.current) {
        stopListeningCallbackRef.current();
      }
    };
  }, []);

  // Speak text using SpeechService
  const speakText = (text: string) => {
    if (voiceMuted) return;
    setIsSpeaking(true);
    const cleanSpeech = text
      .replace(/[*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ');

    SpeechService.speak(
      cleanSpeech,
      selectedSpeed,
      () => setIsSpeaking(false),
      selectedPersona
    );
  };

  const handleStopSpeaking = () => {
    SpeechService.stopSpeaking();
    setIsSpeaking(false);
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (stopListeningCallbackRef.current) {
        stopListeningCallbackRef.current();
        stopListeningCallbackRef.current = null;
      }
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    const stopFn = SpeechService.startListening(
      (text: string, isFinal: boolean) => {
        setInputValue(text);
        if (isFinal) {
          setIsListening(false);
        }
      },
      (errorMsg: string) => {
        console.error('Speech recognition error:', errorMsg);
        setIsListening(false);
        setSpeechError(errorMsg);
      },
      () => {
        setIsListening(false);
      }
    );

    stopListeningCallbackRef.current = stopFn;
    setIsListening(true);
  };

  // Process a user query
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || isProcessing) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    setSpeechError(null);

    // Stop speaking if currently active
    SpeechService.stopSpeaking();
    setIsSpeaking(false);

    try {
      // Simulate intelligent thinking delay for realism
      await new Promise((r) => setTimeout(r, 450));

      const aiResponse: MedicalAIResponse | null = MedicalAIService.processMedicalQuery(
        textToSend,
        profile,
        history
      );

      if (aiResponse) {
        const actionSuggestions = aiResponse.suggestedAction
          ? [
              {
                tab: aiResponse.suggestedAction.tab,
                label: aiResponse.suggestedAction.label,
                description: 'Direct link to this app section',
              },
            ]
          : undefined;

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: aiResponse.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          spokenAudioText: aiResponse.spokenText,
          actionSuggestions,
          category: aiResponse.category,
          taskItems: aiResponse.taskItems,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);

        // Read response aloud over speaker if not muted
        if (!voiceMuted) {
          speakText(aiResponse.spokenText || aiResponse.answer);
        }
      } else {
        const defaultMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: `I've analyzed your health records. You can ask me about your blood pressure numbers, prescription medication schedule, food scanner ratings, or daily physical activities!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'general',
        };
        setMessages((prev) => [...prev, defaultMsg]);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error answering health query:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I apologize, but I encountered an issue retrieving that health record. Please try again or navigate directly to the relevant tab.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsProcessing(false);
    }
  };

  const handleToggleTaskInChat = (taskId: string, title: string, currentCompleted: boolean) => {
    HealthStorageService.toggleReminder(taskId);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.taskItems) {
          return {
            ...m,
            taskItems: m.taskItems.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    completed: !currentCompleted,
                    completedAt: !currentCompleted ? new Date().toISOString() : undefined,
                  }
                : t
            ),
          };
        }
        return m;
      })
    );

    const action = !currentCompleted ? 'Crossed off' : 'Reopened';
    if (!voiceMuted) {
      SpeechService.speak(`${action}: ${title}`, selectedSpeed, undefined, selectedPersona);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    SpeechService.stopSpeaking();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Chat cleared. Ask me anything about your vitals, food scanner, medication times, or physical activities!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner with Voice Persona & Audio Speaker controls */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 flex-shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">Voice & Text Medical AI Assistant</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Fully Linked AI
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Hands-free voice speaker or fast text chat. Directly connected to your <span className="text-cyan-300 font-bold">Food Scanner</span>, <span className="text-blue-300 font-bold">Blood Pressure & Pulse</span>, <span className="text-emerald-300 font-bold">Medications</span>, <span className="text-teal-300 font-bold">Physical Activities</span>, and <span className="text-amber-300 font-bold">Doctor Notes</span>.
              </p>
            </div>
          </div>

          {/* Voice Output Settings Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/60 border border-slate-800 p-2.5 rounded-2xl">
            {/* Speaker Mute/Unmute */}
            <button
              onClick={() => {
                if (!voiceMuted && isSpeaking) {
                  handleStopSpeaking();
                }
                setVoiceMuted(!voiceMuted);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                voiceMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
              title={voiceMuted ? 'Voice Speaker is Muted (Click to Unmute)' : 'Voice Speaker is Active (Click to Mute)'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{voiceMuted ? 'Speaker Muted' : 'Speaker On'}</span>
            </button>

            {/* Persona Selector */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={selectedPersona}
                onChange={(e) => {
                  const personaId = e.target.value;
                  setSelectedPersona(personaId);
                  SpeechService.speak(`Voice updated`, selectedSpeed, undefined, personaId);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
              >
                {CURATED_VOICE_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={selectedSpeed}
                onChange={(e) => {
                  const speed = parseFloat(e.target.value);
                  setSelectedSpeed(speed);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
              >
                <option value={0.85}>0.85x Gentle</option>
                <option value={1.0}>1.0x Normal</option>
                <option value={1.15}>1.15x Lively</option>
              </select>
            </div>

            {/* Stop Speaking Button if currently talking */}
            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white animate-pulse"
              >
                Stop Speech ⏹
              </button>
            )}

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security & End-to-End Encryption Note */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-xs text-purple-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>HIPAA-Compliant & Encrypted:</strong> All health data queries, vitals, and conversation logs are encrypted on-device with zero unauthorized third-party sharing.
          </span>
        </div>
      </div>

      {/* Quick Question Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
          <span>Quick Linked Health Queries</span>
          <span>Click any prompt to ask</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.query)}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700/70 hover:border-purple-500/40 text-xs font-bold text-slate-200 hover:text-purple-200 transition-all active:scale-95 text-left disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col min-h-[460px] max-h-[620px] backdrop-blur-md">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 space-y-2.5 ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-br-sm shadow-md'
                      : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-bl-sm shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[11px] opacity-75 font-semibold">
                    <span>{isUser ? 'You' : 'Health AI Assistant'}</span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => speakText(msg.spokenAudioText || msg.text)}
                          className="hover:text-purple-300 p-0.5 rounded transition-colors"
                          title="Read this answer aloud over speaker"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message content with formatted lines */}
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* Interactive Tasks & Reminders Checklist with Checkboxes */}
                  {msg.taskItems && msg.taskItems.length > 0 && (
                    <div className="pt-3 border-t border-slate-700/60 mt-2 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-amber-300" />
                          <span>Interactive Task Checklist (Tap Box to Cross Off):</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {msg.taskItems.filter((t) => t.completed).length}/{msg.taskItems.length} Done
                        </span>
                      </div>

                      <div className="space-y-2">
                        {msg.taskItems.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              task.completed
                                ? 'bg-slate-950/60 border-slate-800 opacity-60'
                                : task.priority === 'urgent'
                                ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400 shadow-sm'
                                : 'bg-slate-900/90 border-slate-700 hover:border-indigo-400 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Prominent Checkbox Box */}
                              <button
                                type="button"
                                onClick={() => handleToggleTaskInChat(task.id, task.title, task.completed)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all active:scale-90 flex-shrink-0 ${
                                  task.completed
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                    : task.priority === 'urgent'
                                    ? 'border-rose-500 bg-slate-900 hover:bg-rose-950/50 text-transparent'
                                    : 'border-indigo-400 bg-slate-900 hover:bg-indigo-950/50 text-transparent'
                                }`}
                                title={task.completed ? 'Click to uncross / reopen' : 'Click box to cross off task'}
                              >
                                {task.completed ? '✓' : ''}
                              </button>

                              <div className="min-w-0">
                                <span className={`text-xs sm:text-sm font-bold block truncate ${
                                  task.completed ? 'text-slate-400 line-through' : 'text-white'
                                }`}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[9px] ${
                                    task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                                  }`}>
                                    {task.priority === 'urgent' ? 'Urgent' : 'Routine'}
                                  </span>
                                  {task.dueTime && (
                                    <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                                      <Clock className="w-2.5 h-2.5" /> {task.dueTime}
                                    </span>
                                  )}
                                  {task.completed && (
                                    <span className="text-emerald-400 font-bold">
                                      ✓ Crossed Off
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateTab('reminders')}
                              className="text-[10px] font-bold text-slate-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                              Manage &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deep link action suggestions */}
                  {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-1.5">
                      <div className="text-[11px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Linked Actions & Tabs
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.actionSuggestions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => onNavigateTab(act.tab)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-purple-950/80 border border-purple-500/30 text-left transition-all group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-black text-purple-200 group-hover:text-white flex items-center gap-1">
                                {act.label}
                              </div>
                              {act.description && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {act.description}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-200 flex-shrink-0 font-black text-xs">
                    ME
                  </div>
                )}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 justify-start items-center text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center animate-spin">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-semibold animate-pulse">
                Analyzing your vitals, food scanner logs & medical records...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Listening Active Wave Indicator */}
        {isListening && (
          <div className="mt-3 p-3 rounded-2xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-between text-purple-200 text-xs animate-pulse">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Listening to your voice... Speak now!
            </div>
            <button
              onClick={toggleListening}
              className="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 text-xs"
            >
              Done / Stop
            </button>
          </div>
        )}

        {/* Input Controls: Speaker Mic Toggle & Text input */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
          {/* Microphone Voice Input Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-slate-800 text-purple-300 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/40'
            }`}
            title={isListening ? 'Stop Voice Recording' : 'Start Voice Input (Microphone)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g. 'Can I eat clam chowder?', 'Check my pulse', 'Show medication times')..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={isProcessing}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isProcessing}
            className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/20 active:scale-95"
            title="Send query"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Linked App Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Food Scanner Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <Camera className="w-5 h-5" />
            <h3 className="text-sm font-black text-white">AI Food Scanner</h3>
          </div>
          <p className="text-xs text-slate-400">
            Ask about sodium thresholds, carbs, or snap meal photos to check blood pressure safety.
          </p>
          <button
            onClick={() => onNavigateTab('scanner')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
          >
            Open Scanner <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Medication & Vitals Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center gap-2.5 text-blue-400">
            <Activity className="w-5 h-5" />
            <h3 className="text-sm font-black text-white">Medication & Vitals</h3>
          </div>
          <p className="text-xs text-slate-400">
            Target: &lt;{profile.targetSystolicMin}–{profile.targetSystolicMax}/{profile.targetDiastolicMin}–{profile.targetDiastolicMax} mmHg. Live pulse and prescription logs.
          </p>
          <button
            onClick={() => onNavigateTab('timeline')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-1"
          >
            View Vitals <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Physical Activities Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-teal-500/40 transition-colors">
          <div className="flex items-center gap-2.5 text-teal-400">
            <Footprints className="w-5 h-5" />
            <h3 className="text-sm font-black text-white">Physical Activities</h3>
          </div>
          <p className="text-xs text-slate-400">
            Track daily walks, stretching routines, pickleball, and weekly active minutes.
          </p>
          <button
            onClick={() => onNavigateTab('activities')}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 pt-1"
          >
            Track Activities <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
