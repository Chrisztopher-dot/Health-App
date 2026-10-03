import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  CheckInRecord, 
  AppTab, 
  ReminderItem, 
  ScannedFoodResult, 
  RecipeItem, 
  MedicationLogEntry, 
  ActivityLogEntry, 
  BayAreaEvent 
} from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { MedicalAIService, MedicalAIResponse } from '../../services/medicalAIService';
import { HealthStorageService } from '../../services/healthStorage';
import { FoodScannerService } from '../../services/foodScannerService';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  RotateCcw, 
  Sparkles, 
  Camera, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  ListTodo,
  Pill,
  Utensils,
  Check,
  ShoppingBag
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
  userImageUrl?: string;
  spokenAudioText?: string;
  actionSuggestions?: {
    tab: AppTab;
    label: string;
    description?: string;
  }[];
  category?: string;
  taskItems?: ReminderItem[];
  foodScanResult?: ScannedFoodResult;
  recipes?: RecipeItem[];
  bpRecord?: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    date: string;
    inTarget: boolean;
  };
  medicationList?: MedicationLogEntry[];
  activityLog?: ActivityLogEntry;
  checkInSummary?: {
    mood: string;
    energy: number;
    sleep: number;
    bp?: string;
    symptoms: string[];
  };
  eventList?: BayAreaEvent[];
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
    label: '🩺 Log BP 120/80 Pulse 72',
    query: 'Log BP 120/80 pulse 72',
  },
  {
    label: '🥗 Scan Meal for Sodium & Carbs',
    query: 'Scan food: Grilled wild salmon with steamed broccoli and quinoa',
  },
  {
    label: '💊 Confirm Morning Meds Taken',
    query: 'I took all my morning medications',
  },
  {
    label: '📝 Do Daily Check-In',
    query: 'Log daily check in: Feeling good today, energy 8, slept 8 hours',
  },
  {
    label: '🍲 Heart-Healthy Recipes',
    query: 'Show this week low sodium dinner recipes',
  },
  {
    label: '🏃 Log a 30 Min Walk',
    query: 'Log a 30 minute neighborhood walk',
  },
  {
    label: '👨‍⚕️ Doctor Care & Next Checkup',
    query: 'What are the notes and follow-ups from my doctor visits?',
  },
  {
    label: '🚨 Check Health Risk Alerts',
    query: 'Are there any active health alerts or blood pressure warnings for me?',
  },
];

