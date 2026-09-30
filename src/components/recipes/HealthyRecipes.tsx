import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, RecipeItem, RecipeMealType, DietaryTag, ReminderItem } from '../../types/health';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import { RecipeGeneratorService } from '../../services/recipeGeneratorService';
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
  Sparkle,
  Camera,
  ChefHat,
  Star,
  ArrowRight
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
  { key: 'all', label: 'All Diets' },
  { key: 'low_sodium', label: '🧂 Ultra Low-Sodium (<100mg)' },
  { key: 'vegetarian', label: '🌱 100% Vegetarian' },
  { key: 'high_potassium', label: '🥑 High Potassium (BP Lowering)' },
  { key: 'heart_healthy', label: '❤️ Heart-Healthy' },
];

export const HealthyRecipes: React.FC<HealthyRecipesProps> = ({ profile, onNavigateToScanner }) => {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'all' | RecipeMealType>('all');
  const [selectedDietTag, setSelectedDietTag] = useState<'all' | DietaryTag>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>('rec-1');
  const [addedGroceryId, setAddedGroceryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Dynamic Daily Rotation & AI Generator State
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [freshNotification, setFreshNotification] = useState<string | null>(null);
  const [isPantryModalOpen, setIsPantryModalOpen] = useState<boolean>(false);
  const [pantryIngredients, setPantryIngredients] = useState<string>('');

  // AI Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [aiVoiceFeedback, setAiVoiceFeedback] = useState<string | null>(null);

  // Modal Form State
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
    // Check and add fresh seasonal recipes on app launch
    const rotation = RecipeGeneratorService.ensureFreshSeasonalRecipes();
    loadRecipes();

    if (rotation.addedCount > 0) {
      setFreshNotification(`✨ Fresh recipes added for today: "${rotation.newRecipes[0]?.title}"`);
    }
  }, []);

  const loadRecipes = () => {
    const list = HealthStorageService.getAllRecipes();
    setRecipes([...list]);
  };

  // Today's rotating chef feature (changes daily!)
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
      const items = pantryIngredients.split(',').map((s) => s.trim());
      const customRecipe = RecipeGeneratorService.generateProceduralRecipe('dinner', items);
      
      // Personalize title if user provided ingredients
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
    }, 800);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    HealthStorageService.toggleBookmarkRecipe(id);
    loadRecipes();
  };

  const handleAddIngredientsToReminders = (recipe: RecipeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];

    // Create a concise grocery item in Reminders
    const ingredientSummary = recipe.ingredients.slice(0, 5).join(', ') + (recipe.ingredients.length > 5 ? '...' : '');

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
    setTimeout(() => setAddedGroceryId(null), 3000);

    const msg = `Added ingredients for "${recipe.title}" to your Reminders list!`;
    setAiVoiceFeedback(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  const handleReadRecipeAloud = (recipe: RecipeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const speechText = `${recipe.title}. Prep time ${recipe.prepTimeMinutes} minutes, cook time ${recipe.cookTimeMinutes} minutes. Sodium content: ${recipe.sodiumMgPerServing} milligrams per serving. Salt-free seasoning tip: ${recipe.saltFreeSeasoningTips}. Main ingredients include ${recipe.ingredients.slice(0, 4).join(', ')}.`;
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

    if (lower.includes('soup') || lower.includes('stew') || lower.includes('butternut') || lower.includes('bean stew')) {
      setSelectedMealType('soup');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing comforting low-sodium soups and stews, including Tuscan White Bean and Butternut Squash Apple bisque.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('breakfast') || lower.includes('oatmeal') || lower.includes('morning') || lower.includes('toast')) {
      setSelectedMealType('breakfast');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing heart-healthy breakfasts, including Golden Turmeric Oatmeal and Avocado Toast.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('dinner') || lower.includes('lentil') || lower.includes('pasta') || lower.includes('tofu') || lower.includes('portobello')) {
      setSelectedMealType('dinner');
      setSelectedDietTag('all');
      setSearchQuery('');
      const feedback = 'Showing low-sodium vegetarian dinner ideas, including Lentil Bourguignon, Portobello Steaks, and Rainbow Roasted Veggies.';
      setAiVoiceFeedback(feedback);
      if (profile.soundEnabled) SpeechService.speak(feedback, profile.voiceSpeed);
      return;
    }

    if (lower.includes('potassium') || lower.includes('blood pressure') || lower.includes('smoothie')) {
      setSelectedDietTag('high_potassium');
      setSearchQuery('');
      const feedback = 'Showing potassium-rich meals and smoothies that naturally help relax blood vessels and lower blood pressure.';
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
    <div className="max-w-6xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Heart-Healthy Kitchen
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {recipes.length} Low-Sodium & Vegetarian Recipes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2 sm:gap-3">
              <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <span>Healthy Meals & Non-Salty Recipes</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
              Delicious low-sodium and vegetarian dishes with step-by-step recipes, salt-free seasoning tips, and 1-click grocery list integration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Get Fresh AI Suggestions Button */}
            <button
              onClick={handleFetchFreshSuggestions}
              disabled={isGeneratingAI}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              title="Add fresh chef recipe suggestions to your library"
            >
              <Sparkles className={`w-4 h-4 text-amber-200 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'Generating...' : '✨ Fresh AI Ideas'}</span>
            </button>

            {/* AI Pantry Fridge Chef */}
            <button
              onClick={() => setIsPantryModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
              title="Cook with ingredients from your fridge"
            >
              <ChefHat className="w-4 h-4 text-emerald-600" />
              <span>Pantry Chef</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Recipe</span>
            </button>

            <button
              onClick={handleResetRecipes}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Refresh / Reload recipes"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Fresh Recipe Rotation Banner / Notification */}
        {freshNotification && (
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{freshNotification}</span>
            </div>
            <button
              onClick={() => setFreshNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-extrabold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar & Saved Bookmarks Toggle */}
        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, ingredients (spinach, lentils, avocado, mushrooms, garlic)..."
              className="w-full text-sm sm:text-base pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none font-semibold bg-slate-50"
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
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-md'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showBookmarksOnly ? 'fill-white' : ''}`} />
            <span>Saved Recipes ({bookmarkedCount})</span>
          </button>
        </div>

        {/* AI Food Scanner Quick Banner */}
        {onNavigateToScanner && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Eating Out or At Friends? Try the AI Food Scanner
                </h4>
                <p className="text-xs text-slate-600 font-semibold">
                  Snap a picture of your dish with your camera to instantly calculate ingredients, calories, carbs, and restaurant sodium!
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToScanner}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Food Scanner</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Voice Meal Assistant Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-950 text-white rounded-3xl p-4 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleVoice}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Ask AI for food suggestions and recipes by voice"
          >
            {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h4 className="font-extrabold text-base sm:text-lg">AI Healthy Meal Concierge</h4>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
              {aiVoiceFeedback || 'Ask e.g. "Suggest a low-sodium dinner", "What can I cook with lentils?", or "Give me a high potassium smoothie"'}
            </p>
          </div>
        </div>

        {/* Quick Voice Chips */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => handleProcessVoiceCommand('low sodium dinner recipes')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all whitespace-nowrap"
          >
            "🍝 Low-Sodium Dinners"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('warm vegetable soups and stews')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all whitespace-nowrap"
          >
            "🍲 Soups & Stews"
          </button>
          <button
            onClick={() => handleProcessVoiceCommand('potassium blood pressure smoothies')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all whitespace-nowrap"
          >
            "🥤 Potassium Booster"
          </button>
        </div>
      </div>

      {/* Salt-Free Seasoning Quick Master Guide */}
      <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
          <Sparkle className="w-4 h-4 text-amber-600" />
          <span>Doctor & Chef Salt-Free Flavor Enhancers</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-semibold text-slate-800">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
            <span className="block text-amber-800 font-extrabold">🍋 Citrus & Acids</span>
            <span className="text-[11px] text-slate-600">Fresh lemon, lime, and aged balsamic wake up tastebuds like salt.</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
            <span className="block text-emerald-800 font-extrabold">🧄 Roasted Alliums</span>
            <span className="text-[11px] text-slate-600">Garlic, shallots, and caramelized onions provide deep savory umami.</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
            <span className="block text-teal-800 font-extrabold">🌿 Fresh Herbs</span>
            <span className="text-[11px] text-slate-600">Rosemary, basil, thyme, dill, and mint add aromatic depth.</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
            <span className="block text-rose-800 font-extrabold">🌶️ Smoky Spices</span>
            <span className="text-[11px] text-slate-600">Smoked paprika, toasted cumin, and black pepper mimic grill savoriness.</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
            <span className="block text-yellow-800 font-extrabold">🧀 Nutritional Yeast</span>
            <span className="text-[11px] text-slate-600">Gives rich nutty, parmesan-like cheesy flavor with 0mg sodium.</span>
          </div>
        </div>
      </div>

      {/* 🌟 Today's Rotating Daily Chef Special Feature */}
      {dailySpecial && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border-2 border-emerald-600/50 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-700/50 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Today's Daily Chef Feature</span>
              </span>
              <span className="text-xs text-emerald-200 font-bold hidden sm:inline">
                • Rotates every 24 hours
              </span>
            </div>

            <span className="text-xs font-bold text-emerald-200 bg-white/10 px-3 py-1 rounded-full">
              🧂 Only {dailySpecial.sodiumMgPerServing}mg Sodium • 🟢 Zero Added Salt
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {dailySpecial.imageUrl ? (
                <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-white/20 group">
                  <img
                    src={dailySpecial.imageUrl}
                    alt={dailySpecial.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/80 text-white backdrop-blur-xs">
                    {dailySpecial.emoji} Chef Special
                  </span>
                </div>
              ) : (
                <span className="text-4xl sm:text-5xl p-3 rounded-2xl bg-white/10 border border-white/20 flex-shrink-0">
                  {dailySpecial.emoji}
                </span>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {dailySpecial.title}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1 line-clamp-2 max-w-2xl">
                  {dailySpecial.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold text-emerald-300">
                  <span>⏱️ Prep: {dailySpecial.prepTimeMinutes}m</span>
                  <span>•</span>
                  <span>🔥 Cook: {dailySpecial.cookTimeMinutes}m</span>
                  <span>•</span>
                  <span className="text-amber-300">💡 {dailySpecial.saltFreeSeasoningTips.split('.')[0]}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center">
              <button
                onClick={() => setExpandedRecipeId(expandedRecipeId === dailySpecial.id ? null : dailySpecial.id)}
                className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{expandedRecipeId === dailySpecial.id ? 'Hide Recipe' : 'View Full Special'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Type & Dietary Filters */}
      <div className="space-y-2">
        {/* Meal Type Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {MEAL_TYPE_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMealType(m.key)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                selectedMealType === m.key
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Dietary Tag Row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {DIETARY_FILTERS.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDietTag(d.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedDietTag === d.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards List */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center space-y-3 shadow-sm">
          <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-900">No Recipes Found</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            Try clearing your search terms or dietary filters to view all delicious heart-healthy options.
          </p>
          <button
            onClick={() => {
              setSelectedMealType('all');
              setSelectedDietTag('all');
              setSearchQuery('');
              setShowBookmarksOnly(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm"
          >
            Show All Recipes
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const isGroceryAdded = addedGroceryId === recipe.id;

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-400 p-5 sm:p-7 shadow-sm transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    {recipe.imageUrl ? (
                      <div className="relative w-20 h-20 sm:w-28 sm:h-24 rounded-2xl overflow-hidden shadow-xs flex-shrink-0 border border-slate-200 group">
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded-md text-[10px] font-black bg-slate-950/80 text-white backdrop-blur-xs">
                          {recipe.emoji}
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl sm:text-4xl p-2 rounded-2xl bg-emerald-50 border border-emerald-200 flex-shrink-0">
                        {recipe.emoji}
                      </span>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 capitalize">
                          {recipe.mealType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300">
                          🟢 {recipe.sodiumMgPerServing} mg Sodium
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {recipe.caloriesPerServing} kcal • {recipe.servings} Servings
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 leading-tight">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => handleToggleBookmark(recipe.id, e)}
                      className={`p-2 sm:p-2.5 rounded-xl transition-colors ${
                        recipe.isBookmarked
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                      }`}
                      title={recipe.isBookmarked ? 'Saved in bookmarks' : 'Bookmark recipe'}
                    >
                      {recipe.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 fill-emerald-600 text-emerald-700" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1 transition-all"
                    >
                      <span>{isExpanded ? 'Hide Recipe' : 'View Full Recipe'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Description & High-Level Metrics */}
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {recipe.description}
                </p>

                {/* Time & Health Tag Highlights */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Prep: {recipe.prepTimeMinutes}m • Cook: {recipe.cookTimeMinutes}m
                  </span>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-xl border border-emerald-200">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    {recipe.healthBenefit}
                  </span>
                </div>

                {/* Salt-Free & Vegetarian Callout Chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-2xl space-y-1">
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Salt-Free Seasoning Tip:
                    </span>
                    <p className="text-xs font-semibold text-slate-700">
                      {recipe.saltFreeSeasoningTips}
                    </p>
                  </div>

                  {recipe.vegetarianSwapTip && (
                    <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-2xl space-y-1">
                      <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                        Vegetarian Alternative Benefit:
                      </span>
                      <p className="text-xs font-semibold text-slate-700">
                        {recipe.vegetarianSwapTip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expandable Recipe Details: Ingredients & Instructions */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-200 space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ingredients List */}
                      <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                            <span>🛒 Ingredients ({recipe.ingredients.length})</span>
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Zero Added Salt
                          </span>
                        </div>

                        <ul className="space-y-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Add to Reminders Grocery Button */}
                        <button
                          onClick={(e) => handleAddIngredientsToReminders(recipe, e)}
                          className={`w-full mt-2 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isGroceryAdded
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 shadow-sm'
                          }`}
                        >
                          {isGroceryAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Reminders Grocery List!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Add Ingredients to Reminders List</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Step-by-Step Instructions */}
                      <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                            👨‍🍳 Step-by-Step Instructions
                          </h4>
                          <button
                            onClick={(e) => handleReadRecipeAloud(recipe, e)}
                            className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-bold"
                            title="Read recipe aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Read Aloud</span>
                          </button>
                        </div>

                        <ol className="space-y-2 text-xs sm:text-sm font-medium text-slate-700">
                          {recipe.instructions.map((inst, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{inst}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Recipe Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-emerald-600" />
                Add Healthy Recipe
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
                  Recipe Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Garden Vegetable & Lentil Minestrone"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value as RecipeMealType)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600"
                  >
                    <option value="dinner">Dinner 🍝</option>
                    <option value="lunch">Lunch 🥗</option>
                    <option value="breakfast">Breakfast 🥣</option>
                    <option value="soup">Soup & Stew 🍲</option>
                    <option value="smoothie">Smoothie 🥤</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Sodium (mg per serving)
                  </label>
                  <input
                    type="number"
                    value={newSodium}
                    onChange={(e) => setNewSodium(Number(e.target.value) || 75)}
                    className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Calories (kcal per serving)
                  </label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(Number(e.target.value) || 250)}
                    className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Recipe Emoji
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['🥗', '🍲', '🥣', '🍝', '🥑', '🥦', '🫘', '🍄', '🥤', '🍞'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewEmoji(em)}
                        className={`p-1 rounded-lg text-base border transition-all ${
                          newEmoji === em
                            ? 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-300 scale-110'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Prep (mins)</label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(Number(e.target.value) || 10)}
                    className="w-full text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Cook (mins)</label>
                  <input
                    type="number"
                    value={newCookTime}
                    onChange={(e) => setNewCookTime(Number(e.target.value) || 20)}
                    className="w-full text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Servings</label>
                  <input
                    type="number"
                    value={newServings}
                    onChange={(e) => setNewServings(Number(e.target.value) || 4)}
                    className="w-full text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ingredients (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="2 cups baby spinach&#10;1 can no-salt cannellini beans&#10;2 cloves garlic minced"
                  value={newIngredients}
                  onChange={(e) => setNewIngredients(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Step-by-Step Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Sauté garlic and carrots in olive oil.&#10;Add beans and broth and simmer for 15 minutes.&#10;Finish with lemon juice and serve."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Salt-Free Flavor Seasoning Tip
                </label>
                <input
                  type="text"
                  value={newSeasoningTip}
                  onChange={(e) => setNewSeasoningTip(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Vegetarian Swap / Protein Alternative Tip
                </label>
                <input
                  type="text"
                  value={newSwapTip}
                  onChange={(e) => setNewSwapTip(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Health & Blood Pressure Benefit
                </label>
                <input
                  type="text"
                  value={newHealthBenefit}
                  onChange={(e) => setNewHealthBenefit(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50"
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
                onClick={handleSaveCustomRecipe}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Pantry Fridge Chef Generator Modal */}
      {isPantryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-emerald-600" />
                <span>AI Pantry & Fridge Chef</span>
              </h3>
              <button
                onClick={() => setIsPantryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              Type the ingredients you currently have at home (e.g. <em>spinach, lentils, garlic, sweet potato, brown rice</em>). The AI will immediately craft a brand-new salt-free, heart-healthy gourmet recipe!
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  What ingredients are in your kitchen today?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. broccoli, chickpeas, garlic, olive oil, quinoa, lemon"
                  value={pantryIngredients}
                  onChange={(e) => setPantryIngredients(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border-2 border-slate-300 font-semibold bg-slate-50 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Quick ingredient chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['🥦 Broccoli', '🥑 Avocado', '🫘 Black Beans', '🧄 Garlic', '🍠 Sweet Potato', '🍅 Tomatoes', '🍄 Mushrooms', '🌾 Quinoa'].map((ing) => (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => {
                      const clean = ing.split(' ')[1];
                      setPantryIngredients((prev) => (prev ? `${prev}, ${clean}` : clean));
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-100 text-slate-800 transition-colors"
                  >
                    + {ing}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setIsPantryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFromPantry}
                disabled={!pantryIngredients.trim() || isGeneratingAI}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAI ? 'Crafting Recipe...' : 'Generate AI Recipe'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
