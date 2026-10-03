import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, RecipeItem, RecipeMealType, DietaryTag, ReminderItem } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { RecipeGeneratorService, WeeklySyncResult } from '../../services/recipeGeneratorService';
import { 
  Utensils, 
  Clock, 
  Plus, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  ShoppingCart, 
  Search, 
  Check, 
  RefreshCw, 
  Heart, 
  Leaf, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  ChefHat, 
  Star, 
  ArrowRight,
  Calendar
} from 'lucide-react';

interface HealthyRecipesProps {
  profile: UserProfile;
  onNavigateToScanner?: () => void;
}

const MEAL_TYPE_OPTIONS: { key: 'all' | RecipeMealType; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Meals', emoji: '🍽️' },
  { key: 'breakfast', label: 'Breakfast', emoji: '🥣' },
  { key: 'lunch', label: 'Lunch & Bowls', emoji: '🥗' },
  { key: 'dinner', label: 'Hearty Dinners', emoji: '🍝' },
  { key: 'soup', label: 'Soups & Stews', emoji: '🍲' },
  { key: 'smoothie', label: 'Smoothies', emoji: '🥤' },
];

const DIETARY_FILTERS: { key: 'all' | DietaryTag; label: string }[] = [
  { key: 'all', label: 'All Healthy Diets' },
  { key: 'low_sodium', label: '🧂 Ultra Low-Sodium (<100mg)' },
  { key: 'vegetarian', label: '🌱 100% Vegetarian' },
  { key: 'high_potassium', label: '🥑 High Potassium (BP Support)' },
  { key: 'heart_healthy', label: '❤️ Heart-Healthy' },
];

const COMMON_PANTRY_INGREDIENTS = [
  'Tomatoes', 'Spinach', 'Lentils', 'Chickpeas', 'Avocado',
  'Mushrooms', 'Garlic', 'Sweet Potato', 'Zucchini', 'Black Beans',
  'Brown Rice', 'Oats', 'Broccoli', 'Bell Peppers', 'Lemon'
];

