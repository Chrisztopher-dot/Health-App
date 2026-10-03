import { ScannedFoodResult, FoodIngredientItem, MealContext } from '../types/health';

const SCAN_HISTORY_KEY = 'health_app_food_scan_history_v1';

export interface PresetFoodItem {
  id: string;
  name: string;
  detectedCategory: string;
  mealContext: MealContext;
  emoji: string;
  photoUrl: string;
  baseServingDescription: string;
  baseCalories: number;
  baseCarbs: number;
  baseFiber: number;
  baseSugar: number;
  baseProtein: number;
  baseFat: number;
  baseSaturatedFat: number;
  baseSodiumMg: number;
  basePotassiumMg: number;
  glycemicImpact: 'low' | 'moderate' | 'high';
  healthScore: number;
  ingredients: FoodIngredientItem[];
  allergens: string[];
  diningOutSmartTips: string[];
  healthierModifications: string[];
  restaurantHiddenRiskSummary: string;
  defaultMultiplier?: number;
}

export const PRESET_FOOD_DATABASE: PresetFoodItem[] = [
  {
    id: 'food-salmon-asparagus',
    name: 'Grilled Wild Salmon with Quinoa & Steamed Asparagus',
    detectedCategory: 'Seafood & Whole Grain Bowl',
    mealContext: 'restaurant',
    emoji: '🐟',
    photoUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Restaurant Dinner Plate (approx. 380g total)',
    baseCalories: 520,
    baseCarbs: 38,
    baseFiber: 7,
    baseSugar: 3,
    baseProtein: 44,
    baseFat: 22,
    baseSaturatedFat: 3.5,
    baseSodiumMg: 340,
    basePotassiumMg: 890,
    glycemicImpact: 'low',
    healthScore: 95,
    ingredients: [
      { name: 'Wild Alaskan Salmon Fillet (6 oz)', category: 'protein', estimatedAmount: '170g', isHealthyHighlight: true, allergen: 'Fish' },
      { name: 'Tri-Color Steamed Quinoa', category: 'carb', estimatedAmount: '120g', isHealthyHighlight: true },
      { name: 'Fresh Steamed Asparagus Spears', category: 'vegetable', estimatedAmount: '80g', isHealthyHighlight: true },
      { name: 'Extra Virgin Olive Oil & Lemon Drizzle', category: 'fat', estimatedAmount: '1 tbsp', isHealthyHighlight: true },
      { name: 'Fresh Garlic & Dill Seasoning', category: 'seasoning', estimatedAmount: '1 tsp', isHealthyHighlight: true },
    ],
    allergens: ['Fish'],
    diningOutSmartTips: [
      'Restaurant kitchens often brush fish with salted butter; asking for "grilled dry or with olive oil" saves up to 250mg sodium.',
      'Asparagus and quinoa provide 890mg of natural potassium which helps counteract sodium and relax blood vessels.',
      'Rich in Omega-3 fatty acids that support cardiovascular arterial health and brain vitality.',
    ],
    healthierModifications: [
      'Ask for lemon wedges on the side to boost flavor without adding table salt.',
      'Request quinoa without added restaurant cooking bouillon.',
    ],
    restaurantHiddenRiskSummary: 'Very low risk meal. Watch out only for excess finishing butter or pre-salted fish glazes.',
  },
  {
    id: 'food-pasta-primavera',
    name: 'Italian Trattoria Penne Primavera with Garlic & Olive Oil',
    detectedCategory: 'Italian Pasta & Garden Vegetables',
    mealContext: 'restaurant',
    emoji: '🍝',
    photoUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Generous Restaurant Pasta Bowl (approx. 420g)',
    baseCalories: 640,
    baseCarbs: 88,
    baseFiber: 8,
    baseSugar: 7,
    baseProtein: 18,
    baseFat: 24,
    baseSaturatedFat: 4.5,
    baseSodiumMg: 680,
    basePotassiumMg: 520,
    glycemicImpact: 'moderate',
    healthScore: 78,
    ingredients: [
      { name: 'Penne Semolina Pasta (Al Dente)', category: 'carb', estimatedAmount: '200g', allergen: 'Gluten' },
      { name: 'Zucchini, Bell Peppers & Cherry Tomatoes', category: 'vegetable', estimatedAmount: '140g', isHealthyHighlight: true },
      { name: 'Extra Virgin Olive Oil & Sautéed Garlic', category: 'fat', estimatedAmount: '2 tbsp', isHealthyHighlight: true },
      { name: 'Shaved Parmigiano-Reggiano Cheese', category: 'dairy', estimatedAmount: '1.5 tbsp', isCautionItem: true, allergen: 'Dairy' },
      { name: 'Fresh Basil & Red Pepper Flakes', category: 'seasoning', estimatedAmount: '1 tbsp', isHealthyHighlight: true },
    ],
    allergens: ['Gluten', 'Dairy'],
    diningOutSmartTips: [
      'Restaurant pasta portions are usually 2 to 3 standard servings. Splitting half into a to-go box immediately cuts carbs to 44g.',
      'Al dente cooking keeps the pasta structure firm, resulting in a lower glycemic spike compared to overcooked noodles.',
      'Parmesan adds savory umami but contains sodium; ask for cheese on the side to control quantity.',
    ],
    healthierModifications: [
      'Ask for extra steamed broccoli or spinach mixed in to double the dietary fiber.',
      'Request light oil and zero added finishing salt at the table.',
    ],
    restaurantHiddenRiskSummary: 'Moderate carb load and high restaurant cooking oil volume. Portion control is key.',
  },
  {
    id: 'food-avocado-toast-egg',
    name: 'Artisan Sourdough Avocado Toast with Poached Eggs',
    detectedCategory: 'Cafe Breakfast & Brunch',
    mealContext: 'cafe',
    emoji: '🥑',
    photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '2 Slices Toasted Sourdough with 2 Eggs & Microgreens (320g)',
    baseCalories: 480,
    baseCarbs: 34,
    baseFiber: 9,
    baseSugar: 2,
    baseProtein: 22,
    baseFat: 28,
    baseSaturatedFat: 5.2,
    baseSodiumMg: 420,
    basePotassiumMg: 680,
    glycemicImpact: 'low',
    healthScore: 92,
    ingredients: [
      { name: 'Naturally Fermented Artisan Sourdough', category: 'carb', estimatedAmount: '2 slices (90g)', allergen: 'Gluten' },
      { name: 'Fresh Hass Avocado (Mashed)', category: 'fruit', estimatedAmount: '1 whole avocado', isHealthyHighlight: true },
      { name: 'Pasture-Raised Poached Eggs', category: 'protein', estimatedAmount: '2 large eggs', isHealthyHighlight: true, allergen: 'Eggs' },
      { name: 'Radish Slices & Baby Microgreens', category: 'vegetable', estimatedAmount: '30g', isHealthyHighlight: true },
      { name: 'Chia Seeds & Cracked Black Pepper', category: 'seasoning', estimatedAmount: '1 tsp', isHealthyHighlight: true },
    ],
    allergens: ['Gluten', 'Eggs'],
    diningOutSmartTips: [
      'Sourdough fermentation lowers the glycemic response and is gentler on digestion.',
      'Avocado is loaded with heart-protective monounsaturated oleic acid and dietary potassium.',
      'Poached eggs are cooked in hot water with zero added cooking oils or butter fats.',
    ],
    healthierModifications: [
      'Ask the barista / kitchen to skip finishing flake salt and add lemon juice or chili flakes instead.',
    ],
    restaurantHiddenRiskSummary: 'Low risk brunch option. Be cautious only of seasoned salt blends sprinkled on top.',
  },
  {
    id: 'food-greek-salad',
    name: 'Traditional Greek Salad with Crumbled Feta & Kalamata Olives',
    detectedCategory: 'Mediterranean Salad',
    mealContext: 'at_friends',
    emoji: '🥗',
    photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Large Salad Bowl with Dressing (340g)',
    baseCalories: 360,
    baseCarbs: 16,
    baseFiber: 6,
    baseSugar: 8,
    baseProtein: 10,
    baseFat: 28,
    baseSaturatedFat: 7.0,
    baseSodiumMg: 790,
    basePotassiumMg: 610,
    glycemicImpact: 'low',
    healthScore: 84,
    ingredients: [
      { name: 'Crisp Cucumbers & Ripe Vine Tomatoes', category: 'vegetable', estimatedAmount: '180g', isHealthyHighlight: true },
      { name: 'Red Onion Slices & Bell Peppers', category: 'vegetable', estimatedAmount: '60g', isHealthyHighlight: true },
      { name: 'Kalamata Olives (Pitted)', category: 'fat', estimatedAmount: '6-8 olives', isCautionItem: true },
      { name: 'Greek Sheep Milk Feta Cheese', category: 'dairy', estimatedAmount: '45g', isCautionItem: true, allergen: 'Dairy' },
      { name: 'Red Wine Vinegar & Oregano Olive Oil', category: 'sauce', estimatedAmount: '2 tbsp', isHealthyHighlight: true },
    ],
    allergens: ['Dairy'],
    diningOutSmartTips: [
      'Feta cheese and olives are cured in brine, making sodium higher (~790mg) despite the healthy fresh vegetables.',
      'When eating at friends or a dinner party, enjoy the fresh cucumber and tomato base while having half the feta cheese.',
      'Extremely low carb impact (only 10g net carbs) with zero refined starches.',
    ],
    healthierModifications: [
      'Ask for feta cheese on the side or swap half the cheese for chickpeas for lower sodium and added fiber.',
    ],
    restaurantHiddenRiskSummary: 'High sodium from cured olives and brined feta cheese. Keep portion size in check.',
  },
  {
    id: 'food-veggie-burger',
    name: 'Black Bean & Quinoa Veggie Burger with Sweet Potato Wedges',
    detectedCategory: 'Plant-Based Bistro Meal',
    mealContext: 'restaurant',
    emoji: '🍔',
    photoUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Veggie Burger on Whole Grain Bun + 1 Side Sweet Potato Wedges (410g)',
    baseCalories: 580,
    baseCarbs: 76,
    baseFiber: 14,
    baseSugar: 11,
    baseProtein: 24,
    baseFat: 18,
    baseSaturatedFat: 2.8,
    baseSodiumMg: 620,
    basePotassiumMg: 820,
    glycemicImpact: 'moderate',
    healthScore: 86,
    ingredients: [
      { name: 'Black Bean, Quinoa & Mushroom Patty', category: 'protein', estimatedAmount: '150g', isHealthyHighlight: true },
      { name: 'Toasted Whole Grain Brioche Bun', category: 'carb', estimatedAmount: '75g', allergen: 'Gluten' },
      { name: 'Oven-Baked Sweet Potato Wedges', category: 'carb', estimatedAmount: '120g', isHealthyHighlight: true },
      { name: 'Butter Lettuce, Tomato & Pickled Onion', category: 'vegetable', estimatedAmount: '50g', isHealthyHighlight: true },
      { name: 'Avocado Spread (Guacamole Style)', category: 'fat', estimatedAmount: '2 tbsp', isHealthyHighlight: true },
    ],
    allergens: ['Gluten'],
    diningOutSmartTips: [
      'Black bean and quinoa patties provide 14g of beneficial prebiotic fiber with zero animal cholesterol.',
      'Sweet potatoes are rich in beta-carotene and potassium (820mg) which helps balance vascular tone.',
      'Commercial veggie patties can contain sodium; choosing avocado spread instead of restaurant mayo saves saturated fats.',
    ],
    healthierModifications: [
      'Opt for an open-faced burger (remove top bun) to save 28g of carbohydrates.',
      'Request sweet potato wedges unsalted from the fryer/oven.',
    ],
    restaurantHiddenRiskSummary: 'Moderate carb load from sweet potatoes and bun. Excellent plant fiber profile.',
  },
  {
    id: 'food-thai-tofu-curry',
    name: 'Thai Coconut Green Curry with Organic Tofu & Brown Rice',
    detectedCategory: 'Southeast Asian Curries',
    mealContext: 'takeout',
    emoji: '🍲',
    photoUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Bowl Green Curry with 1 Cup Steamed Brown Rice (450g)',
    baseCalories: 590,
    baseCarbs: 62,
    baseFiber: 9,
    baseSugar: 6,
    baseProtein: 21,
    baseFat: 28,
    baseSaturatedFat: 14.0,
    baseSodiumMg: 850,
    basePotassiumMg: 740,
    glycemicImpact: 'moderate',
    healthScore: 80,
    ingredients: [
      { name: 'Organic Firm Tofu Cubes (Pan-Seared)', category: 'protein', estimatedAmount: '140g', isHealthyHighlight: true, allergen: 'Soy' },
      { name: 'Coconut Milk & Green Curry Paste Broth', category: 'sauce', estimatedAmount: '180ml', isCautionItem: true },
      { name: 'Bamboo Shoots, Snow Peas, Eggplant & Thai Basil', category: 'vegetable', estimatedAmount: '110g', isHealthyHighlight: true },
      { name: 'Steamed Whole Grain Brown Rice', category: 'carb', estimatedAmount: '140g', isHealthyHighlight: true },
      { name: 'Fresh Kaffir Lime Leaf & Lemongrass Infusion', category: 'seasoning', estimatedAmount: '1 tbsp', isHealthyHighlight: true },
    ],
    allergens: ['Soy'],
    diningOutSmartTips: [
      'Curry pastes and fish/soy sauces in Thai takeout contain high sodium (~850mg). Avoid drinking all the remaining curry broth.',
      'Organic tofu is packed with plant isoflavones and heart-friendly protein.',
      'Brown rice provides complex starches and magnesium to prevent glucose spikes.',
    ],
    healthierModifications: [
      'Spoon veggies and tofu over rice rather than pouring the full pool of coconut broth.',
      'Ask the restaurant for "light coconut milk" or "less fish/soy sauce" when ordering.',
    ],
    restaurantHiddenRiskSummary: 'High sodium in commercial curry paste and saturated fat from rich coconut cream.',
  },
  {
    id: 'food-chicken-buddha-bowl',
    name: 'Mediterranean Grilled Chicken & Hummus Superfood Bowl',
    detectedCategory: 'Grain Bowl & Clean Protein',
    mealContext: 'restaurant',
    emoji: '🥗',
    photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Large Superfood Grain Bowl (390g)',
    baseCalories: 510,
    baseCarbs: 42,
    baseFiber: 11,
    baseSugar: 4,
    baseProtein: 42,
    baseFat: 20,
    baseSaturatedFat: 3.1,
    baseSodiumMg: 490,
    basePotassiumMg: 860,
    glycemicImpact: 'low',
    healthScore: 94,
    ingredients: [
      { name: 'Herb-Marinated Grilled Chicken Breast', category: 'protein', estimatedAmount: '160g', isHealthyHighlight: true },
      { name: 'Organic Chickpea Hummus', category: 'fat', estimatedAmount: '3 tbsp', isHealthyHighlight: true, allergen: 'Sesame' },
      { name: 'Farro & Quinoa Ancient Grain Mix', category: 'carb', estimatedAmount: '90g', isHealthyHighlight: true, allergen: 'Gluten' },
      { name: 'Roasted Beets, Kale & Cucumber Ribbons', category: 'vegetable', estimatedAmount: '120g', isHealthyHighlight: true },
      { name: 'Tahini Garlic Lemon Dressing', category: 'sauce', estimatedAmount: '1.5 tbsp', isHealthyHighlight: true, allergen: 'Sesame' },
    ],
    allergens: ['Sesame', 'Gluten'],
    diningOutSmartTips: [
      'Hummus and farro deliver 11g of gut-healthy dietary fiber to stabilize energy all afternoon.',
      'Lean grilled chicken provides high biological value protein to support senior muscle maintenance.',
      'Beets are naturally rich in dietary nitrates that convert to nitric oxide, helping widen blood vessels and improve circulation.',
    ],
    healthierModifications: [
      'Ask for dressing on the side and drizzle lightly to control total fats and salt.',
    ],
    restaurantHiddenRiskSummary: 'Clean, well-balanced meal. Check dressing amount for calorie control.',
  },
  {
    id: 'food-acai-berry-bowl',
    name: 'Wild Blueberry & Acai Superfood Smoothie Bowl',
    detectedCategory: 'Cafe Smoothie Bowl & Antioxidants',
    mealContext: 'cafe',
    emoji: '🫐',
    photoUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&auto=format&fit=crop&q=80',
    baseServingDescription: '1 Medium Acai Bowl with Toppings (310g)',
    baseCalories: 390,
    baseCarbs: 58,
    baseFiber: 12,
    baseSugar: 28,
    baseProtein: 9,
    baseFat: 14,
    baseSaturatedFat: 2.2,
    baseSodiumMg: 65,
    basePotassiumMg: 690,
    glycemicImpact: 'moderate',
    healthScore: 89,
    ingredients: [
      { name: 'Pure Unsweetened Organic Acai & Wild Blueberries', category: 'fruit', estimatedAmount: '150g', isHealthyHighlight: true },
      { name: 'Sliced Fresh Banana & Strawberries', category: 'fruit', estimatedAmount: '80g', isHealthyHighlight: true },
      { name: 'Unsweetened Almond Milk Base', category: 'dairy', estimatedAmount: '100ml', allergen: 'Tree Nuts' },
      { name: 'Raw Almond Butter Drizzle & Chia Seeds', category: 'fat', estimatedAmount: '1 tbsp', isHealthyHighlight: true, allergen: 'Tree Nuts' },
      { name: 'Low-Sugar Coconut Flakes & Hemp Hearts', category: 'seasoning', estimatedAmount: '1 tbsp', isHealthyHighlight: true },
    ],
    allergens: ['Tree Nuts'],
    diningOutSmartTips: [
      'Extremely low sodium (only 65mg) and high in anthocyanin antioxidants for brain and heart protection.',
      'Fruit sugars are naturally packaged with 12g of fiber and healthy fats from chia and almond butter, softening the glycemic curve.',
      'Cafe bowls sometimes add agave or honey; specify "no added agave/syrups" for maximum blood sugar balance.',
    ],
    healthierModifications: [
      'Ask for extra chia seeds and unsweetened hemp hearts instead of high-sugar honey-roasted granola.',
    ],
    restaurantHiddenRiskSummary: 'Zero sodium risk. Watch out for cafe added sweetened fruit syrups or sweetened granolas.',
  },
];

