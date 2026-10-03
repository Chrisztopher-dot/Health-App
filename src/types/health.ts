export type HealthMood = 'very_good' | 'good' | 'okay' | 'not_great' | 'poor';

export interface BloodPressureReading {
  measured: boolean;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
}

export type MedicationStatus = 'taken' | 'not_yet' | 'missed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string; // e.g. "Take with breakfast"
  timeOfDay: TimeOfDay;
  active?: boolean;
}

export interface MedicationLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  medicationId: string;
  medicationName: string;
  dosage: string;
  timeOfDay: TimeOfDay;
  status: 'taken' | 'missed' | 'pending';
  takenTime?: string; // e.g. "08:15 AM"
  notes?: string;
}

export type ActivityIntensity = 'gentle' | 'moderate' | 'vigorous';
export type ActivityCategory = 
  | 'walking' 
  | 'hiking' 
  | 'housework' 
  | 'sports' 
  | 'stretching' 
  | 'swimming' 
  | 'gardening' 
  | 'cycling' 
  | 'dancing' 
  | 'strength' 
  | 'other';

export interface ActivityLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "Hiking", "Working on the house", "Morning Walk"
  category: ActivityCategory;
  durationMinutes: number;
  intensity: ActivityIntensity;
  timeOfDay: TimeOfDay;
  notes?: string;
  feelingAfter?: 'energized' | 'refreshed' | 'tired' | 'good';
  timestamp: string;
}

export interface CheckInRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  mood: HealthMood;
  energyLevel: number; // 1 to 10
  sleepQuality: number; // 1 to 10
  painLevel: number; // 0 to 10
  painNotes?: string;
  bloodPressure: BloodPressureReading;
  medicationStatus: MedicationStatus;
  medicationNotes?: string;
  symptoms: string[];
  symptomNotes?: string;
  weight?: number; // in lbs or kg
  dailyNotes?: string;
  inputMode: 'standard' | 'conversational';
}

export type AlertType = 'medication' | 'blood_pressure' | 'wellness' | 'doctor_followup';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SmartAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  dateTriggered: string;
  dismissed: boolean;
}

export interface DailySummary {
  headline: string;
  insights: string[];
  motivation: string;
  disclaimer: string;
}

export type WellbeingStateCategory = 'thriving' | 'good' | 'okay' | 'below_normal' | 'needs_attention';

export interface WellbeingTheme {
  id: WellbeingStateCategory;
  name: string;
  themeMood: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  bgGradient: string;
  cardAtmosphere: string;
  ambientGlow: string;
  ringGlow: string;
  topBarTint: string;
  topBarBorder: string;
  description: string;
}

export interface WellbeingAvatarState {
  category: WellbeingStateCategory;
  score: number; // 0 to 100
  label: string; // e.g. "Vitals & Energy in Healthy Balance"
  emoji: string; // Dynamic smiley expression
  bgGradient: string;
  ringColor: string;
  statusMessage: string;
  prolongedBelowNormal: boolean;
  prolongedDaysCount: number;
  averageMood: string;
  averageEnergy: number;
  averageSleep: number;
  recommendation: string;
  theme?: WellbeingTheme;
}

export interface UserProfile {
  name: string;
  age: number;
  targetSystolicMin: number;
  targetSystolicMax: number;
  targetDiastolicMin: number;
  targetDiastolicMax: number;
  medications: MedicationItem[];
  highContrast: boolean;
  textScale: 'normal' | 'large' | 'extra-large';
  soundEnabled: boolean;
  voiceSpeed: number; // 0.85 for senior friendly slow, 1.0 normal
  voicePersona?: string; // 'samantha' | 'alex' | 'daniel' | 'karen' | 'victoria' | 'fred' | 'custom'
  voiceId?: string; // Specific browser voiceURI or voice name
  voicePitch?: number; // 0.8 to 1.2
  themeMode?: 'system' | 'dark' | 'light'; // 'system' is default
}

export type ReminderPriority = 'urgent' | 'less_urgent';

export interface ReminderItem {
  id: string;
  title: string;
  priority: ReminderPriority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // e.g. "10:00 AM" or "Morning"
  completed: boolean;
  completedAt?: string; // ISO string
  notes?: string;
  createdAt: string; // ISO string
}

