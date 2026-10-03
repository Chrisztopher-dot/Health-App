import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, BayAreaEvent, BayAreaCategory, BayAreaRegion, ReminderItem } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  BellPlus, 
  Search, 
  Check, 
  RefreshCw,
  Sun,
  ShieldCheck,
  Ticket,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface BayAreaHappeningsProps {
  profile: UserProfile;
  onAddReminderSuccess?: (reminderTitle: string) => void;
}

const REGION_OPTIONS: { key: BayAreaRegion; label: string; icon: string }[] = [
  { key: 'all', label: 'All Bay Area', icon: '🌉' },
  { key: 'san_francisco', label: 'San Francisco', icon: '🌁' },
  { key: 'east_bay', label: 'East Bay (Oakland/Berkeley)', icon: '⛵' },
  { key: 'peninsula_south_bay', label: 'Peninsula & South Bay', icon: '🌲' },
  { key: 'north_bay_marin', label: 'North Bay / Marin', icon: '⚓' },
  { key: 'napa_sonoma', label: 'Napa & Sonoma Wine Country', icon: '🍇' },
];

const CATEGORY_OPTIONS: { key: 'all' | 'this_week' | BayAreaCategory; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Bay Area Fun', emoji: '✨' },
  { key: 'this_week', label: "🌟 This Week's Highlights", emoji: '🌟' },
  { key: 'restaurant', label: 'Restaurants (Veg & Low-Salt)', emoji: '🍽️' },
  { key: 'food_festival', label: 'Food & Wine Festivals', emoji: '🌮' },
  { key: 'music_concert', label: 'Music & Concerts', emoji: '🎵' },
  { key: 'farmers_market', label: 'Farmers Markets', emoji: '🥑' },
  { key: 'art_culture', label: 'Art & Culture', emoji: '🎨' },
  { key: 'nature_walk', label: 'Nature & Garden Walks', emoji: '🌸' },
  { key: 'fair_festival', label: 'Fairs & Celebrations', emoji: '🎃' },
  { key: 'community', label: 'Community Gatherings', emoji: '🤝' },
];