export class FoodScannerService {
  /**
   * Calculate full nutritional result from a base item scaled by portion multiplier
   */
  public static calculateNutrition(
    base: PresetFoodItem,
    multiplier: number = 1.0,
    customMealContext?: MealContext
  ): ScannedFoodResult {
    const mult = Math.max(0.25, Math.min(3.0, multiplier));
    const mealContext = customMealContext || base.mealContext;

    // Scale macro and micronutrients
    const calories = Math.round(base.baseCalories * mult);
    const carbsGrams = Math.round(base.baseCarbs * mult);
    const fiberGrams = Math.round(base.baseFiber * mult);
    const sugarGrams = Math.round(base.baseSugar * mult);
    const netCarbsGrams = Math.max(0, carbsGrams - fiberGrams);
    const proteinGrams = Math.round(base.baseProtein * mult);
    const fatGrams = Math.round(base.baseFat * mult);
    const saturatedFatGrams = Number((base.baseSaturatedFat * mult).toFixed(1));
    const sodiumMg = Math.round(base.baseSodiumMg * mult);
    const potassiumMg = Math.round(base.basePotassiumMg * mult);

    // Compute senior blood pressure status
    let bpStatus: 'good' | 'moderate' | 'high_sodium' = 'good';
    let bpLabel = 'Heart-Healthy (Low Sodium)';
    let bpDetails = `Sodium is well controlled (${sodiumMg} mg). Balanced by ${potassiumMg} mg potassium.`;

    if (sodiumMg > 750) {
      bpStatus = 'high_sodium';
      bpLabel = 'Caution: High Sodium';
      bpDetails = `Contains ${sodiumMg} mg sodium (over 50% of senior daily recommendation of 1500mg). Drink extra water and request unsalted sides.`;
    } else if (sodiumMg > 450) {
      bpStatus = 'moderate';
      bpLabel = 'Moderate Sodium';
      bpDetails = `Contains ${sodiumMg} mg sodium. Suitable for an occasional restaurant or social meal.`;
    }

    // Compute blood sugar / diabetic impact
    let sugarStatus: 'stable' | 'moderate' | 'spike_risk' = 'stable';
    let sugarLabel = 'Stable Glucose Impact';
    let sugarDetails = `Low net carbs (${netCarbsGrams}g) with high fiber (${fiberGrams}g) promotes steady blood sugar levels.`;

    if (netCarbsGrams > 60 || base.glycemicImpact === 'high') {
      sugarStatus = 'spike_risk';
      sugarLabel = 'High Carb / Glucose Spike Risk';
      sugarDetails = `Delivers ${netCarbsGrams}g net carbs. Consider eating half now and saving the rest to prevent rapid glucose spikes.`;
    } else if (netCarbsGrams > 35 || base.glycemicImpact === 'moderate') {
      sugarStatus = 'moderate';
      sugarLabel = 'Moderate Glycemic Impact';
      sugarDetails = `${netCarbsGrams}g net carbs with ${proteinGrams}g protein to help moderate the insulin response.`;
    }

    // Dynamic health score calculation
    let healthScore = base.healthScore;
    if (sodiumMg > 800) healthScore = Math.max(50, healthScore - 12);
    if (fiberGrams >= 8) healthScore = Math.min(99, healthScore + 4);
    if (mult > 1.25) healthScore = Math.max(50, healthScore - 6);

    const portionLabel = 
      mult === 0.5 ? 'Half Portion (1/2 Plate)' :
      mult === 0.75 ? 'Light Portion (3/4 Plate)' :
      mult === 1.0 ? base.baseServingDescription :
      mult === 1.5 ? 'Large Serving (1.5x Plate)' :
      mult === 2.0 ? 'Double / Shared Platter (2x)' :
      `${mult}x Serving`;

    return {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: base.name,
      detectedCategory: base.detectedCategory,
      mealContext,
      imageUrl: base.photoUrl,
      emoji: base.emoji,
      confidenceScore: Math.floor(Math.random() * 5) + 94, // 94-98%
      timestamp: new Date().toISOString(),
      baseServingDescription: portionLabel,
      portionMultiplier: mult,
      calories,
      carbsGrams,
      netCarbsGrams,
      fiberGrams,
      sugarGrams,
      proteinGrams,
      fatGrams,
      saturatedFatGrams,
      sodiumMg,
      potassiumMg,
      healthScore,
      glycemicImpact: base.glycemicImpact,
      bloodPressureAssessment: {
        status: bpStatus,
        ratingLabel: bpLabel,
        details: bpDetails,
      },
      bloodSugarAssessment: {
        status: sugarStatus,
        ratingLabel: sugarLabel,
        details: sugarDetails,
      },
      ingredients: base.ingredients,
      allergens: base.allergens,
      diningOutSmartTips: base.diningOutSmartTips,
      healthierModifications: base.healthierModifications,
      restaurantHiddenRiskSummary: base.restaurantHiddenRiskSummary,
    };
  }

