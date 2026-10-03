import React, { useState, useEffect } from 'react';
import { UserProfile, ReminderItem, ReminderPriority, AppTab } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { TaskVoicemailSpeaker } from './TaskVoicemailSpeaker';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Calendar, 
  Clock, 
  Volume2, 
  Check, 
  ClipboardList, 
  Edit2,
  Send,
  ArrowRight,
  Pill,
  Camera,
  Utensils,
  Bot,
  RefreshCw,
  Heart,
  Search,
  CheckSquare,
  ListTodo
} from 'lucide-react';

interface RemindersTrackerProps {
  profile: UserProfile;
  onNavigateTab?: (tab: AppTab) => void;
}

const QUICK_PRESETS: {
  title: string;
  priority: ReminderPriority;
  dueTime?: string;
  notes?: string;
  emoji: string;
}[] = [
  {
    title: 'Housework (Chores / Tidy Up)',
    priority: 'less_urgent',
    dueTime: 'Afternoon',
    notes: 'Home cleaning, laundry, organizing, or light maintenance.',
    emoji: '🏡',
  },
  {
    title: 'Pick up Fresh Groceries & Fruit',
    priority: 'less_urgent',
    dueTime: '11:00 AM',
    notes: 'Bananas, oatmeal, berries, greens, and healthy pantry items.',
    emoji: '🛒',
  },
  {
    title: 'Call Family & Loved Ones',
    priority: 'less_urgent',
    dueTime: '04:00 PM',
    notes: 'Catch up on weekend plans and family news.',
    emoji: '📞',
  },
  {
    title: 'Water the Houseplants & Garden',
    priority: 'less_urgent',
    dueTime: 'Morning',
    notes: 'Give extra water to outdoor potted plants and garden beds.',
    emoji: '🌿',
  },
  {
    title: 'Evening Neighborhood Walk in Fresh Air',
    priority: 'less_urgent',
    dueTime: '05:30 PM',
    notes: 'Enjoy 20-30 minutes of gentle fresh air stroll.',
    emoji: '🚶',
  },
  {
    title: 'Morning Gentle Stretch & Mobility',
    priority: 'less_urgent',
    dueTime: '08:00 AM',
    notes: 'Light shoulder rolls, back stretch, and ankle rotations.',
    emoji: '🧘',
  },
  {
    title: 'Daily Hydration Goal Check',
    priority: 'less_urgent',
    dueTime: '02:00 PM',
    notes: 'Keep a full water pitcher nearby and enjoy herbal tea.',
    emoji: '💧',
  },
];

interface AIActionFeedback {
  type: 'add' | 'change' | 'complete' | 'vital_log' | 'nav' | 'info';
  title: string;
  details: string;
  timestamp: string;
  actionTab?: AppTab;
  actionButtonLabel?: string;
}