export const HealthyRecipes: React.FC<HealthyRecipesProps> = ({ profile, onNavigateToScanner }) => {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'all' | RecipeMealType>('all');
  const [selectedDietTag, setSelectedDietTag] = useState<'all' | DietaryTag>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [addedGroceryId, setAddedGroceryId] = useState<string | null>(null);
  
  // Interactive Checklist & Cooking Steps State per recipe
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPantryModalOpen, setIsPantryModalOpen] = useState<boolean>(false);
  const [isFlavorGuideOpen, setIsFlavorGuideOpen] = useState<boolean>(false);

  // Weekly 7-Day Automatic Rotation State (Mon - Sun)
  const [weeklySyncData, setWeeklySyncData] = useState<WeeklySyncResult | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [freshNotification, setFreshNotification] = useState<string | null>(null);
  const [pantryIngredients, setPantryIngredients] = useState<string>('');

  // AI Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // Add Custom Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newMealType, setNewMealType] = useState<RecipeMealType>('dinner');
  const [newPrepTime, setNewPrepTime] = useState<number>(15);
  const [newCookTime, setNewCookTime] = useState<number>(20);
  const [newServings, setNewServings] = useState<number>(4);
  const [newSodium, setNewSodium] = useState<number>(75);
  const [newCalories, setNewCalories] = useState<number>(250);
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIngredients, setNewIngredients] = useState<string>('');
  const [newInstructions, setNewInstructions] = useState<string>('');
  const [newSeasoningTip, setNewSeasoningTip] = useState<string>('Use fresh lemon juice, rosemary, and garlic powder instead of salt.');
  const [newSwapTip, setNewSwapTip] = useState<string>('Use lentils or hearty beans to replace ground meat.');
  const [newHealthBenefit, setNewHealthBenefit] = useState<string>('Rich in potassium and plant fiber to support healthy blood pressure.');
  const [newEmoji, setNewEmoji] = useState<string>('🥗');

  useEffect(() => {
    // Automatically check and sync weekly recipes on 7-day Monday–Sunday cycle
    const sync = RecipeGeneratorService.syncWeeklyRecipes();
    setWeeklySyncData(sync);
    setRecipes([...sync.recipes]);

    if (sync.isNewWeek) {
      setFreshNotification(
        `🗓️ Welcome to your fresh 7-Day Menu (${sync.weekInfo.weekRangeLabel}): "${sync.currentTheme.title}"!`
      );
    }
  }, []);

  const loadRecipes = () => {
    const list = HealthStorageService.getAllRecipes();
    setRecipes([...list]);
  };

  const handleAdvanceWeeklyMenu = () => {
    const sync = RecipeGeneratorService.advanceToNextWeeklyMenu();
    setWeeklySyncData(sync);
    setRecipes([...sync.recipes]);
    const msg = `🗓️ Switched to 7-Day Menu (${sync.weekInfo.weekRangeLabel}): "${sync.currentTheme.title}"!`;
    setFreshNotification(msg);
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(`Loaded 7-day menu: ${sync.currentTheme.title}`, profile.voiceSpeed);
    }
  };

  // Today's rotating chef feature (changes daily)
  const dailySpecial = useMemo(() => {
    return RecipeGeneratorService.getDailyFeaturedRecipe(recipes);
  }, [recipes]);

  // Request fresh AI recipe suggestions on demand
  const handleFetchFreshSuggestions = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const result = RecipeGeneratorService.fetchFreshRecipeSuggestions();
      loadRecipes();
      setExpandedRecipeId(result.addedRecipe.id);
      setIsGeneratingAI(false);

      const msg = `✨ Added new chef creation: "${result.addedRecipe.title}" (${result.addedRecipe.sodiumMgPerServing}mg sodium)`;
      setFreshNotification(msg);
      setAiVoiceFeedback(msg);
      if (profile.soundEnabled) {
        SpeechService.speak(`Added a new healthy recipe suggestion: ${result.addedRecipe.title}`, profile.voiceSpeed);
      }
    }, 600);
  };

  // Generate recipe from user's custom fridge ingredients
  const handleGenerateFromPantry = () => {
    if (!pantryIngredients.trim()) return;

    setIsGeneratingAI(true);
    setTimeout(() => {
      const items = pantryIngredients.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const customRecipe = RecipeGeneratorService.generateProceduralRecipe('dinner', items);
      
      if (items.length > 0) {
        const primaryIng = items[0].charAt(0).toUpperCase() + items[0].slice(1);
        customRecipe.title = `Chef's Fresh ${primaryIng} & Garden Herb Medley`;
        customRecipe.ingredients = [
          ...items.map((it) => `Fresh ${it}`),
          '2 tbsp extra virgin olive oil',
          '4 cloves garlic, minced',
          '1 tbsp fresh lemon juice',
          'Fresh cracked black pepper and herbs',
        ];
      }

      HealthStorageService.addRecipe(customRecipe);
      loadRecipes();
      setExpandedRecipeId(customRecipe.id);
      setIsPantryModalOpen(false);
      setPantryIngredients('');
      setIsGeneratingAI(false);

      const msg = `✨ Created custom recipe: "${customRecipe.title}" based on your ingredients!`;
      setFreshNotification(msg);
      setAiVoiceFeedback(msg);
      if (profile.soundEnabled) {
        SpeechService.speak(`Created a new recipe for you: ${customRecipe.title}`, profile.voiceSpeed);
      }
    }, 700);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HealthStorageService.toggleBookmarkRecipe(id);
    loadRecipes();
  };

  const handleAddIngredientsToReminders = (recipe: RecipeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];

    const ingredientSummary = recipe.ingredients.slice(0, 6).join(', ') + (recipe.ingredients.length > 6 ? '...' : '');

    const newReminder: ReminderItem = {
      id: `rem-grocery-${Date.now()}`,
      title: `Buy ingredients for ${recipe.title}`,
      priority: 'less_urgent',
      dueDate: todayStr,
      dueTime: 'Morning',
      notes: `Grocery List: ${ingredientSummary}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newReminder);
    setAddedGroceryId(recipe.id);
    setTimeout(() => setAddedGroceryId(null), 3500);

    const msg = `Added ingredients for "${recipe.title}" to your Reminders grocery list!`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleReadRecipeAloud = (recipe: RecipeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const speechText = `${recipe.title}. Prep time ${recipe.prepTimeMinutes} minutes, cook time ${recipe.cookTimeMinutes} minutes. Sodium content: ${recipe.sodiumMgPerServing} milligrams per serving. Seasoning tip: ${recipe.saltFreeSeasoningTips}. Main ingredients include ${recipe.ingredients.slice(0, 4).join(', ')}.`;
    setAiVoiceFeedback(`Reading recipe for ${recipe.title}`);
    SpeechService.speak(speechText, profile.voiceSpeed);
  };

  const handleResetRecipes = () => {
    const refreshed = HealthStorageService.resetRecipes();
    setRecipes(refreshed);
    const msg = 'Healthy recipes library refreshed with latest suggestions!';
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleToggleIngredientCheck = (key: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleStepCheck = (key: string) => {
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveCustomRecipe = () => {
    if (!newTitle.trim()) return;

    const parsedIngredients = newIngredients
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const parsedInstructions = newInstructions
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const newRec: RecipeItem = {
      id: `rec-custom-${Date.now()}`,
      title: newTitle.trim(),
      mealType: newMealType,
      dietaryTags: ['low_sodium', 'vegetarian', 'heart_healthy'],
      prepTimeMinutes: newPrepTime,
      cookTimeMinutes: newCookTime,
      servings: newServings,
      sodiumMgPerServing: newSodium,
      caloriesPerServing: newCalories,
      description: newDescription.trim() || 'Delicious homemade low-sodium vegetarian recipe.',
      ingredients: parsedIngredients.length > 0 ? parsedIngredients : ['Fresh vegetables', 'Olive oil', 'Herbs and garlic'],
      instructions: parsedInstructions.length > 0 ? parsedInstructions : ['Chop ingredients.', 'Sauté with herbs.', 'Serve warm.'],
      saltFreeSeasoningTips: newSeasoningTip.trim(),
      vegetarianSwapTip: newSwapTip.trim() || undefined,
      healthBenefit: newHealthBenefit.trim(),
      emoji: newEmoji,
      isBookmarked: true,
    };

    HealthStorageService.addRecipe(newRec);
    loadRecipes();
    setExpandedRecipeId(newRec.id);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewIngredients('');
    setNewInstructions('');
    setIsAddModalOpen(false);

    const msg = `Added custom healthy recipe: ${newRec.title}`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  // AI Voice Assistant Parser for Recipes
  const handleProcessVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();

    if (lower.includes('soup') || lower.includes('stew') || lower.includes('butternut')) {
      setSelectedMealType('soup');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing comforting low-sodium soups and stews.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('breakfast') || lower.includes('oatmeal') || lower.includes('morning')) {
      setSelectedMealType('breakfast');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing heart-healthy breakfasts and oats.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('dinner') || lower.includes('lentil') || lower.includes('pasta') || lower.includes('curry')) {
      setSelectedMealType('dinner');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing low-sodium vegetarian dinner ideas.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('potassium') || lower.includes('blood pressure') || lower.includes('smoothie')) {
      setSelectedDietTag('high_potassium');
      setSearchQuery('');
      const feedback = 'Showing potassium-rich meals and smoothies that support healthy blood pressure.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    // Default search
    setSearchQuery(cmd);
    const feedback = `Searching healthy recipes for "${cmd}"`;
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
    setAiVoiceFeedback('Listening... Ask about low-sodium dinners, soups, or vegetarian meals...');

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

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((rec) => {
      // Meal Type
      if (selectedMealType !== 'all' && rec.mealType !== selectedMealType) return false;

      // Dietary Tag
      if (selectedDietTag !== 'all' && !rec.dietaryTags.includes(selectedDietTag)) return false;

      // Bookmarks Only
      if (showBookmarksOnly && !rec.isBookmarked) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchDesc = rec.description.toLowerCase().includes(q);
        const matchIngredients = rec.ingredients.some((i) => i.toLowerCase().includes(q));
        const matchBenefit = rec.healthBenefit.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchIngredients && !matchBenefit) return false;
      }

      return true;
    });
  }, [recipes, selectedMealType, selectedDietTag, showBookmarksOnly, searchQuery]);

  const bookmarkedCount = recipes.filter((r) => r.isBookmarked).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn text-slate-100">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Utensils className="w-3.5 h-3.5" />
                Heart-Healthy & Senior Culinary Care
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                {recipes.length} Prescriptions-Safe Dishes
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Healthy Meals & Low-Sodium Recipes</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Cardiovascular-safe, potassium-rich meals with step-by-step cooking checklists and salt-free seasoning secrets.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleFetchFreshSuggestions}
              disabled={isGeneratingAI}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              title="Add fresh chef recipe suggestions"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'Generating...' : '✨ Fresh AI Ideas'}</span>
            </button>

            <button
              onClick={() => setIsPantryModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
              title="Cook with ingredients on hand"
            >
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <span>Pantry Chef</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Recipe</span>
            </button>

            <button
              onClick={() => setIsFlavorGuideOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
              title="Salt-Free Flavor Master Guide"
            >
              <Leaf className="w-5 h-5" />
            </button>

            <button
              onClick={handleResetRecipes}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh / Reload default recipes"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fresh Recipe Rotation Banner */}
        {freshNotification && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{freshNotification}</span>
            </div>
            <button
              onClick={() => setFreshNotification(null)}
              className="text-emerald-400 hover:text-white font-black text-xs px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar & Saved Toggle */}
        <div className="pt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes or ingredients (spinach, lentils, avocado, mushrooms, turmeric)..."
              className="w-full text-sm sm:text-base pl-11 pr-10 py-3 rounded-2xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-medium"
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
            className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
              showBookmarksOnly
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-white' : ''}`} />
            <span>Saved Recipes ({bookmarkedCount})</span>
          </button>
        </div>

        {/* AI Food Scanner Shortcut Banner */}
        {onNavigateToScanner && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-white">
                  Eating Out or At Friends? Try the AI Food Camera Scanner
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  Snap a photo of your plate to instantly analyze ingredients, calories, carbs, and estimated sodium!
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToScanner}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Food Scanner</span>
            </button>
          </div>
        )}
      </div>

      {/* 🗓️ 7-Day Rotating Menu Showcase (Mon - Sun) */}
      {weeklySyncData && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-teal-950/90 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic 7-Day Menu (Mon – Sun)</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
                  {weeklySyncData.weekInfo.thisWeekFullLabel}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  🔄 Updates every Monday ({weeklySyncData.weekInfo.daysRemainingInWeek}d left)
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 pt-1">
                <span className="text-2xl sm:text-3xl">{weeklySyncData.currentTheme.bannerEmoji}</span>
                <span>{weeklySyncData.currentTheme.title}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {weeklySyncData.currentTheme.description}
              </p>
            </div>

            {/* Manual Preview / Shuffle to Next Week Button */}
            <div className="flex flex-col items-start lg:items-end gap-1.5 flex-shrink-0">
              <button
                onClick={handleAdvanceWeeklyMenu}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                title={`Shuffle early to next week: ${weeklySyncData.nextTheme.title}`}
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Shuffle / Next 7-Day Menu Preview</span>
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                Next Week: {weeklySyncData.nextTheme.bannerEmoji} {weeklySyncData.nextTheme.title}
              </span>
            </div>
          </div>

          {/* Nutrition Highlight of the Week */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-200/90 bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Weekly Focus: <strong className="text-white">{weeklySyncData.currentTheme.highlightNutrient}</strong></span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              All dishes &lt; 100mg sodium • 100% Doctor & Medication-Safe
            </span>
          </div>
        </div>
      )}

      {/* AI Voice Assistant Quick Bar */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleToggleVoice}
            className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-950/50'
                : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
            }`}
            title="Ask AI by voice"
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-emerald-300" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <button
                onClick={() => SpeechService.speak(aiVoiceFeedback || 'Ask "Low-sodium dinner" or "Warm vegetable soup"', profile.voiceSpeed)}
                className="p-0.5 rounded hover:bg-slate-800 text-emerald-300"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <h4 className="font-black text-xs sm:text-sm text-white tracking-tight truncate">Voice Recipe Assistant</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">
              {aiVoiceFeedback || 'Ask: "Show low-sodium dinners", "Hearty lentil soup", or "Potassium smoothies"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleProcessVoiceCommand('low sodium dinner recipes')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "🍝 Low-Sodium"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('warm vegetable soups and stews')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "🍲 Soups"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('potassium blood pressure smoothies')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            "🥤 Smoothies"
          </button>
        </div>
      </div>

      {/* 🌟 Today's Rotating Daily Chef Special Spotlight */}
      {dailySpecial && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-500/40 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Today's Daily Chef Feature</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">
                • Rotates daily for fresh inspiration
              </span>
            </div>

            <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
              🧂 Only {dailySpecial.sodiumMgPerServing}mg Sodium • Zero Added Salt
            </span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
              {dailySpecial.imageUrl ? (
                <div className="relative w-full sm:w-48 h-36 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-slate-700 group">
                  <img
                    src={dailySpecial.imageUrl}
                    alt={dailySpecial.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/90 text-white backdrop-blur-md border border-slate-800">
                    {dailySpecial.emoji} Chef Special
                  </span>
                </div>
              ) : (
                <span className="text-4xl sm:text-5xl p-4 rounded-2xl bg-slate-800 border border-slate-700 flex-shrink-0">
                  {dailySpecial.emoji}
                </span>
              )}

              <div className="space-y-1.5 min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {dailySpecial.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 max-w-2xl">
                  {dailySpecial.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Prep: {dailySpecial.prepTimeMinutes}m • Cook: {dailySpecial.cookTimeMinutes}m
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 truncate max-w-md">
                    💡 {dailySpecial.saltFreeSeasoningTips.split('.')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center flex-shrink-0">
              <button
                onClick={() => setExpandedRecipeId(expandedRecipeId === dailySpecial.id ? null : dailySpecial.id)}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{expandedRecipeId === dailySpecial.id ? 'Hide Special' : 'View Full Recipe'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Category Rows */}
      <div className="space-y-3">
        {/* Meal Type Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {MEAL_TYPE_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMealType(m.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                selectedMealType === m.key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Dietary Tag Row */}
        <div className="flex flex-wrap items-center gap-2">
          {DIETARY_FILTERS.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDietTag(d.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDietTag === d.key
                  ? 'bg-slate-100 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards List */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-10 text-center space-y-3 shadow-xl">
          <Utensils className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-xl font-black text-white">No Recipes Found</h3>
          <p className="text-sm font-medium text-slate-400 max-w-md mx-auto">
            Try clearing search terms or dietary filters to view all available healthy recipes.
          </p>
          <button
            onClick={() => {
              setSelectedMealType('all');
              setSelectedDietTag('all');
              setSearchQuery('');
              setShowBookmarksOnly(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
          >
            Show All Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const isGroceryAdded = addedGroceryId === recipe.id;

            return (
              <div
                key={recipe.id}
                className={`bg-slate-900/90 rounded-3xl border transition-all p-5 sm:p-7 shadow-xl backdrop-blur-md space-y-4 ${
                  isExpanded ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {recipe.imageUrl ? (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-slate-700 group">
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-950/90 text-white backdrop-blur-xs border border-slate-800">
                          {recipe.emoji}
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl sm:text-4xl p-3 rounded-2xl bg-slate-800 border border-slate-700 flex-shrink-0">
                        {recipe.emoji}
                      </span>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                          {recipe.mealType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          🟢 {recipe.sodiumMgPerServing} mg Sodium
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {recipe.caloriesPerServing} kcal • {recipe.servings} Servings
                        </span>
                        {recipe.weekMenuTheme && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                            🗓️ 7-Day Menu Special
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  {/* Actions: Bookmark & Expand */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={(e) => handleToggleBookmark(recipe.id, e)}
                      className={`p-2.5 rounded-2xl border transition-colors ${
                        recipe.isBookmarked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700'
                      }`}
                      title={recipe.isBookmarked ? 'Saved in bookmarks' : 'Bookmark recipe'}
                    >
                      {recipe.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                        isExpanded
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Recipe' : 'View Full Recipe'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Description & High-Level Highlights */}
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {recipe.description}
                </p>

                {/* Meta Strip */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800 text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Prep: {recipe.prepTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800 text-slate-200">
                    <Flame className="w-3.5 h-3.5 text-rose-400" /> Cook: {recipe.cookTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1 bg-emerald-950/30 px-3 py-1 rounded-xl border border-emerald-500/30 text-emerald-300">
                    <Heart className="w-3.5 h-3.5 text-emerald-400" /> {recipe.healthBenefit.split('.')[0]}
                  </span>
                </div>

                {/* EXPANDABLE FULL RECIPE DETAILS */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800 space-y-6 animate-scaleUp">
                    
                    {/* Action Toolbar: Add Grocery, Read Aloud */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleAddIngredientsToReminders(recipe, e)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{isGroceryAdded ? 'Added to Grocery List ✓' : 'Add to Reminders Grocery List'}</span>
                        </button>

                        <button
                          onClick={(e) => handleReadRecipeAloud(recipe, e)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-1.5"
                          title="Read aloud step-by-step instructions"
                        >
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <span>Read Aloud</span>
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-400">
                        🧂 {recipe.sodiumMgPerServing} mg Sodium / serving
                      </div>
                    </div>

                    {/* 2-Column: Ingredients Checklist & Step-by-Step Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left: Ingredients Checklist (5 cols) */}
                      <div className="md:col-span-5 bg-slate-950/60 p-5 rounded-3xl border border-slate-800 space-y-3">
                        <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          <span>Ingredients Checklist ({recipe.servings} servings)</span>
                        </h4>

                        <ul className="space-y-2">
                          {recipe.ingredients.map((ing, idx) => {
                            const key = `${recipe.id}-ing-${idx}`;
                            const isChecked = !!checkedIngredients[key];

                            return (
                              <li
                                key={idx}
                                onClick={() => handleToggleIngredientCheck(key)}
                                className={`flex items-start gap-2.5 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                  isChecked ? 'bg-emerald-950/20 text-slate-500 line-through' : 'hover:bg-slate-850 text-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-500 text-white'
                                      : 'border-slate-600 bg-slate-800 text-transparent'
                                  }`}
                                >
                                  ✓
                                </button>
                                <span>{ing}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Right: Step-by-Step Instructions (7 cols) */}
                      <div className="md:col-span-7 bg-slate-950/60 p-5 rounded-3xl border border-slate-800 space-y-3">
                        <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-emerald-400" />
                          <span>Preparation & Cooking Steps</span>
                        </h4>

                        <ol className="space-y-3">
                          {recipe.instructions.map((step, idx) => {
                            const key = `${recipe.id}-step-${idx}`;
                            const isDone = !!checkedSteps[key];

                            return (
                              <li
                                key={idx}
                                onClick={() => handleToggleStepCheck(key)}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                  isDone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'
                                }`}>
                                  {isDone ? '✓' : idx + 1}
                                </span>
                                <span className="text-xs sm:text-sm font-medium leading-relaxed">
                                  {step}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </div>

                    {/* Salt-Free Seasoning & Health Advisory Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-1">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                          🧂 Salt-Free Seasoning Secret
                        </span>
                        <p className="text-xs text-amber-100 font-medium leading-relaxed">
                          {recipe.saltFreeSeasoningTips}
                        </p>
                      </div>

                      {recipe.vegetarianSwapTip && (
                        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
                          <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                            🌱 Plant Protein & Texture
                          </span>
                          <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                            {recipe.vegetarianSwapTip}
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl space-y-1">
                        <span className="text-xs font-black text-blue-300 uppercase tracking-wider block">
                          ❤️ Cardiovascular Benefit
                        </span>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed">
                          {recipe.healthBenefit}
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Pantry Fridge Chef Modal */}
      {isPantryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-emerald-400" />
                <span>Pantry Fridge Chef</span>
              </h3>
              <button
                onClick={() => setIsPantryModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Tell the AI what ingredients you have in your kitchen or fridge, and it will craft a custom, low-sodium healthy recipe for you!
            </p>

            {/* Quick Ingredient Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Quick Add Common Ingredients:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {COMMON_PANTRY_INGREDIENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const current = pantryIngredients ? pantryIngredients.split(',').map(s => s.trim()) : [];
                      if (!current.includes(item)) {
                        setPantryIngredients(current.concat(item).join(', '));
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                Ingredients on Hand (Comma separated):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Tomatoes, Spinach, Garlic, Chickpeas, Olive Oil, Brown Rice"
                value={pantryIngredients}
                onChange={(e) => setPantryIngredients(e.target.value)}
                className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPantryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateFromPantry}
                disabled={!pantryIngredients.trim() || isGeneratingAI}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{isGeneratingAI ? 'Cooking Recipe...' : 'Generate Recipe'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salt-Free Flavor Guide Modal */}
      {isFlavorGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Leaf className="w-6 h-6 text-emerald-400" />
                <span>Doctor & Chef Salt-Free Flavor Enhancers</span>
              </h3>
              <button
                onClick={() => setIsFlavorGuideOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              You do not have to sacrifice flavor to lower your blood pressure. Use these natural culinary umami tricks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="block text-amber-400 font-black text-sm">🍋 Citrus & Fresh Acids</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Fresh lemon, lime juice, apple cider vinegar, and aged balsamic vinegar activate the tongue's sour receptors in the same way salt triggers savory cues.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="block text-emerald-400 font-black text-sm">🧄 Roasted Alliums</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Slow-roasting garlic, shallots, and sweet yellow onions produces natural glutamates and deep caramelization that provide intense richness.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="block text-teal-400 font-black text-sm">🌿 Fresh Garden Herbs</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Fresh rosemary, basil, thyme, dill, and mint add aromatic essential oils that create depth in broths and vegetable roasts.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="block text-rose-400 font-black text-sm">🌶️ Smoky Toasted Spices</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Smoked Spanish paprika, toasted cumin seeds, and cracked black pepper impart a wood-fired grill savoriness with 0mg sodium.
                </p>
              </div>

              <div className="sm:col-span-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="block text-yellow-400 font-black text-sm">🧀 Nutritional Yeast Flakes</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Packed with B-vitamins, nutritional yeast provides an authentic nutty, parmesan-like cheesy flavor for pasta, soups, and roasted vegetables.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsFlavorGuideOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Recipe Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-scaleUp text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Utensils className="w-6 h-6 text-emerald-400" />
                <span>Add Healthy Custom Recipe</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white font-black text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grandma's Garden Herb Vegetable Soup"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value as RecipeMealType)}
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="breakfast">Breakfast 🥣</option>
                    <option value="lunch">Lunch 🥗</option>
                    <option value="dinner">Dinner 🍝</option>
                    <option value="soup">Soup / Stew 🍲</option>
                    <option value="smoothie">Smoothie 🥤</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Sodium (mg / serving)
                  </label>
                  <input
                    type="number"
                    value={newSodium}
                    onChange={(e) => setNewSodium(parseInt(e.target.value) || 0)}
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                    Prep (min)
                  </label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                    Cook (min)
                  </label>
                  <input
                    type="number"
                    value={newCookTime}
                    onChange={(e) => setNewCookTime(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={newServings}
                    onChange={(e) => setNewServings(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Salt-Free Flavor Tip
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh lemon juice, garlic, rosemary, and cracked black pepper"
                  value={newSeasoningTip}
                  onChange={(e) => setNewSeasoningTip(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Plant Protein / Texture Swap Tip (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Use lentils or hearty beans to replace ground meat"
                  value={newSwapTip}
                  onChange={(e) => setNewSwapTip(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Cardiovascular Benefit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rich in potassium and plant fiber to support healthy blood pressure"
                  value={newHealthBenefit}
                  onChange={(e) => setNewHealthBenefit(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Recipe Icon Emoji
                </label>
                <div className="flex items-center gap-2">
                  {['🥗', '🍲', '🍝', '🥣', '🥤', '🥑', '🥦', '🥘'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewEmoji(em)}
                      className={`text-xl p-2 rounded-xl border transition-all ${
                        newEmoji === em
                          ? 'bg-emerald-600/30 border-emerald-500 scale-110 shadow-sm'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Ingredients (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="2 cups baby spinach&#10;1 cup cherry tomatoes&#10;2 tbsp olive oil"
                  value={newIngredients}
                  onChange={(e) => setNewIngredients(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Cooking Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Sauté garlic in olive oil for 2 minutes.&#10;Add tomatoes and simmer for 10 minutes."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-white font-semibold focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomRecipe}
                disabled={!newTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black shadow-lg flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Save Recipe</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
