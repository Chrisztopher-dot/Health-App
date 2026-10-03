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
  Image as ImageIcon
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
      const feedback = `Found ${count} senior-friendly Bay Area restaurants serving vegetarian and low-sodium / non-salty cuisine, including Greens, Wildseed, Cha-Ya, Millennium, and Shangri-La!`;
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('food') || lower.includes('eat') || lower.includes('wine') || lower.includes('chocolate') || lower.includes('pizza') || lower.includes('culinary') || lower.includes('festival')) {
      setSelectedCategory('food_festival');
      setSelectedRegion('all');
      setSearchQuery('');
      const count = events.filter((e) => e.category === 'food_festival').length;
      const feedback = `Found ${count} Bay Area food and culinary festivals, including Ghirardelli Chocolate and Berkeley Gourmet Ghetto.`;
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('music') || lower.includes('concert') || lower.includes('jazz') || lower.includes('stern grove')) {
      setSelectedCategory('music_concert');
      setSelectedRegion('all');
      setSearchQuery('');
      const feedback = 'Showing Bay Area music events, including Stern Grove concerts and San Jose Plaza Jazz!';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('farmers market') || lower.includes('produce') || lower.includes('organic') || lower.includes('ferry building')) {
      setSelectedCategory('farmers_market');
      setSelectedRegion('all');
      setSearchQuery('');
      const feedback = 'Showing Bay Area farmers markets including the world-famous Ferry Plaza market in San Francisco.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('san francisco') || lower.includes('sf')) {
      setSelectedRegion('san_francisco');
      setSelectedCategory('all');
      setSearchQuery('');
      const feedback = 'Filtered to happenings inside San Francisco city, including Ferry Plaza, Japanese Tea Garden, and Ghirardelli Square.';
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
      const feedback = 'Showing Peninsula and South Bay events including Half Moon Bay Pumpkin Fair and Filoli Gardens!';
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
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>SF Bay Area Fun</span>
              </span>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>🗓️ {weekInfo.thisWeekFullLabel} (Updated Weekly)</span>
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {events.length} Curated Outings
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2 sm:gap-3">
              <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 flex-shrink-0" />
              <span>Bay Area Fun & Outings</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
              Explore senior-friendly vegetarian & low-sodium restaurants, food festivals, outdoor concerts, farmers markets, and accessible outings across the Bay Area — fresh and automatically updated every week!
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Outing / Restaurant</span>
            </button>

            <button
              onClick={handleResetEvents}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Refresh / Check for New Weekly Events"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Fast Bookmarks Toggle */}
        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vegetarian restaurants, low-sodium dining, food festivals, jazz, Half Moon Bay..."
              className="w-full text-sm sm:text-base pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-amber-600 focus:outline-none font-semibold bg-slate-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm border-2 transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
              showBookmarksOnly
                ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-white' : ''}`} />
            <span>Saved Outings ({bookmarkedCount})</span>
          </button>
        </div>
      </div>

      {/* AI Voice Event Concierge Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-yellow-950 to-orange-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Ask AI by voice"
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(aiVoiceFeedback || 'Ask e.g. "Events this weekend" or "Low-salt dining"', profile.voiceSpeed)}
                className="p-1 rounded-lg hover:bg-white/20 text-amber-200 hover:text-white transition-colors"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">Say it in AI</h4>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100 font-medium truncate">
              {aiVoiceFeedback || 'Ask e.g. "Events this weekend" or "Low-salt dining"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('this_week')}
            className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black transition-all whitespace-nowrap shadow-sm hover:bg-amber-300"
          >
            "🌟 This Week"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('vegetarian restaurants low sodium non salty')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap border border-amber-300/40 text-amber-100"
          >
            "🍽️ Low-Salt Dining"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('free outdoor music and concerts')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap"
          >
            "🎵 Music"
          </button>
        </div>
      </div>

      {/* Region Selector Tabs */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-3 sm:p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Filter by Bay Area Sub-Region:
          </span>
          <span className="text-xs font-bold text-amber-800">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'Outing' : 'Outings'} Matching
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {REGION_OPTIONS.map((reg) => (
            <button
              key={reg.key}
              onClick={() => setSelectedRegion(reg.key)}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                selectedRegion === reg.key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
              selectedCategory === cat.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center space-y-3 shadow-sm">
          <Compass className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-900">No Bay Area Fun Outings Found</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, region filter, or tap "Check for New Weekly Events" to see all available events.
          </p>
          <button
            onClick={() => {
              setSelectedRegion('all');
              setSelectedCategory('all');
              setSearchQuery('');
              setShowBookmarksOnly(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-sm"
          >
            Show All Bay Area Fun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredEvents.map((ev) => {
            const isAdded = addedReminderId === ev.id;

            return (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Photo Banner with Badges & Bookmark */}
                {ev.imageUrl ? (
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                    <img
                      src={ev.imageUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Overlaid Badges & Bookmark */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xl bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">
                          {ev.emoji}
                        </span>
                        {ev.isThisWeek && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                            <span>🌟 This Week</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-sm capitalize">
                          {ev.category.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleToggleBookmark(ev.id, e)}
                        className={`p-2 rounded-xl transition-all backdrop-blur-md shadow-sm ${
                          ev.isBookmarked
                            ? 'bg-amber-500 text-white'
                            : 'bg-white/90 hover:bg-white text-slate-700'
                        }`}
                        title={ev.isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Outing'}
                      >
                        {ev.isBookmarked ? (
                          <BookmarkCheck className="w-5 h-5 fill-white text-white" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Overlaid Region Tag & Quick Location on Bottom of Image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-bold z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] capitalize">
                        📍 {ev.region.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-amber-300">
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            🌟 Active This Week
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 capitalize">
                          {ev.category.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                          {ev.region.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleToggleBookmark(ev.id, e)}
                        className={`p-2 rounded-xl transition-colors ${
                          ev.isBookmarked
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                        }`}
                        title={ev.isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Event'}
                      >
                        {ev.isBookmarked ? (
                          <BookmarkCheck className="w-5 h-5 fill-amber-600 text-amber-700" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Content Body */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                      {ev.title}
                    </h3>

                    {/* Date, Time & Location */}
                    <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 text-amber-950 font-bold">
                        <Calendar className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>{ev.dateRange}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{ev.time}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-800">
                        <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{ev.locationName}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Highlights Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ev.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>

                    {/* Senior Accessibility & Weather Notes */}
                    <div className="space-y-1.5 pt-2">
                      {ev.seniorFriendlyNotes && (
                        <div className="flex items-start gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Senior Access:</strong> {ev.seniorFriendlyNotes}</span>
                        </div>
                      )}

                      {ev.weatherTip && (
                        <div className="flex items-start gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span><strong>Weather Tip:</strong> {ev.weatherTip}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admission & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                      <div className="flex items-center gap-1.5 text-amber-900">
                        <Ticket className="w-4 h-4 text-amber-600" />
                        <span>{ev.admission}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleAddToReminders(ev, e)}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200'
                        }`}
                        title="Add this event to your Reminders list"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added to Reminders!</span>
                          </>
                        ) : (
                          <>
                            <BellPlus className="w-4 h-4" />
                            <span>Add to Reminders</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleReadAloud(ev, e)}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex-shrink-0"
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-6 h-6 text-amber-600" />
                Add Bay Area Outing / Event
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Event Title / Festival Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco Italian Heritage Pizza Festival"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Bay Area Region
                  </label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value as BayAreaRegion)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                  >
                    <option value="san_francisco">San Francisco 🌁</option>
                    <option value="east_bay">East Bay (Oakland/Berkeley) ⛵</option>
                    <option value="peninsula_south_bay">Peninsula & South Bay 🌲</option>
                    <option value="north_bay_marin">North Bay / Marin ⚓</option>
                    <option value="napa_sonoma">Napa & Sonoma 🍇</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BayAreaCategory)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                  >
                    <option value="restaurant">Healthy Restaurant (Veg & Low Salt) 🍽️</option>
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
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Event Emoji Icon
                </label>
                <div className="flex items-center gap-2">
                  {['🍽️', '🌿', '🥑', '🥗', '🍱', '🌱', '🥟', '🍣', '🥣', '🥪', '🌻', '🍵', '🌮', '🍷', '🍫', '🎵', '🎷', '🎨', '🌸', '🎃', '⛵'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewEmoji(em)}
                      className={`p-1.5 sm:p-2 rounded-xl text-lg border transition-all ${
                        newEmoji === em
                          ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-300 scale-110'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Location & Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Washington Square Park, North Beach, SF"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Date / Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, Oct 18"
                    value={newDateRange}
                    onChange={(e) => setNewDateRange(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM – 4:00 PM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Admission / Tickets
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free Entry, $10 Senior Ticket"
                  value={newAdmission}
                  onChange={(e) => setNewAdmission(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Description & What to Enjoy
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enjoy fresh outdoor artisan foods, live acoustic music, and scenic views."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Senior Accessibility Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paved flat pathways, plenty of shaded benches, wheelchair accessible."
                  value={newSeniorNotes}
                  onChange={(e) => setNewSeniorNotes(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Photo / Image URL</span>
                  </span>
                  <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomEvent}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Save Happening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