export const BayAreaHappenings: React.FC<BayAreaHappeningsProps> = ({ profile }) => {
  const [events, setEvents] = useState<BayAreaEvent[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<BayAreaRegion>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'this_week' | BayAreaCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addedReminderId, setAddedReminderId] = useState<string | null>(null);

  const weekInfo = useMemo(() => HealthStorageService.getCurrentWeekInfo(), []);

  // AI Voice Concierge State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // Modal Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newRegion, setNewRegion] = useState<BayAreaRegion>('san_francisco');
  const [newCategory, setNewCategory] = useState<BayAreaCategory>('restaurant');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newDateRange, setNewDateRange] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newAdmission, setNewAdmission] = useState<string>('Entrees $12 – $20');
  const [newSeniorNotes, setNewSeniorNotes] = useState<string>('Wheelchair accessible, flat walking, quiet atmosphere, low-sodium friendly');
  const [newEmoji, setNewEmoji] = useState<string>('🍽️');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const syncResult = HealthStorageService.syncWeeklyBayAreaEvents();
    setEvents([...syncResult.events]);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HealthStorageService.toggleBookmarkBayAreaEvent(id);
    loadEvents();
  };

  const handleAddToReminders = (event: BayAreaEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];

    const newReminder: ReminderItem = {
      id: `rem-event-${Date.now()}`,
      title: `Attend ${event.title} (${event.locationName})`,
      priority: 'less_urgent',
      dueDate: todayStr,
      dueTime: event.time.split('–')[0].trim(),
      notes: `Location: ${event.locationName}. Admission: ${event.admission}. Tip: ${event.weatherTip || 'Enjoy the outing!'}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newReminder);
    setAddedReminderId(event.id);
    setTimeout(() => setAddedReminderId(null), 3000);

    const msg = `Added "${event.title}" to your Reminders list!`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleReadAloud = (event: BayAreaEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const speechText = `${event.title}. Located at ${event.locationName}. Happening ${event.dateRange}, from ${event.time}. ${event.description}. Admission is ${event.admission}. Accessibility note: ${event.seniorFriendlyNotes || 'Paved walking paths.'}`;
    setAiVoiceFeedback(`Reading details for ${event.title}`);
    SpeechService.speak(speechText, profile.voiceSpeed);
  };

  const handleResetEvents = () => {
    const refreshed = HealthStorageService.resetBayAreaEvents();
    setEvents(refreshed);
    const msg = 'Bay Area happenings list has been refreshed to latest events!';
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleSaveCustomEvent = () => {
    if (!newTitle.trim()) return;

    const newEvent: BayAreaEvent = {
      id: `bae-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      region: newRegion,
      locationName: newLocation.trim() || 'San Francisco Bay Area',
      dateRange: newDateRange.trim() || 'Upcoming Weekend',
      time: newTime.trim() || '10:00 AM – 4:00 PM',
      description: newDescription.trim() || 'Exciting local Bay Area community happening with music and food.',
      highlights: ['Local food & treats', 'Community gathering', 'Scenic atmosphere'],
      admission: newAdmission.trim() || 'Free Public Entry',
      emoji: newEmoji.trim() || '🎉',
      imageUrl: newImageUrl.trim() || undefined,
      seniorFriendlyNotes: newSeniorNotes.trim(),
      weatherTip: 'Mild California weather. Layered clothing advised.',
      isBookmarked: true,
    };

    HealthStorageService.addBayAreaEvent(newEvent);
    loadEvents();

    // Reset modal form
    setNewTitle('');
    setNewLocation('');
    setNewDateRange('');
    setNewTime('');
    setNewDescription('');
    setNewImageUrl('');
    setIsAddModalOpen(false);

    const msg = `Added custom happening: ${newEvent.title}`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  // AI Voice Assistant Parser for Bay Area Events
  const handleProcessVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();

    if (
      lower.includes('restaurant') || 
      lower.includes('dining') || 
      lower.includes('vegetarian') || 
      lower.includes('non salty') || 
      lower.includes('low salt') || 
      lower.includes('low sodium') || 
      lower.includes('greens') || 
      lower.includes('wildseed') || 
      lower.includes('cha-ya') || 
      lower.includes('millennium') || 
      lower.includes('shangri-la') ||
      lower.includes('vegan') ||
      lower.includes('shizen') ||
      lower.includes('nourish') ||
      lower.includes('amy')
    ) {
      setSelectedCategory('restaurant');
      setSelectedRegion('all');
      setSearchQuery('');
      const count = events.filter((e) => e.category === 'restaurant').length;
      const feedback = `Found ${count} senior-friendly Bay Area restaurants serving vegetarian and low-sodium cuisine!`;
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('food') || lower.includes('eat') || lower.includes('wine') || lower.includes('chocolate') || lower.includes('pizza') || lower.includes('culinary') || lower.includes('festival')) {
      setSelectedCategory('food_festival');
      setSelectedRegion('all');
      setSearchQuery('');
      const count = events.filter((e) => e.category === 'food_festival').length;
      const feedback = `Found ${count} Bay Area food and culinary festivals!`;
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('music') || lower.includes('concert') || lower.includes('jazz') || lower.includes('stern grove')) {
      setSelectedCategory('music_concert');
      setSelectedRegion('all');
      setSearchQuery('');
      const feedback = 'Showing Bay Area music events and outdoor concerts!';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('farmers market') || lower.includes('produce') || lower.includes('organic') || lower.includes('ferry building')) {
      setSelectedCategory('farmers_market');
      setSelectedRegion('all');
      setSearchQuery('');
      const feedback = 'Showing Bay Area farmers markets including Ferry Plaza in San Francisco.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('san francisco') || lower.includes('sf')) {
      setSelectedRegion('san_francisco');
      setSelectedCategory('all');
      setSearchQuery('');
      const feedback = 'Filtered to happenings inside San Francisco city!';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('east bay') || lower.includes('berkeley') || lower.includes('oakland')) {
      setSelectedRegion('east_bay');
      setSelectedCategory('all');
      setSearchQuery('');
      const feedback = 'Showing East Bay happenings in Berkeley and Oakland!';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('south bay') || lower.includes('peninsula') || lower.includes('san jose') || lower.includes('pumpkin') || lower.includes('half moon')) {
      setSelectedRegion('peninsula_south_bay');
      setSelectedCategory('all');
      setSearchQuery('');
      const feedback = 'Showing Peninsula and South Bay events!';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    // Default keyword search
    setSearchQuery(cmd);
    const feedback = `Searching Bay Area happenings for "${cmd}"`;
    setAiVoiceFeedback(feedback);
    if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setAiVoiceFeedback('Listening... Ask about food festivals, concerts, or SF events...');

    SpeechService.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          handleProcessVoiceCommand(text);
        }
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Region filter
      if (selectedRegion !== 'all' && ev.region !== selectedRegion) return false;

      // Category filter
      if (selectedCategory === 'this_week') {
        if (!ev.isThisWeek) return false;
      } else if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
        return false;
      }

      // Bookmarks filter
      if (showBookmarksOnly && !ev.isBookmarked) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchLoc = ev.locationName.toLowerCase().includes(q);
        const matchDesc = ev.description.toLowerCase().includes(q);
        const matchHighlights = ev.highlights.some((h) => h.toLowerCase().includes(q));
        if (!matchTitle && !matchLoc && !matchDesc && !matchHighlights) return false;
      }

      return true;
    });
  }, [events, selectedRegion, selectedCategory, showBookmarksOnly, searchQuery]);

  const bookmarkedCount = events.filter((e) => e.isBookmarked).length;

  return (
    <div className="max-w-6xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Main Glassmorphic Container Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 text-white">
        {/* Top Header & Sub-Navigation */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>SF Bay Area Fun</span>
              </span>
              <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>🗓️ {weekInfo.thisWeekFullLabel} (Updated Weekly)</span>
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-full">
                {events.length} Curated Outings
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
              </div>
              <span>Bay Area Fun & Outings</span>
            </h2>

            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-3xl leading-relaxed">
              Explore senior-friendly vegetarian & low-sodium restaurants, food festivals, outdoor concerts, farmers markets, and accessible outings across the Bay Area — fresh and automatically updated every week!
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto self-stretch md:self-center">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span>Add Outing / Restaurant</span>
            </button>

            <button
              onClick={handleResetEvents}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Refresh / Check for New Weekly Events"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Fast Bookmarks Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vegetarian restaurants, low-sodium dining, food festivals, jazz, Half Moon Bay..."
              className="w-full text-xs sm:text-sm pl-11 pr-10 py-3 rounded-2xl border border-slate-800 focus:border-amber-500 focus:outline-none font-semibold bg-slate-950 text-white placeholder:text-slate-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer ${
              showBookmarksOnly
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-slate-950' : ''}`} />
            <span>Saved Outings ({bookmarkedCount})</span>
          </button>
        </div>

        {/* AI Voice Event Concierge Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-950/80 to-amber-950/60 border border-amber-500/30 text-white rounded-2xl p-3 sm:p-3.5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleToggleVoice}
              className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40'
              }`}
              title="Ask AI by voice"
            >
              {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                <button
                  onClick={() => SpeechService.speak(aiVoiceFeedback || 'Ask e.g. "Events this weekend" or "Low-salt dining"', profile.voiceSpeed)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
                  title="Listen"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <h4 className="font-black text-xs sm:text-sm tracking-tight truncate text-amber-300">Say it to Voice AI</h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate">
                {aiVoiceFeedback || 'Ask e.g. "Events this weekend" or "Low-salt dining"'}
              </p>
            </div>
          </div>

          {/* Quick Voice Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setSelectedCategory('this_week')}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black transition-all whitespace-nowrap shadow-sm hover:bg-amber-300 cursor-pointer"
            >
              "🌟 This Week"
            </button>
            <button
              onClick={() => handleProcessVoiceCommand('vegetarian restaurants low sodium non salty')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border border-amber-400/40 text-amber-200 cursor-pointer"
            >
              "🍽️ Low-Salt Dining"
            </button>
            <button
              onClick={() => handleProcessVoiceCommand('free outdoor music and concerts')}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              "🎵 Music"
            </button>
          </div>
        </div>

        {/* Region Selector Tabs */}
        <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-3.5 sm:p-4 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Filter by Bay Area Sub-Region:
            </span>
            <span className="text-xs font-black text-amber-400">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'Outing' : 'Outings'} Matching
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {REGION_OPTIONS.map((reg) => (
              <button
                key={reg.key}
                onClick={() => setSelectedRegion(reg.key)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRegion === reg.key
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{reg.icon}</span>
                <span>{reg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-10 sm:p-12 text-center space-y-3 shadow-inner">
            <Compass className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-black text-white">No Bay Area Outings Found</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-md mx-auto">
              Try adjusting your search keywords, sub-region filter, or tap "Refresh / Sync Events" to see all available events.
            </p>
            <button
              onClick={() => {
                setSelectedRegion('all');
                setSelectedCategory('all');
                setSearchQuery('');
                setShowBookmarksOnly(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              Show All Bay Area Outings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredEvents.map((ev) => {
              const isAdded = addedReminderId === ev.id;

              return (
                <div
                  key={ev.id}
                  className="bg-slate-950/70 rounded-3xl border border-slate-800 hover:border-amber-500/60 overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  {/* Photo Banner with Badges & Bookmark */}
                  {ev.imageUrl ? (
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                      {/* Top Overlaid Badges & Bookmark */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xl bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-700 shadow-md">
                            {ev.emoji}
                          </span>
                          {ev.isThisWeek && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-md flex items-center gap-1">
                              <span>🌟 This Week</span>
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shadow-md capitalize">
                            {ev.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleToggleBookmark(ev.id, e)}
                          className={`p-2.5 rounded-xl transition-all backdrop-blur-md shadow-md cursor-pointer ${
                            ev.isBookmarked
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                          title={ev.isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Outing'}
                        >
                          {ev.isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 fill-slate-950 text-slate-950" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Overlaid Region Tag & Quick Location on Bottom of Image */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-bold z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] border border-slate-700 text-slate-300 capitalize">
                          📍 {ev.region.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-black text-amber-300 border border-amber-500/30">
                          {ev.admission}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Fallback top header if no image */
                    <div className="p-5 pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-2xl">{ev.emoji}</span>
                          {ev.isThisWeek && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🌟 Active This Week
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 capitalize">
                            {ev.category.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 capitalize">
                            {ev.region.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleToggleBookmark(ev.id, e)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            ev.isBookmarked
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                          }`}
                          title={ev.isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Event'}
                        >
                          {ev.isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {ev.title}
                      </h3>

                      {/* Date, Time & Location */}
                      <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-300 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 text-amber-300 font-bold">
                          <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>{ev.dateRange}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{ev.time}</span>
                        </div>

                        <div className="flex items-start gap-2 text-slate-200">
                          <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{ev.locationName}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                        {ev.description}
                      </p>

                      {/* Highlights Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ev.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>

                      {/* Senior Accessibility & Weather Notes */}
                      <div className="space-y-1.5 pt-2">
                        {ev.seniorFriendlyNotes && (
                          <div className="flex items-start gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Senior Access:</strong> {ev.seniorFriendlyNotes}</span>
                          </div>
                        )}

                        {ev.weatherTip && (
                          <div className="flex items-start gap-1.5 text-[11px] sm:text-xs font-medium text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                            <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Weather Tip:</strong> {ev.weatherTip}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admission & Action Buttons */}
                    <div className="pt-3.5 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Ticket className="w-4 h-4 text-amber-400" />
                          <span>{ev.admission}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleAddToReminders(ev, e)}
                          className={`flex-1 py-2.5 px-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          }`}
                          title="Add this event to your Reminders list"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4 text-slate-950" />
                              <span>Added to Reminders!</span>
                            </>
                          ) : (
                            <>
                              <BellPlus className="w-4 h-4 text-slate-950" />
                              <span>Add to Reminders</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => handleReadAloud(ev, e)}
                          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex-shrink-0 cursor-pointer"
                          title="Read event aloud with AI speech"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Custom Bay Area Event Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Compass className="w-6 h-6 text-amber-400" />
                  <span>Add Bay Area Outing / Event</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Event Title / Restaurant Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco Italian Heritage Pizza Festival"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-300 mb-1">
                      Bay Area Region
                    </label>
                    <select
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value as BayAreaRegion)}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 cursor-pointer"
                    >
                      <option value="san_francisco">San Francisco 🌁</option>
                      <option value="east_bay">East Bay (Oakland/Berkeley) ⛵</option>
                      <option value="peninsula_south_bay">Peninsula & South Bay 🌲</option>
                      <option value="north_bay_marin">North Bay / Marin ⚓</option>
                      <option value="napa_sonoma">Napa & Sonoma 🍇</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as BayAreaCategory)}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 cursor-pointer"
                    >
                      <option value="restaurant">Healthy Restaurant 🍽️</option>
                      <option value="food_festival">Food & Wine Festival 🌮</option>
                      <option value="music_concert">Music & Concert 🎵</option>
                      <option value="farmers_market">Farmers Market 🥑</option>
                      <option value="art_culture">Art & Culture 🎨</option>
                      <option value="nature_walk">Nature & Garden Walk 🌸</option>
                      <option value="fair_festival">Fair & Celebration 🎃</option>
                      <option value="community">Community Gathering 🤝</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Event Emoji Icon
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['🍽️', '🌿', '🥑', '🥗', '🍱', '🌱', '🥟', '🍣', '🥣', '🥪', '🌻', '🍵', '🌮', '🍷', '🍫', '🎵', '🎷', '🎨', '🌸', '🎃', '⛵'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewEmoji(em)}
                        className={`p-1.5 sm:p-2 rounded-xl text-lg border transition-all cursor-pointer ${
                          newEmoji === em
                            ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/40 scale-110'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Location & Neighborhood
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Washington Square Park, North Beach, SF"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-300 mb-1">
                      Date / Frequency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Saturday, Oct 18"
                      value={newDateRange}
                      onChange={(e) => setNewDateRange(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM – 4:00 PM"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Admission / Tickets
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free Entry, $10 Senior Ticket"
                    value={newAdmission}
                    onChange={(e) => setNewAdmission(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Description & What to Enjoy
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Enjoy fresh outdoor artisan foods, live acoustic music, and scenic views."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 resize-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    Senior Accessibility Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paved flat pathways, plenty of shaded benches, wheelchair accessible."
                    value={newSeniorNotes}
                    onChange={(e) => setNewSeniorNotes(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Photo / Image URL</span>
                    </span>
                    <span className="text-slate-500 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-700 font-semibold bg-slate-950 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomEvent}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Save Outing</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