export interface RetrospectiveQueryResult {
  query: string;
  answer: string;
  relevantDateRange: string;
  bulletPoints: string[];
  suggestedFollowUp?: string;
  doctorConsultSuggested: boolean;
}

export type BayAreaCategory = 
  | 'restaurant'
  | 'food_festival'
  | 'art_culture'
  | 'music_concert'
  | 'farmers_market'
  | 'nature_walk'
  | 'community'
  | 'fair_festival';

export type BayAreaRegion = 
  | 'all'
  | 'san_francisco'
  | 'east_bay'
  | 'peninsula_south_bay'
  | 'north_bay_marin'
  | 'napa_sonoma';

export interface BayAreaEvent {
  id: string;
  title: string;
  category: BayAreaCategory;
  region: BayAreaRegion;
  locationName: string;
  dateRange: string;
  time: string;
  description: string;
  highlights: string[];
  admission: string;
  emoji: string;
  seniorFriendlyNotes?: string;
  weatherTip?: string;
  isBookmarked?: boolean;
  websiteUrl?: string;
  isRecurring?: boolean;
  isThisWeek?: boolean;
  weekLabel?: string;
  imageUrl?: string;
}

export type RecipeMealType = 'breakfast' | 'lunch' | 'dinner' | 'soup' | 'snack' | 'smoothie';

export type DietaryTag = 'low_sodium' | 'vegetarian' | 'vegan' | 'heart_healthy' | 'diabetic_friendly' | 'high_potassium';

export interface RecipeItem {
  id: string;
  title: string;
  mealType: RecipeMealType;
  dietaryTags: DietaryTag[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  sodiumMgPerServing: number;
  caloriesPerServing: number;
  description: string;
  ingredients: string[];
  instructions: string[];
  saltFreeSeasoningTips: string;
  vegetarianSwapTip?: string;
  healthBenefit: string;
  emoji: string;
  imageUrl?: string;
  isBookmarked?: boolean;
}

export type AppTab = 
  | 'checkin' 
  | 'conversational' 
  | 'assistant'
  | 'timeline' 
  | 'alerts' 
  | 'medicine' 
  | 'activities' 
  | 'reminders' 
  | 'happenings' 
  | 'recipes' 
  | 'scanner';

export interface FoodIngredientItem {
  name: string;
  category: 'protein' | 'carb' | 'vegetable' | 'fat' | 'sauce' | 'dairy' | 'seasoning' | 'fruit';
  estimatedAmount?: string;
  isHealthyHighlight?: boolean;
  isCautionItem?: boolean;
  allergen?: string;
}

export type MealContext = 'restaurant' | 'at_friends' | 'home_cooked' | 'cafe' | 'takeout' | 'party_event';

export interface ScannedFoodResult {
  id: string;
  name: string;
  detectedCategory: string;
  mealContext: MealContext;
  imageUrl?: string;
  emoji: string;
  confidenceScore: number; // 0 to 100
  timestamp: string; // ISO string

  // Serving and Base Metrics (at 1.0x multiplier)
  baseServingDescription: string;
  portionMultiplier: number; // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0

  // Nutrition calculated per selected portion multiplier
  calories: number;
  carbsGrams: number;
  netCarbsGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  proteinGrams: number;
  fatGrams: number;
  saturatedFatGrams: number;
  sodiumMg: number;
  potassiumMg: number;

  // Senior Health & Dietary Impact
  healthScore: number; // 0 - 100
  glycemicImpact: 'low' | 'moderate' | 'high';
  
  bloodPressureAssessment: {
    status: 'good' | 'moderate' | 'high_sodium';
    ratingLabel: string;
    details: string;
  };

  bloodSugarAssessment: {
    status: 'stable' | 'moderate' | 'spike_risk';
    ratingLabel: string;
    details: string;
  };

  // Ingredients and Allergen Breakdown
  ingredients: FoodIngredientItem[];
  allergens: string[];

  // Eating Out & Friends' House Guidance
  diningOutSmartTips: string[];
  healthierModifications: string[];
  restaurantHiddenRiskSummary?: string;
}