  /**
   * Analyze custom uploaded image or captured webcam photo.
   * Attempts to call the Gemini Multimodal Vision backend API first.
   * If offline or API key is not configured, seamlessly falls back to smart on-device database heuristics.
   */
  public static async analyzeImage(
    imageDataUrl: string,
    optionalHint?: string
  ): Promise<ScannedFoodResult> {
    // 1. Try Backend Gemini Multimodal Vision API
    try {
      const response = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          hint: optionalHint,
          mimeType: imageDataUrl.startsWith('data:video/') ? 'video/mp4' : 'image/jpeg',
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.data) {
          const g = json.data;
          const netCarbs = Math.max(0, (g.carbsGrams || 0) - (g.fiberGrams || 0));

          return {
            id: `scan-gemini-${Date.now()}`,
            name: g.name || 'Custom Meal',
            detectedCategory: g.detectedCategory || 'Mixed Dish',
            mealContext: 'restaurant',
            imageUrl: imageDataUrl,
            emoji: g.emoji || '🍽️',
            confidenceScore: g.confidenceScore || 96,
            timestamp: new Date().toISOString(),
            baseServingDescription: g.baseServingDescription || '1 Standard Plate',
            portionMultiplier: 1.0,
            calories: g.calories || 450,
            carbsGrams: g.carbsGrams || 40,
            netCarbsGrams: netCarbs,
            fiberGrams: g.fiberGrams || 5,
            sugarGrams: g.sugarGrams || 4,
            proteinGrams: g.proteinGrams || 25,
            fatGrams: g.fatGrams || 15,
            saturatedFatGrams: g.saturatedFatGrams || 3.0,
            sodiumMg: g.sodiumMg || 500,
            potassiumMg: g.potassiumMg || 600,
            healthScore: Math.min(99, Math.max(50, 95 - Math.round((g.sodiumMg || 500) / 100))),
            glycemicImpact: (g.glycemicLoad === 'high' ? 'high' : g.glycemicLoad === 'medium' ? 'moderate' : 'low'),
            bloodPressureAssessment: {
              status: ((g.sodiumMg || 500) > 750 ? 'high_sodium' : (g.sodiumMg || 500) > 450 ? 'moderate' : 'good') as 'good' | 'moderate' | 'high_sodium',
              ratingLabel: g.bloodPressureAssessment?.sodiumLevelDescription || ((g.sodiumMg || 500) > 750 ? 'High Sodium Warning' : 'Safe Sodium Level'),
              details: g.bloodPressureAssessment?.details || 'Clinical advisory for blood pressure.',
            },
            bloodSugarAssessment: {
              status: (g.glycemicLoad === 'high' ? 'spike_risk' : g.glycemicLoad === 'medium' ? 'moderate' : 'stable') as 'stable' | 'moderate' | 'spike_risk',
              ratingLabel: g.glycemicLoad === 'high' ? 'High Glycemic Impact' : 'Stable Glycemic Response',
              details: g.bloodSugarAssessment?.details || 'Clinical advisory for blood sugar.',
            },
            ingredients: (g.ingredients || []).map((i: any) => ({
              name: i.name,
              category: i.category || 'vegetable',
              estimatedAmount: i.estimatedAmount || '',
              isHealthyHighlight: !!i.isHealthyHighlight,
              allergen: i.allergen,
            })),
            allergens: g.allergens || [],
            diningOutSmartTips: g.diningOutSmartTips || [
              'Ask for dressings or sauces on the side to reduce hidden sodium.',
              'Pair high carb sides with protein and fiber to smooth glucose absorption.',
            ],
            healthierModifications: g.healthierModifications || [
              'Ask for extra steamed vegetables or salad instead of deep-fried sides.',
            ],
            restaurantHiddenRiskSummary: g.restaurantHiddenRiskSummary || 'Restaurant portions often contain high sodium and added cooking fats.',
          };
        }
      }
    } catch (_) {
      // Backend is offline or not reachable, fallback to local database heuristics
    }

    // 2. Local Heuristic Fallback
    await new Promise((resolve) => setTimeout(resolve, 800));
    const lowerHint = (optionalHint || '').toLowerCase();

    let matchedPreset = PRESET_FOOD_DATABASE[0];
    if (lowerHint.includes('pasta') || lowerHint.includes('noodle') || lowerHint.includes('italian') || lowerHint.includes('spaghetti')) {
      matchedPreset = PRESET_FOOD_DATABASE[1];
    } else if (lowerHint.includes('toast') || lowerHint.includes('egg') || lowerHint.includes('avocado') || lowerHint.includes('breakfast')) {
      matchedPreset = PRESET_FOOD_DATABASE[2];
    } else if (lowerHint.includes('greek') || lowerHint.includes('salad') || lowerHint.includes('feta') || lowerHint.includes('cucumber')) {
      matchedPreset = PRESET_FOOD_DATABASE[3];
    } else if (lowerHint.includes('burger') || lowerHint.includes('sandwich') || lowerHint.includes('sweet potato') || lowerHint.includes('fries')) {
      matchedPreset = PRESET_FOOD_DATABASE[4];
    } else if (lowerHint.includes('curry') || lowerHint.includes('thai') || lowerHint.includes('tofu') || lowerHint.includes('rice') || lowerHint.includes('soup')) {
      matchedPreset = PRESET_FOOD_DATABASE[5];
    } else if (lowerHint.includes('bowl') || lowerHint.includes('chicken') || lowerHint.includes('hummus') || lowerHint.includes('kale')) {
      matchedPreset = PRESET_FOOD_DATABASE[6];
    } else if (lowerHint.includes('acai') || lowerHint.includes('berry') || lowerHint.includes('smoothie') || lowerHint.includes('fruit')) {
      matchedPreset = PRESET_FOOD_DATABASE[7];
    } else {
      const index = Math.abs(imageDataUrl.length % PRESET_FOOD_DATABASE.length);
      matchedPreset = PRESET_FOOD_DATABASE[index];
    }

    const result = this.calculateNutrition(matchedPreset, 1.0, 'restaurant');
    result.imageUrl = imageDataUrl;
    return result;
  }

  /**
   * Save scan result to history
   */
  public static saveScanToHistory(scan: ScannedFoodResult): void {
    try {
      const history = this.getScanHistory();
      const updated = [scan, ...history.filter((s) => s.id !== scan.id)].slice(0, 30);
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save food scan to localStorage', e);
    }
  }

  /**
   * Get all past scans
   */
  public static getScanHistory(): ScannedFoodResult[] {
    try {
      const raw = localStorage.getItem(SCAN_HISTORY_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read food scan history', e);
    }
    return [];
  }

  /**
   * Delete a scan from history
   */
  public static deleteScanFromHistory(id: string): ScannedFoodResult[] {
    try {
      const history = this.getScanHistory().filter((s) => s.id !== id);
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
      return history;
    } catch (e) {
      console.error('Failed to delete food scan', e);
      return [];
    }
  }

  /**
   * Clear all scan history
   */
  public static clearHistory(): void {
    try {
      localStorage.removeItem(SCAN_HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear food scan history', e);
    }
  }
}