export const VoiceOrTextAssistant: React.FC<VoiceOrTextAssistantProps> = ({
  profile,
  history,
  onNavigateTab,
  onUpdateProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello ${profile.name || 'there'}! I am your fully synchronized Health AI Assistant. You can speak or type to do practically everything across the entire app:\n\n• 🎙️ **Voicemail Tasks**: Say "Listen to what's there to do" or "Cross off doctor visit".\n• 💓 **Blood Pressure**: Say "Log BP 120/80 pulse 70" or check your 30-day averages.\n• 📸 **Food Scanner**: Snap or upload a plate photo, or describe what you ate.\n• 🍲 **Recipes**: Browse low-sodium meals and add ingredients to your grocery list.\n• 💊 **Medications**: Confirm taken pills or check upcoming doses.\n• 📝 **Check-In**: Record daily mood, energy, and sleep in seconds.\n\nHow can I help you right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      actionSuggestions: [
        {
          tab: 'reminders',
          label: 'Reminders & Voicemail',
          description: 'Listen to tasks & cross off boxes [✓]',
        },
        {
          tab: 'scanner',
          label: 'Plate Scanner AI',
          description: 'Analyze meals, sodium, carbs & camera photos',
        },
        {
          tab: 'timeline',
          label: 'Vitals & BP Register',
          description: '30-day blood pressure & heart rate records',
        },
        {
          tab: 'recipes',
          label: 'Weekly Recipes',
          description: '7-day rotating low-sodium meal plans',
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
  const [, setSpeechError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
          handleSendMessage(text);
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

  // Process user text / voice command
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || isProcessing) return;

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

    SpeechService.stopSpeaking();
    setIsSpeaking(false);

    try {
      await new Promise((r) => setTimeout(r, 400));

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
          foodScanResult: aiResponse.foodScanResult,
          recipes: aiResponse.recipes,
          bpRecord: aiResponse.bpRecord,
          medicationList: aiResponse.medicationList,
          activityLog: aiResponse.activityLog,
          checkInSummary: aiResponse.checkInSummary,
          eventList: aiResponse.eventList,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);

        if (aiResponse.updatedProfile && onUpdateProfile) {
          onUpdateProfile(aiResponse.updatedProfile);
        }

        if (!voiceMuted) {
          speakText(aiResponse.spokenText || aiResponse.answer);
        }
      } else {
        const defaultMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: `I've analyzed your health suite. You can ask me to log blood pressure, scan meals, listen to voicemail tasks, or check prescriptions!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'general',
        };
        setMessages((prev) => [...prev, defaultMsg]);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error answering query:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an issue processing that health command. Please try again or tap the relevant tab.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsProcessing(false);
    }
  };

  // Direct In-Chat Food Plate Photo Scanning
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const userMsg: ChatMessage = {
        id: `user-photo-${Date.now()}`,
        sender: 'user',
        text: 'Analyzed food plate photo for calories, sodium & blood pressure safety:',
        userImageUrl: dataUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      try {
        const scanResult = await FoodScannerService.analyzeImage(dataUrl, 'Senior meal plate');
        FoodScannerService.saveScanToHistory(scanResult);

        const spoken = `I analyzed your food photo: ${scanResult.name}. It delivers ${scanResult.calories} calories, ${scanResult.sodiumMg} milligrams sodium, and ${scanResult.carbsGrams} grams carbohydrates. Rated ${scanResult.bloodPressureAssessment.ratingLabel}.`;

        const written = `📸 **Plate Scanner AI Result: ${scanResult.name}**\n\n• **Calories**: **${scanResult.calories} kcal** | **Health Score**: **${scanResult.healthScore}/100**\n• **Sodium**: **${scanResult.sodiumMg} mg** (${scanResult.bloodPressureAssessment.ratingLabel})\n• **Carbs**: **${scanResult.carbsGrams}g** (Net Carbs: **${scanResult.netCarbsGrams}g**)\n• **Protein**: **${scanResult.proteinGrams}g** | **Potassium**: **${scanResult.potassiumMg} mg**\n\n💡 **Senior Guidance**: ${scanResult.diningOutSmartTips[0] || 'Heart-healthy meal choice.'}`;

        const assistantMsg: ChatMessage = {
          id: `assistant-scan-${Date.now()}`,
          sender: 'assistant',
          text: written,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          spokenAudioText: spoken,
          category: 'food',
          foodScanResult: scanResult,
          actionSuggestions: [
            {
              tab: 'scanner',
              label: 'View in Food Scanner',
              description: 'Portion multiplier & full ingredients breakdown',
            },
            {
              tab: 'recipes',
              label: 'Browse Low-Sodium Recipes',
              description: '7-day heart healthy meal plans',
            },
          ],
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);

        if (!voiceMuted) {
          speakText(spoken);
        }
      } catch (err) {
        console.error('Error analyzing photo:', err);
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Interactive Task Cross-Off in Chat
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

  // Interactive Medication Dose Toggle in Chat
  const handleToggleMedicationInChat = (medId: string, medName: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    HealthStorageService.updateMedicationLogStatus(todayStr, medId, 'taken');
    const updated = HealthStorageService.getMedicationLogsForDate(todayStr);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.medicationList) {
          return {
            ...m,
            medicationList: updated,
          };
        }
        return m;
      })
    );

    if (!voiceMuted) {
      SpeechService.speak(`Confirmed: ${medName} marked as taken.`, selectedSpeed, undefined, selectedPersona);
    }
  };

  // Add Recipe Ingredients directly to Reminders / Grocery list
  const handleAddRecipeToGroceries = (recipe: RecipeItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newReminder: ReminderItem = {
      id: `rem-rec-${Date.now()}`,
      title: `Grocery List: Ingredients for ${recipe.title}`,
      priority: 'less_urgent',
      dueDate: todayStr,
      notes: recipe.ingredients.slice(0, 4).join(', '),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newReminder);
    const feedback = `Added ingredients for ${recipe.title} to your Reminders and Tasks grocery list!`;
    
    if (!voiceMuted) {
      SpeechService.speak(feedback, selectedSpeed, undefined, selectedPersona);
    }
    alert(feedback);
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
        text: `Chat cleared. Ask me anything to control your vitals, food scanner, recipes, medication times, or task voicemail!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-slate-100">
      
      {/* Header Banner with Voice Persona & Audio Speaker controls */}
      <div className="bg-gradient-to-r from-purple-900/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">Synchronized Voice & Text Health AI</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Full App Control
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Perform any action across the whole app: <strong className="text-white">Voicemail Tasks & Checkboxes</strong>, <strong className="text-white">Plate Photo Scanning</strong>, <strong className="text-white">BP Registration</strong>, <strong className="text-white">Medication Doses</strong>, and <strong className="text-white">Recipes</strong>.
              </p>
            </div>
          </div>

          {/* Voice Output Settings Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl">
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
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{voiceMuted ? 'Speaker Muted' : 'Speaker On'}</span>
            </button>

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
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSpeed}
              onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
            >
              <option value={0.85}>0.85x Gentle</option>
              <option value={1.0}>1.0x Normal</option>
              <option value={1.15}>1.15x Lively</option>
            </select>

            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white animate-pulse"
              >
                Stop ⏹
              </button>
            )}

            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-xs text-purple-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>On-Device Synchronized Intelligence:</strong> All speech dictations, photo scans, and vitals logs sync directly to local encrypted storage.
          </span>
        </div>
      </div>

      {/* Quick Synchronized Action Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
          <span className="flex items-center gap-1 text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Synchronized AI Prompts (Click to Execute Instantly):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.query)}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-purple-950/70 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold text-slate-200 hover:text-purple-200 transition-all active:scale-95 text-left disabled:opacity-50 shadow-sm"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Chat Window */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col min-h-[500px] max-h-[700px] backdrop-blur-md">
        
        {/* Messages List Area */}
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
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 space-y-3 ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-br-sm shadow-md'
                      : 'bg-slate-800/95 border border-slate-700 text-slate-100 rounded-bl-sm shadow-md'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between gap-4 text-[11px] opacity-75 font-semibold border-b border-slate-700/40 pb-1.5">
                    <span>{isUser ? 'You' : 'Health AI Assistant'}</span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => speakText(msg.spokenAudioText || msg.text)}
                          className="hover:text-purple-300 p-0.5 rounded transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Uploaded Plate Image */}
                  {msg.userImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-purple-400/40 max-w-xs">
                      <img src={msg.userImageUrl} alt="Food Plate Upload" className="w-full h-44 object-cover" />
                    </div>
                  )}

                  {/* Message Main Text */}
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>

                  {/* ================================================================= */}
                  {/* RICH CARD 1: FOOD SCANNER & PLATE NUTRITION BREAKDOWN */}
                  {/* ================================================================= */}
                  {msg.foodScanResult && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <span>{msg.foodScanResult.emoji}</span>
                          <span>{msg.foodScanResult.name}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {msg.foodScanResult.bloodPressureAssessment.ratingLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Calories</span>
                          <span className="text-sm font-black text-amber-300">{msg.foodScanResult.calories} kcal</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Sodium</span>
                          <span className="text-sm font-black text-rose-300">{msg.foodScanResult.sodiumMg} mg</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Carbs</span>
                          <span className="text-sm font-black text-indigo-300">{msg.foodScanResult.carbsGrams}g</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Potassium</span>
                          <span className="text-sm font-black text-emerald-300">{msg.foodScanResult.potassiumMg} mg</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('scanner')}
                        className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Plate Scanner for Full Breakdown & Portion Multiplier &rarr;</span>
                      </button>
                    </div>
                  )}

                  {/* ================================================================= */}
                  {/* RICH CARD 2: HEALTHY RECIPES WITH 1-TAP GROCERY REMINDER ADD */}
                  {/* ================================================================= */}
                  {msg.recipes && msg.recipes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-700/60">
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5" /> Featured Low-Sodium Recipes:
                      </div>
                      <div className="space-y-2">
                        {msg.recipes.map((rec) => (
                          <div key={rec.id} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white block">{rec.title}</span>
                              <span className="text-[10px] text-slate-300 block mt-0.5">
                                🧂 {rec.sodiumMgPerServing} mg sodium | 🔥 {rec.caloriesPerServing} kcal | ⏱ {rec.prepTimeMinutes + rec.cookTimeMinutes} mins
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddRecipeToGroceries(rec)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Add to Grocery Reminders</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================================================================= */}
                  {/* RICH CARD 3: INTERACTIVE TASK CHECKLIST WITH CHECKBOXES */}
                  {/* ================================================================= */}
                  {msg.taskItems && msg.taskItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-amber-300" />
                          <span>Tasks & Reminders Checklist (Tap Box to Cross Off):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
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
                                ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                                : 'bg-slate-900/90 border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTaskInChat(task.id, task.title, task.completed)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm transition-all active:scale-90 flex-shrink-0 ${
                                  task.completed
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : task.priority === 'urgent'
                                    ? 'border-rose-500 bg-slate-900'
                                    : 'border-indigo-400 bg-slate-900'
                                }`}
                                title="Toggle box"
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
                                  <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[9px] ${
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
                                    <span className="text-emerald-400 font-bold">✓ Crossed Off</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onNavigateTab('reminders')}
                              className="text-[10px] font-bold text-slate-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-800 whitespace-nowrap"
                            >
                              Manage &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ================================================================= */}
                  {/* RICH CARD 4: MEDICATION SCHEDULE & DIRECT DOSE TOGGLE */}
                  {/* ================================================================= */}
                  {msg.medicationList && msg.medicationList.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5" /> Today's Medication Schedule:
                      </div>
                      <div className="space-y-1.5">
                        {msg.medicationList.map((m) => (
                          <div key={m.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">{m.medicationName} ({m.dosage})</span>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">{m.timeOfDay}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleMedicationInChat(m.medicationId, m.medicationName)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                m.status === 'taken'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{m.status === 'taken' ? 'Taken' : 'Take Dose'}</span>
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
                        <Sparkles className="w-3 h-3" /> Quick Shortcuts:
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
                Synchronizing with vitals, plate scanner, recipes & reminders...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Mic, Photo Camera & Text Submit */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            
            {/* Direct Camera / Plate Photo Upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 shadow-md flex-shrink-0"
              title="Snap or upload food plate photo for AI sodium & calorie analysis"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Microphone Voice Input */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3.5 rounded-2xl transition-all flex items-center justify-center flex-shrink-0 shadow-md ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-950/60 ring-4 ring-rose-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice recognition'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Smart Text Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Speak or type: "Listen to tasks", "Log BP 120/80", "Scan meal", "I took morning meds"...'
              disabled={isProcessing}
              className="flex-1 text-sm py-3.5 px-4 rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none font-medium"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all active:scale-95 shadow-md flex-shrink-0"
              title="Send Command"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default VoiceOrTextAssistant;
