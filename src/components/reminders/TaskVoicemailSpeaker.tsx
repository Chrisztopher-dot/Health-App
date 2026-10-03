import React, { useState, useEffect, useRef } from 'react';
import { ReminderItem, UserProfile } from '../../types/health';
import { SpeechService, CURATED_VOICE_PERSONAS } from '../../services/speechService';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square as StopIcon, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Check, 
  RotateCcw,
  Headphones
} from 'lucide-react';

interface TaskVoicemailSpeakerProps {
  reminders: ReminderItem[];
  profile: UserProfile;
  onToggleReminder: (id: string, title: string, completed: boolean) => void;
}

type VoicemailFilterMode = 'urgent_first' | 'urgent_only' | 'routine_only' | 'today_only';

export const TaskVoicemailSpeaker: React.FC<TaskVoicemailSpeakerProps> = ({
  reminders,
  profile,
  onToggleReminder,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [filterMode, setFilterMode] = useState<VoicemailFilterMode>('urgent_first');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedPersona, setSelectedPersona] = useState<string>(profile.voicePersona || 'samantha');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(profile.voiceSpeed ?? 1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasFinishedQueue, setHasFinishedQueue] = useState<boolean>(false);

  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  // Build filtered and ranked queue
  const getQueue = (): ReminderItem[] => {
    const pending = reminders.filter((r) => !r.completed);

    if (filterMode === 'urgent_only') {
      return pending.filter((r) => r.priority === 'urgent');
    }
    if (filterMode === 'routine_only') {
      return pending.filter((r) => r.priority === 'less_urgent');
    }
    if (filterMode === 'today_only') {
      return pending.filter((r) => !r.dueDate || r.dueDate === todayStr);
    }
    
    // 'urgent_first' (default): Urgent items ranked at top, then routine items
    return [...pending].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return 0;
    });
  };

  const queue = getQueue();
  const currentItem = queue[currentIndex] || null;

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
    };
  }, []);

  // Reset index when filter mode changes
  const handleFilterChange = (mode: VoicemailFilterMode) => {
    SpeechService.stopSpeaking();
    setIsPlaying(false);
    setFilterMode(mode);
    setCurrentIndex(0);
    setHasFinishedQueue(false);
  };

  // Play a single message item
  const playItemAtIndex = (index: number) => {
    if (index >= queue.length || index < 0) {
      setIsPlaying(false);
      setHasFinishedQueue(true);
      if (!isMuted) {
        SpeechService.speak(
          'End of task messages. You are all caught up on this list.',
          selectedSpeed,
          undefined,
          selectedPersona
        );
      }
      return;
    }

    const item = queue[index];
    setCurrentIndex(index);
    setIsPlaying(true);
    setHasFinishedQueue(false);

    const messageNum = index + 1;
    const totalCount = queue.length;
    const priorityLabel = item.priority === 'urgent' ? 'Urgent medical task.' : 'Routine daily task.';
    const timePart = item.dueTime ? ` Scheduled for ${item.dueTime}.` : '';
    const datePart = item.dueDate && item.dueDate !== todayStr ? ` On ${item.dueDate}.` : ' Today.';
    const notesPart = item.notes ? ` Notes: ${item.notes}.` : '';

    const speechScript = `Message ${messageNum} of ${totalCount}. ${priorityLabel} ${item.title}.${timePart}${datePart}${notesPart}`;

    if (!isMuted) {
      SpeechService.speak(
        speechScript,
        selectedSpeed,
        () => {
          // Callback when message completes
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) {
                playItemAtIndex(index + 1);
              }
            }, 750);
          }
        },
        selectedPersona
      );
    }
  };

  const handleStartPlayback = () => {
    if (queue.length === 0) {
      SpeechService.speak('You have no pending tasks in this category. Everything is completed!', selectedSpeed, undefined, selectedPersona);
      return;
    }
    
    // If we were at the end, restart from 0
    const startIdx = hasFinishedQueue ? 0 : currentIndex;
    playItemAtIndex(startIdx);
  };

  const handlePausePlayback = () => {
    SpeechService.stopSpeaking();
    setIsPlaying(false);
  };

  const handleStopPlayback = () => {
    SpeechService.stopSpeaking();
    setIsPlaying(false);
    setCurrentIndex(0);
    setHasFinishedQueue(false);
  };

  const handleSkipNext = () => {
    SpeechService.stopSpeaking();
    if (currentIndex + 1 < queue.length) {
      playItemAtIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
      setHasFinishedQueue(true);
      SpeechService.speak('You reached the end of your task list.', selectedSpeed, undefined, selectedPersona);
    }
  };

  const handleSkipPrev = () => {
    SpeechService.stopSpeaking();
    if (currentIndex > 0) {
      playItemAtIndex(currentIndex - 1);
    } else {
      playItemAtIndex(0);
    }
  };

  const handleCrossOffCurrent = () => {
    if (!currentItem) return;
    const targetTitle = currentItem.title;
    onToggleReminder(currentItem.id, targetTitle, false);
    
    SpeechService.speak(`Crossed off: ${targetTitle}. Moving to next message.`, selectedSpeed, () => {
      // Advance to next or restart
      if (currentIndex < queue.length - 1) {
        playItemAtIndex(currentIndex);
      } else {
        handleStopPlayback();
      }
    }, selectedPersona);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5">
      
      {/* Background Speaker Grille Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      
      {/* Top Header Bar with Voicemail Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Task Voicemail & Phone Speaker</span>
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Headphones className="w-3 h-3" /> Audio Briefing
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Listen to your reminders & to-dos out loud like phone voicemail, ranked by urgency.
            </p>
          </div>
        </div>

        {/* Audio Toolbar: Speed & Persona */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <select
            value={selectedPersona}
            onChange={(e) => {
              const persona = e.target.value;
              setSelectedPersona(persona);
              SpeechService.speak('Speaker voice updated', selectedSpeed, undefined, persona);
            }}
            className="bg-slate-950/80 border border-indigo-500/40 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
            title="Choose AI Voice Speaker Persona"
          >
            {CURATED_VOICE_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name} ({p.accent})
              </option>
            ))}
          </select>

          <select
            value={selectedSpeed}
            onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
            className="bg-slate-950/80 border border-indigo-500/40 text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
            title="Speech Playback Speed"
          >
            <option value={0.85}>0.85x Gentle</option>
            <option value={1.0}>1.0x Normal</option>
            <option value={1.15}>1.15x Lively</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (!isMuted && isPlaying) {
                handlePausePlayback();
              }
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isMuted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40'
            }`}
            title={isMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Urgency Filter Selection Tabs */}
      <div className="space-y-1.5 relative z-10">
        <label className="block text-[11px] font-black uppercase tracking-wider text-indigo-300">
          Select Voicemail Queue to Listen To:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleFilterChange('urgent_first')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
              filterMode === 'urgent_first'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase">🌟 All Tasks</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <span className="text-[11px] opacity-85 font-medium">
              Ranked: Urgent First ({reminders.filter((r) => !r.completed).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('urgent_only')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
              filterMode === 'urgent_only'
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950/60'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase">🚨 Urgent Only</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <span className="text-[11px] opacity-85 font-medium">
              Doctor & Medical ({reminders.filter((r) => !r.completed && r.priority === 'urgent').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('routine_only')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
              filterMode === 'routine_only'
                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-950/60'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase">📋 Routine Chores</span>
              <Clock className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <span className="text-[11px] opacity-85 font-medium">
              House, Calls & Habits ({reminders.filter((r) => !r.completed && r.priority === 'less_urgent').length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('today_only')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
              filterMode === 'today_only'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase">📅 Today Due</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span className="text-[11px] opacity-85 font-medium">
              Scheduled Today ({reminders.filter((r) => !r.completed && (!r.dueDate || r.dueDate === todayStr)).length})
            </span>
          </button>
        </div>
      </div>

      {/* Phone Voicemail Console Screen */}
      <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative z-10 space-y-4 shadow-inner">
        
        {/* Digital Status Tape Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
              {isPlaying ? '▶ PLAYING VOICEMAIL TAPE' : queue.length > 0 ? '⏸ VOICEMAIL STANDBY' : '✓ 0 MESSAGES'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl text-amber-300">
              {queue.length > 0 ? `MESSAGE ${currentIndex + 1} OF ${queue.length}` : 'NO MESSAGES'}
            </span>
          </div>
        </div>

        {/* Current Playing Task Banner */}
        {currentItem ? (
          <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            currentItem.priority === 'urgent'
              ? 'bg-rose-950/30 border-rose-500/40 text-white'
              : 'bg-indigo-950/30 border-indigo-500/40 text-white'
          }`}>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  currentItem.priority === 'urgent'
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                    : 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                }`}>
                  {currentItem.priority === 'urgent' ? '🚨 Urgent Task' : '📋 Routine Task'}
                </span>
                {currentItem.dueTime && (
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due {currentItem.dueTime}
                  </span>
                )}
                {currentItem.dueDate && (
                  <span className="text-xs text-slate-300">
                    ({currentItem.dueDate === todayStr ? 'Today' : currentItem.dueDate})
                  </span>
                )}
              </div>
              <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                {currentItem.title}
              </h4>
              {currentItem.notes && (
                <p className="text-xs text-slate-300 font-medium">
                  {currentItem.notes}
                </p>
              )}
            </div>

            {/* Quick Cross-Off Box Button */}
            <button
              type="button"
              onClick={handleCrossOffCurrent}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap self-end sm:self-center flex-shrink-0"
              title="Cross off this task and advance"
            >
              <Check className="w-4 h-4" />
              <span>Cross Off [✓]</span>
            </button>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">All Caught Up in this Category!</p>
            <p className="text-xs text-slate-500">Select another queue or add a new task.</p>
          </div>
        )}

        {/* Cassette / Audio Wave Visualizer Animation */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[40, 75, 55, 95, 60, 85, 45, 90, 70, 100, 65, 80, 50, 90, 60, 75].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 0.28}px`, animationDelay: `${(i % 5) * 120}ms` }}
                className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Voicemail Player Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSkipPrev}
            disabled={queue.length === 0 || currentIndex === 0}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-slate-200 transition-all active:scale-95"
            title="Previous Message"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {!isPlaying ? (
            <button
              type="button"
              onClick={handleStartPlayback}
              disabled={queue.length === 0}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/60 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Listen to Tasks ({queue.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePausePlayback}
              className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm sm:text-base shadow-xl shadow-amber-950/60 flex items-center gap-2.5 transition-all active:scale-95"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Speaker</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStopPlayback}
            disabled={!isPlaying && currentIndex === 0}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-slate-200 transition-all active:scale-95"
            title="Stop Playback"
          >
            <StopIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSkipNext}
            disabled={queue.length === 0 || currentIndex >= queue.length - 1}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-slate-200 transition-all active:scale-95"
            title="Next Message"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => playItemAtIndex(0)}
            disabled={queue.length === 0}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-slate-200 transition-all active:scale-95"
            title="Replay from Message 1"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mini Queue Preview Strip */}
      {queue.length > 0 && (
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
            <span>Tape Queue (Click any message to listen):</span>
            <span>{queue.length} Tasks Scheduled</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {queue.map((task, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => playItemAtIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600/40 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-amber-300">
                        #{idx + 1}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {task.priority === 'urgent' ? 'Urgent' : 'Routine'}
                      </span>
                    </div>
                    <span className="text-xs font-bold block truncate text-white mt-0.5">
                      {task.title}
                    </span>
                  </div>

                  {isSelected && isPlaying && (
                    <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