export const RemindersTracker: React.FC<RemindersTrackerProps> = ({ profile, onNavigateTab }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'urgent' | 'less_urgent' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // AI Voice & Text Studio State
  const [aiInputText, setAiInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<AIActionFeedback | null>({
    type: 'info',
    title: 'AI Task & Health Studio Ready',
    details: 'Speak with your voice or type below to add tasks, cross off boxes, reschedule times, or log vitals.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Fast Inline Add Bar State
  const [fastTitle, setFastTitle] = useState<string>('');
  const [fastPriority, setFastPriority] = useState<ReminderPriority>('urgent');

  // Detailed Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalPriority, setModalPriority] = useState<ReminderPriority>('urgent');
  const [modalDueDate, setModalDueDate] = useState<string>(todayStr);
  const [modalDueTime, setModalDueTime] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    const list = HealthStorageService.getAllReminders();
    setReminders([...list]);
  };

  const handleToggleReminder = (id: string, reminderTitle: string, currentCompleted: boolean) => {
    HealthStorageService.toggleReminder(id);
    loadReminders();

    const action = !currentCompleted ? 'Crossed off' : 'Reopened';
    const feedback: AIActionFeedback = {
      type: 'complete',
      title: `${action}: ${reminderTitle}`,
      details: !currentCompleted 
        ? '✓ Marked as completed with strike-through in your list.' 
        : 'Box unchecked and returned to active to-do list.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(`${action}: ${reminderTitle}`, profile.voiceSpeed);
    }
  };

  const handleBulkCrossOffAll = () => {
    const pending = reminders.filter((r) => !r.completed);
    if (pending.length === 0) return;
    
    pending.forEach((r) => {
      HealthStorageService.toggleReminder(r.id);
    });
    loadReminders();

    const feedback: AIActionFeedback = {
      type: 'complete',
      title: '✓ All Pending Tasks Crossed Off',
      details: `Crossed off all ${pending.length} pending task boxes.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(`Crossed off all ${pending.length} pending tasks.`, profile.voiceSpeed);
    }
  };

  const handleDeleteReminder = (id: string, reminderTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove "${reminderTitle}"?`)) {
      return;
    }
    HealthStorageService.deleteReminder(id);
    loadReminders();

    const feedback: AIActionFeedback = {
      type: 'info',
      title: 'Reminder Removed',
      details: `Removed "${reminderTitle}" from your reminders list.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(`Removed ${reminderTitle} from reminders.`, profile.voiceSpeed);
    }
  };

  const handleFastAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fastTitle.trim()) return;

    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: fastTitle.trim(),
      priority: fastPriority,
      dueDate: todayStr,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();
    setFastTitle('');

    const feedbackMsg = `Added ${fastPriority === 'urgent' ? 'urgent' : 'routine'} reminder: ${newItem.title}`;
    const feedback: AIActionFeedback = {
      type: 'add',
      title: `Added ${fastPriority === 'urgent' ? 'Urgent' : 'Routine'} Task`,
      details: newItem.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(feedbackMsg, profile.voiceSpeed);
    }
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setModalTitle('');
    setModalPriority('urgent');
    setModalDueDate(todayStr);
    setModalDueTime('');
    setModalNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ReminderItem) => {
    setEditingReminder(item);
    setModalTitle(item.title);
    setModalPriority(item.priority);
    setModalDueDate(item.dueDate || todayStr);
    setModalDueTime(item.dueTime || '');
    setModalNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!modalTitle.trim()) return;

    if (editingReminder) {
      const updatedItem: ReminderItem = {
        ...editingReminder,
        title: modalTitle.trim(),
        priority: modalPriority,
        dueDate: modalDueDate || todayStr,
        dueTime: modalDueTime.trim() || undefined,
        notes: modalNotes.trim() || undefined,
      };
      HealthStorageService.updateReminder(editingReminder.id, updatedItem);
      loadReminders();
      setIsModalOpen(false);

      const feedback: AIActionFeedback = {
        type: 'change',
        title: 'Updated Reminder',
        details: `Saved changes for "${updatedItem.title}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiFeedback(feedback);

      if (profile.soundEnabled) {
        SpeechService.speak(`Updated reminder: ${updatedItem.title}`, profile.voiceSpeed);
      }
    } else {
      const newItem: ReminderItem = {
        id: `rem-${Date.now()}`,
        title: modalTitle.trim(),
        priority: modalPriority,
        dueDate: modalDueDate || todayStr,
        dueTime: modalDueTime.trim() || undefined,
        notes: modalNotes.trim() || undefined,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      HealthStorageService.addReminder(newItem);
      loadReminders();
      setIsModalOpen(false);

      const feedbackMsg = `Added ${modalPriority === 'urgent' ? 'urgent' : 'routine'} reminder: ${newItem.title}`;
      const feedback: AIActionFeedback = {
        type: 'add',
        title: `Added ${modalPriority === 'urgent' ? 'Urgent' : 'Routine'} Task`,
        details: `${newItem.title}${newItem.dueTime ? ` (Due: ${newItem.dueTime})` : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiFeedback(feedback);

      if (profile.soundEnabled) {
        SpeechService.speak(feedbackMsg, profile.voiceSpeed);
      }
    }
  };

  const handleQuickAddPreset = (preset: typeof QUICK_PRESETS[0]) => {
    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: preset.title,
      priority: preset.priority,
      dueDate: todayStr,
      dueTime: preset.dueTime,
      notes: preset.notes,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    const feedback: AIActionFeedback = {
      type: 'add',
      title: 'Added Preset Task',
      details: preset.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(`Added reminder: ${preset.title}`, profile.voiceSpeed);
    }
  };

  // Helper date calculators
  const parseRelativeDate = (text: string): string => {
    const lower = text.toLowerCase();
    const now = new Date();

    if (lower.includes('tomorrow')) {
      const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    }
    if (lower.includes('in 2 days') || lower.includes('in two days')) {
      const d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    }
    if (lower.includes('in 3 days') || lower.includes('in three days')) {
      const d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    }
    if (lower.includes('next week')) {
      const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const targetDay = i;
        const currentDay = now.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        const d = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      }
    }

    return todayStr;
  };

  // Helper time extractor
  const parseTimeText = (text: string): string | undefined => {
    const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i);
    if (timeMatch) {
      return timeMatch[1].toUpperCase().replace(/\./g, '');
    }
    if (text.toLowerCase().includes('morning')) return '09:00 AM';
    if (text.toLowerCase().includes('noon') || text.toLowerCase().includes('midday')) return '12:00 PM';
    if (text.toLowerCase().includes('afternoon')) return '02:00 PM';
    if (text.toLowerCase().includes('evening')) return '06:00 PM';
    if (text.toLowerCase().includes('night') || text.toLowerCase().includes('bedtime')) return '09:00 PM';
    return undefined;
  };

  // Comprehensive AI Voice and Text Command Parser
  const handleProcessAICommand = (inputRaw: string) => {
    if (!inputRaw || !inputRaw.trim()) return;
    const cmd = inputRaw.trim();
    const lower = cmd.toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Cross-App Navigation
    if (
      lower.includes('open food scanner') || 
      lower.includes('plate scanner') || 
      lower.includes('scan food') || 
      lower.includes('scan meal') ||
      lower.includes('take me to scanner')
    ) {
      const feedback: AIActionFeedback = {
        type: 'nav',
        title: 'Opening AI Food Scanner',
        details: 'Navigating to AI Plate & Food Scanner to analyze meal ingredients, sodium & carbs.',
        timestamp,
        actionTab: 'scanner',
        actionButtonLabel: 'Go to Plate Scanner',
      };
      setAiFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak('Opening AI Plate Scanner.', profile.voiceSpeed);
      onNavigateTab?.('scanner');
      return;
    }

    if (
      lower.includes('open recipes') || 
      lower.includes('low sodium recipes') || 
      lower.includes('healthy meals') ||
      lower.includes('take me to recipes')
    ) {
      const feedback: AIActionFeedback = {
        type: 'nav',
        title: 'Opening Healthy Recipes',
        details: 'Navigating to weekly low-sodium & heart-healthy recipes.',
        timestamp,
        actionTab: 'recipes',
        actionButtonLabel: 'Go to Recipes',
      };
      setAiFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak('Opening low-sodium recipes.', profile.voiceSpeed);
      onNavigateTab?.('recipes');
      return;
    }

    if (
      lower.includes('open health bot') || 
      lower.includes('talk to assistant') || 
      lower.includes('ai assistant') ||
      lower.includes('open assistant')
    ) {
      const feedback: AIActionFeedback = {
        type: 'nav',
        title: 'Opening AI Health Assistant',
        details: 'Navigating to your conversational medical AI companion.',
        timestamp,
        actionTab: 'assistant',
        actionButtonLabel: 'Talk to Health AI',
      };
      setAiFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak('Opening AI Health Assistant.', profile.voiceSpeed);
      onNavigateTab?.('assistant');
      return;
    }

    // 2. Direct Blood Pressure & Vitals Registration
    const bpMatch = lower.match(/(?:log|record|register|save|bp|blood\s*pressure)?\s*(\d{2,3})[\s\/\-]+(?:over\s*)?(\d{2,3})(?:\s*(?:pulse|hr|heart\s*rate)?\s*(\d{2,3}))?/i);
    if (
      bpMatch && 
      (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('pulse') || lower.includes('over') || lower.includes('log') || lower.includes('register')) &&
      parseInt(bpMatch[1], 10) >= 70 && parseInt(bpMatch[1], 10) <= 240 &&
      parseInt(bpMatch[2], 10) >= 40 && parseInt(bpMatch[2], 10) <= 140
    ) {
      const systolic = parseInt(bpMatch[1], 10);
      const diastolic = parseInt(bpMatch[2], 10);
      const pulse = bpMatch[3] ? parseInt(bpMatch[3], 10) : 72;

      HealthStorageService.registerBloodPressureAndPulse(
        todayStr,
        systolic,
        diastolic,
        pulse,
        'Registered via Reminders AI Voice & Text Studio'
      );

      const feedbackMsg = `Registered Blood Pressure: ${systolic}/${diastolic} mmHg, Pulse: ${pulse} bpm. Saved to Health Timeline!`;
      const feedback: AIActionFeedback = {
        type: 'vital_log',
        title: '🩺 Blood Pressure & Pulse Registered',
        details: `${systolic}/${diastolic} mmHg (Pulse: ${pulse} bpm) successfully saved to your Health Vitals & Timeline.`,
        timestamp,
        actionTab: 'timeline',
        actionButtonLabel: 'View in Health Timeline',
      };
      setAiFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedbackMsg, profile.voiceSpeed);
      return;
    }

    // 3. Changing / Rescheduling / Editing existing tasks
    if (
      lower.startsWith('change ') || 
      lower.startsWith('reschedule ') || 
      lower.startsWith('update ') || 
      lower.startsWith('move ') || 
      lower.startsWith('postpone ') ||
      lower.startsWith('edit ')
    ) {
      const targetTime = parseTimeText(cmd);
      const targetDate = parseRelativeDate(cmd);

      const candidateList = HealthStorageService.getAllReminders();
      let matchedReminder: ReminderItem | null = null;

      for (const rem of candidateList) {
        const words = rem.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        if (words.some((w) => lower.includes(w))) {
          matchedReminder = rem;
          break;
        }
      }

      if (!matchedReminder && candidateList.length > 0) {
        matchedReminder = candidateList.find((r) => !r.completed) || candidateList[0];
      }

      if (matchedReminder) {
        const updates: Partial<ReminderItem> = {};
        if (targetTime) updates.dueTime = targetTime;
        if (targetDate && targetDate !== todayStr) updates.dueDate = targetDate;
        if (lower.includes('urgent')) updates.priority = 'urgent';
        if (lower.includes('routine')) updates.priority = 'less_urgent';

        if (lower.includes('note') || lower.includes('bring') || lower.includes('with')) {
          updates.notes = cmd;
        }

        HealthStorageService.updateReminder(matchedReminder.id, updates);
        loadReminders();

        const changeDesc = `Rescheduled "${matchedReminder.title}" to ${updates.dueTime || updates.dueDate || 'new time'}.`;
        const feedback: AIActionFeedback = {
          type: 'change',
          title: '🔄 Task Info Updated',
          details: `${changeDesc} (Priority: ${updates.priority || matchedReminder.priority})`,
          timestamp,
        };
        setAiFeedback(feedback);

        if (profile.soundEnabled) {
          SpeechService.speak(changeDesc, profile.voiceSpeed);
        }
        return;
      }
    }

    // 4. Mark Done / Cross off existing task
    if (
      lower.startsWith('cross off ') || 
      lower.startsWith('check off ') || 
      lower.startsWith('mark ') || 
      lower.startsWith('done ') || 
      lower.startsWith('complete ') ||
      lower.startsWith('finish ')
    ) {
      const candidateList = HealthStorageService.getAllReminders();
      const match = candidateList.find((r) => !r.completed && lower.includes(r.title.toLowerCase().substring(0, 8))) ||
                    candidateList.find((r) => !r.completed);

      if (match) {
        handleToggleReminder(match.id, match.title, false);
        const feedback: AIActionFeedback = {
          type: 'complete',
          title: '✓ Task Crossed Off',
          details: `Crossed off: "${match.title}". Box checked!`,
          timestamp,
        };
        setAiFeedback(feedback);
        return;
      }
    }

    // 5. Adding a new task / reminder with smart priority & scheduling detection
    let detectedPriority: ReminderPriority = 'less_urgent';
    const isUrgentKeywords = [
      'urgent', 'doctor', 'physician', 'hospital', 'appointment', 'emergency',
      'prescription', 'refill', 'medication', 'pills', 'medicine', 'blood pressure',
      'critical', 'important', 'test', 'dentist', 'clinic', 'asap', 'cardiologist',
      'surgery', 'lab', 'blood test'
    ];

    if (isUrgentKeywords.some((kw) => lower.includes(kw))) {
      detectedPriority = 'urgent';
    }

    const detectedTime = parseTimeText(cmd);
    const detectedDate = parseRelativeDate(cmd);

    let cleanTitle = cmd
      .replace(/^(remind me to|add a reminder to|add reminder to|add urgent reminder to|add less urgent reminder to|don't let me forget to|please remind me to|set reminder for|remember to|create task to|create a task for|schedule a|schedule an|schedule)\s+/i, '')
      .replace(/\s*\((urgent|less urgent)\)$/i, '')
      .replace(/\s*(tomorrow|today|next week|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?|in \d+ days)/gi, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 2) {
      cleanTitle = cmd;
    }

    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const newItem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: cleanTitle,
      priority: detectedPriority,
      dueDate: detectedDate,
      dueTime: detectedTime,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newItem);
    loadReminders();

    const timeString = detectedTime ? ` at ${detectedTime}` : '';
    const dateString = detectedDate !== todayStr ? ` on ${detectedDate}` : '';
    const feedbackMsg = `Added ${detectedPriority === 'urgent' ? 'urgent' : 'routine'} reminder: "${cleanTitle}"${timeString}${dateString}.`;
    
    const feedback: AIActionFeedback = {
      type: 'add',
      title: `✨ Added ${detectedPriority === 'urgent' ? 'Urgent' : 'Routine'} Task`,
      details: `"${cleanTitle}" scheduled for ${detectedTime || 'anytime'}${dateString || ' today'}.`,
      timestamp,
    };
    setAiFeedback(feedback);

    if (profile.soundEnabled) {
      SpeechService.speak(feedbackMsg, profile.voiceSpeed);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setAiFeedback({
      type: 'info',
      title: '🎙️ Listening to Your Voice...',
      details: 'Speak clearly: "Remind me to call Dr. Miller tomorrow 10 AM", "Cross off medication", "Log BP 120/80"...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    SpeechService.startListening(
      (text, isFinal) => {
        setAiInputText(text);
        if (isFinal) {
          setIsListening(false);
          handleProcessAICommand(text);
        }
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputText.trim()) return;
    const text = aiInputText.trim();
    setAiInputText('');
    handleProcessAICommand(text);
  };

  // Filter and search logic
  const urgentList = reminders.filter((r) => r.priority === 'urgent');
  const lessUrgentList = reminders.filter((r) => r.priority === 'less_urgent');
  const completedList = reminders.filter((r) => r.completed);

  const activeUrgentCount = urgentList.filter((r) => !r.completed).length;
  const activeLessUrgentCount = lessUrgentList.filter((r) => !r.completed).length;
  const completedCount = completedList.length;

  const getFilteredItems = (): ReminderItem[] => {
    let list = reminders;
    if (activeCategoryFilter === 'urgent') {
      list = urgentList;
    } else if (activeCategoryFilter === 'less_urgent') {
      list = lessUrgentList;
    } else if (activeCategoryFilter === 'completed') {
      list = completedList;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => 
        r.title.toLowerCase().includes(q) || 
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        (r.dueTime && r.dueTime.toLowerCase().includes(q))
      );
    }

    return list;
  };

  const displayedItems = getFilteredItems();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn text-slate-100">
      
      {/* ========================================================================= */}
      {/* TOP HERO: AI VOICE & TEXT TASK STUDIO & CROSS-APP HEALTH HUB */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-indigo-950/95 via-slate-900 to-purple-950/90 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-5">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Hero Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                AI Voice & Text Task Studio
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                Cross-App AI Bot Linked
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full">
                {reminders.length} Total Task Inputs
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Reminders, Tasks & AI Health Studio</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Speak or type to <strong className="text-white">add tasks</strong>, <strong className="text-white">cross off boxes [✓]</strong>, <strong className="text-white">reschedule times</strong>, and <strong className="text-white">register blood pressure vitals</strong> with seamless AI Bot syncing.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Add Detailed Reminder</span>
          </button>
        </div>

        {/* AI Voice & Text Unified Smart Input Bar */}
        <div className="relative z-10 space-y-3">
          <form onSubmit={handleTextSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            
            {/* Primary Voice Mic Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`px-4 sm:px-5 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-95 flex-shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-950/60 ring-4 ring-rose-500/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/50'
              }`}
              title={isListening ? 'Stop Listening' : 'Tap to speak task or command'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 text-white animate-bounce" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-indigo-200" />
                  <span>Voice AI</span>
                </>
              )}
            </button>

            {/* Smart Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder='Speak or type: "Cross off doctor appointment", "Remind me to call pharmacy tomorrow 10 AM", "Log BP 120/80"...'
                className="w-full h-full text-sm sm:text-base py-3.5 pl-4 pr-12 rounded-2xl border border-indigo-500/40 bg-slate-950/90 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none font-medium shadow-inner"
              />
              <button
                type="submit"
                disabled={!aiInputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition-all active:scale-95 shadow-md"
                title="Process AI Command"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Fast Submit Button on Desktop */}
            <button
              type="submit"
              disabled={!aiInputText.trim()}
              className="hidden sm:flex px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ask / Add</span>
            </button>
          </form>

          {/* AI Live Feedback & Confirmation Alert Card */}
          {aiFeedback && (
            <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              aiFeedback.type === 'vital_log'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                : aiFeedback.type === 'complete'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                : aiFeedback.type === 'change'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-100'
            }`}>
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 flex-shrink-0 mt-0.5 sm:mt-0">
                  {aiFeedback.type === 'vital_log' ? (
                    <Heart className="w-4 h-4 text-rose-400" />
                  ) : aiFeedback.type === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : aiFeedback.type === 'change' ? (
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      {aiFeedback.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {aiFeedback.timestamp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-200 mt-0.5 leading-relaxed">
                    {aiFeedback.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => SpeechService.speak(aiFeedback.details, profile.voiceSpeed)}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                  title="Listen to response"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Listen</span>
                </button>

                {aiFeedback.actionTab && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(aiFeedback.actionTab!)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span>{aiFeedback.actionButtonLabel || 'View'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Voice & Text Interactive Example Prompts */}
          <div className="pt-1">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Quick Voice / Text Action Prompts (Click to Execute):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleProcessAICommand('Listen to all tasks')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/60 border border-indigo-500/40 hover:border-indigo-400 text-xs font-bold text-indigo-200 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>📼</span> "Listen to what's there to do"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Play most urgent tasks')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-950/60 border border-rose-500/40 hover:border-rose-400 text-xs font-bold text-rose-200 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🚨</span> "Play urgent tasks"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Play routine tasks')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-xs font-bold text-purple-200 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>📋</span> "Play routine chores"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Cross off call doctor')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-xs font-bold text-emerald-200 transition-all active:scale-95"
              >
                ✅ "Cross off call doctor"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Remind me to call Dr. Miller tomorrow 10 AM')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-xs font-bold text-slate-200 transition-all active:scale-95"
              >
                ➕ "Remind me to call Dr. Miller tomorrow 10 AM"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Change Lisinopril reminder to 8:30 AM')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400 text-xs font-bold text-slate-200 transition-all active:scale-95"
              >
                🔄 "Change Lisinopril reminder to 8:30 AM"
              </button>
              <button
                type="button"
                onClick={() => handleProcessAICommand('Log BP 122/80 pulse 70')}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-400 text-xs font-bold text-rose-200 transition-all active:scale-95"
              >
                🩺 "Log BP 122/80 pulse 70"
              </button>
            </div>
          </div>

          {/* Cross-App AI Bot Features Direct Links Strip */}
          {onNavigateTab && (
            <div className="pt-2 border-t border-indigo-500/20">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                🔗 Cross-App AI Bot Features & Direct Registration Shortcuts:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('timeline')}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-black">
                    <Heart className="w-3.5 h-3.5" />
                    <span>BP & Vitals Log</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Record readings & trends
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('medicine')}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-black">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Med Tracker</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Pills & refill alerts
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('scanner')}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Plate Scanner AI</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Scan food & sodium
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('recipes')}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Healthy Recipes</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Weekly 7-day meal packs
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter('urgent');
                    SpeechService.speak('Showing urgent doctor appointments.', profile.voiceSpeed);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-black">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Appointments</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Doctor & private visits
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('assistant')}
                  className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-black">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                    Full medical health bot
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTEN TO WHAT IS THERE TO DO: VOICEMAIL & PHONE SPEAKER AUDIO BRIEFING */}
      {/* ========================================================================= */}
      <TaskVoicemailSpeaker
        reminders={reminders}
        profile={profile}
        onToggleReminder={handleToggleReminder}
      />

      {/* ========================================================================= */}
      {/* FAST MANUAL ADD INLINE BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Manual Quick-Add Form (Urgent vs Routine):
        </label>
        <form onSubmit={handleFastAdd} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950/80 p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setFastPriority('urgent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                fastPriority === 'urgent'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Urgent</span>
            </button>

            <button
              type="button"
              onClick={() => setFastPriority('less_urgent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                fastPriority === 'less_urgent'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Routine</span>
            </button>
          </div>

          <input
            type="text"
            value={fastTitle}
            onChange={(e) => setFastTitle(e.target.value)}
            placeholder="e.g. Call pharmacy for Lisinopril refill, Water tomatoes, Buy milk..."
            className="flex-1 text-sm sm:text-base py-3 px-4 rounded-2xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
          />

          <button
            type="submit"
            disabled={!fastTitle.trim()}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
        </form>
      </div>

      {/* Task Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Total Inputs</span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-400 mt-1 block">
            {reminders.length}
          </span>
          <span className="text-xs font-semibold text-slate-400">All Registered Items</span>
        </div>

        <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider block flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Urgent Pending
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 block">
            {activeUrgentCount}
          </span>
          <span className="text-xs font-semibold text-rose-300/80">High Priority</span>
        </div>

        <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider block flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Routine Pending
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1 block">
            {activeLessUrgentCount}
          </span>
          <span className="text-xs font-semibold text-indigo-300/80">Daily Tasks</span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-3xl shadow-lg text-center">
          <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Crossed Off
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
            {completedCount}
          </span>
          <span className="text-xs font-semibold text-emerald-300/80">Checked Boxes</span>
        </div>
      </div>

      {/* Senior Quick Task Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            <span>Senior Quick-Add Task Presets (Tap to Add Instantly)</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.title}
              onClick={() => handleQuickAddPreset(p)}
              className="px-3 py-1.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{p.emoji}</span>
              <span>{p.title.split('(')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TASK LISTING INPUT VIEW: SEARCH, FILTER TABS & BOX CROSS-OFF CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
        
        {/* Header & Search / Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg sm:text-xl font-black text-white">
              Task Inputs & Checkbox Register
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
              />
            </div>
            {activeUrgentCount + activeLessUrgentCount > 0 && (
              <button
                type="button"
                onClick={handleBulkCrossOffAll}
                className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap active:scale-95 transition-all"
                title="Cross off all pending task boxes at once"
              >
                Cross Off All
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            🌟 All Inputs ({reminders.length})
          </button>

          <button
            onClick={() => setActiveCategoryFilter('urgent')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'urgent'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Urgent / Medical ({urgentList.length})</span>
          </button>

          <button
            onClick={() => setActiveCategoryFilter('less_urgent')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'less_urgent'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Routine ({lessUrgentList.length})</span>
          </button>

          <button
            onClick={() => setActiveCategoryFilter('completed')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
              activeCategoryFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Crossed Off [✓] ({completedCount})</span>
          </button>
        </div>

        {/* Task Items List */}
        {displayedItems.length === 0 ? (
          <div className="py-10 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">
              {searchQuery ? 'No task inputs matched your search.' : 'No tasks in this category.'}
            </p>
            <p className="text-xs text-slate-500">
              Use the top AI Voice or Text bar to add a new task anytime!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  item.completed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    : item.priority === 'urgent'
                    ? 'bg-rose-950/20 border-rose-500/35 hover:border-rose-500/60 shadow-sm'
                    : 'bg-indigo-950/15 border-indigo-500/35 hover:border-indigo-500/60 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Large High-Contrast Checkbox Box */}
                  <button
                    onClick={() => handleToggleReminder(item.id, item.title, item.completed)}
                    className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all active:scale-90 flex-shrink-0 mt-0.5 ${
                      item.completed
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50'
                        : item.priority === 'urgent'
                        ? 'border-rose-500 bg-slate-950/80 hover:bg-rose-950/40 text-transparent'
                        : 'border-indigo-400 bg-slate-950/80 hover:bg-indigo-950/40 text-transparent'
                    }`}
                    title={item.completed ? 'Click box to uncross / reopen' : 'Click box to cross off task'}
                  >
                    {item.completed ? '✓' : ''}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-base sm:text-lg font-black block tracking-tight ${
                        item.completed ? 'text-slate-400 line-through' : 'text-white'
                      }`}>
                        {item.title}
                      </span>
                      {item.completed && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Crossed Off
                        </span>
                      )}
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {item.priority === 'urgent' ? '🚨 Urgent' : '📋 Routine'}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] font-bold text-slate-400">
                      {item.dueTime && (
                        <span className="flex items-center gap-1 text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3" /> Due {item.dueTime}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-slate-300 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-lg">
                          <Calendar className="w-3 h-3 text-slate-400" /> {item.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => SpeechService.speak(`Task: ${item.title}${item.dueTime ? ', due at ' + item.dueTime : ''}. Status: ${item.completed ? 'Crossed off' : 'Pending'}`, profile.voiceSpeed)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    title="Read task aloud"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-300" />
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-slate-400 hover:text-indigo-300 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Edit reminder details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReminder(item.id, item.title)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Detailed Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-indigo-400" />
                <span>{editingReminder ? 'Edit Reminder' : 'Add Detailed Reminder'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist appointment at 2pm"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Urgency Category
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalPriority('urgent')}
                    className={`py-3 px-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                      modalPriority === 'urgent'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Urgent / High Priority</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPriority('less_urgent')}
                    className={`py-3 px-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                      modalPriority === 'less_urgent'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Routine / Normal</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={modalDueDate}
                    onChange={(e) => setModalDueDate(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Time / Context
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM or Morning"
                    value={modalDueTime}
                    onChange={(e) => setModalDueTime(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bring 30-day blood pressure chart and ID card."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={!modalTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black shadow-lg flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingReminder ? 'Save Changes' : 'Add Reminder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default RemindersTracker;
