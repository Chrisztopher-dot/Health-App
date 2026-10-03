import { RecipeItem, RecipeMealType } from '../types/health';
import { HealthStorageService } from './healthStorage';

export interface WeeklyThemePack {
  themeKey: string;
  title: string;
  bannerEmoji: string;
  description: string;
  highlightNutrient: string;
  recipes: RecipeItem[];
}

export interface WeeklySyncResult {
  recipes: RecipeItem[];
  isNewWeek: boolean;
  weekInfo: {
    weekKey: string;
    weekRangeLabel: string;
    thisWeekFullLabel: string;
    thisMonday: string;
    thisSunday: string;
    daysRemainingInWeek: number;
    weekNum: number;
  };
  currentTheme: WeeklyThemePack;
  nextTheme: WeeklyThemePack;
}

// 6 Curated 7-Day Weekly Menus (Mon - Sun) rotating automatically every 7 days
export const WEEKLY_RECIPE_THEMES: WeeklyThemePack[] = [
  // --- WEEK 1: Mediterranean Heart & Blood Pressure Harmony ---
  {
    themeKey: 'mediterranean_harmony',
    title: 'Mediterranean Heart & Blood Pressure Harmony',
    bannerEmoji: '🌿',
    description: 'Extra virgin olive oil, fresh lemon, leafy greens, wild salmon, and potassium-rich legumes designed to keep blood pressure balanced.',
    highlightNutrient: 'Rich in Potassium (800mg+), Omega-3s & Low-Sodium Seasonings',
    recipes: [
      {
        id: 'w1-rec-1',
        title: 'Creamy Tuscan Cannellini Bean & Baby Spinach Stew',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        sodiumMgPerServing: 75,
        caloriesPerServing: 240,
        description: 'Velvety Mediterranean stew simmered with minced garlic, sun-ripened tomatoes, sweet carrots, and fresh spinach with zero added salt.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added Cannellini beans, rinsed and drained',
          '4 cups low-sodium vegetable broth (under 140mg sodium)',
          '3 cups fresh baby spinach leaves',
          '1 can (14 oz) no-salt-added diced Italian tomatoes',
          '4 cloves garlic, minced',
          '1 medium yellow onion and 2 carrots, diced',
          '2 tbsp extra virgin olive oil',
          '1 tbsp fresh rosemary, finely chopped',
          '1 tsp dried oregano and 1 tsp dried thyme',
          '1 tbsp fresh lemon juice and cracked black pepper',
        ],
        instructions: [
          'Heat olive oil in a Dutch oven over medium heat. Sauté onion and carrots for 5 minutes until tender.',
          'Add garlic, rosemary, oregano, and thyme; stir for 1 minute until highly aromatic.',
          'Add diced tomatoes, rinsed Cannellini beans, and vegetable broth. Simmer for 12 minutes.',
          'Mash 1/3 of the beans with a wooden spoon to thicken the soup naturally into a creamy broth.',
          'Stir in fresh baby spinach for 2 minutes until wilted. Finish with fresh lemon juice and black pepper.',
        ],
        saltFreeSeasoningTips: 'Fresh lemon juice, aromatic garlic, and fresh rosemary provide vibrant savoriness without salt.',
        vegetarianSwapTip: 'Cannellini beans deliver 15g of clean plant protein and 12g of prebiotic fiber per serving.',
        healthBenefit: 'High in natural potassium and magnesium to support arterial wall elasticity and healthy blood pressure.',
        emoji: '🫘',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-2',
        title: 'Grilled Wild Salmon with Asparagus & Tri-Color Quinoa',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 2,
        sodiumMgPerServing: 90,
        caloriesPerServing: 440,
        description: 'Tender Alaskan salmon fillet grilled with Meyer lemon and cracked pepper, served over nutty quinoa and steamed young asparagus.',
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 wild salmon fillets (6 oz each)',
          '1 bunch fresh asparagus spears, trimmed',
          '1 cup tri-color quinoa, rinsed',
          '2 tbsp extra virgin olive oil',
          '1 Meyer lemon, sliced into wedges and juiced',
          '1 tbsp fresh dill, chopped',
          '2 cloves garlic, minced',
          'Cracked black pepper to taste',
        ],
        instructions: [
          'Cook quinoa in 2 cups of water for 15 minutes until fluffy; fluff with fork and fold in fresh dill.',
          'Rub salmon fillets with 1 tbsp olive oil, minced garlic, lemon juice, and black pepper.',
          'Pan-sear salmon in a hot skillet for 4-5 minutes per side until golden brown and flaky.',
          'Steam asparagus for 4 minutes until bright green and tender-crisp; toss with lemon zest.',
          'Plate salmon over warm quinoa with steamed asparagus spears and fresh lemon wedges.',
        ],
        saltFreeSeasoningTips: 'Zesty Meyer lemon juice and fresh dill accentuate the natural sweetness of wild salmon.',
        healthBenefit: 'Packed with 2,200mg Omega-3 fatty acids and 890mg potassium to protect cardiac rhythm.',
        emoji: '🐟',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-3',
        title: 'Golden Steel-Cut Oats with Wild Blueberries & Ceylon Cinnamon',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 260,
        description: 'Hearty slow-simmered steel cut oats topped with antioxidant wild blueberries, crushed walnuts, and ground flaxseed.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup steel-cut whole grain oats',
          '2.5 cups unsweetened almond milk or water',
          '1 cup fresh or frozen wild blueberries',
          '2 tbsp ground golden flaxseed',
          '1/4 cup raw walnuts, roughly chopped',
          '1 tsp ground Ceylon cinnamon and 1/2 tsp vanilla extract',
        ],
        instructions: [
          'Bring almond milk and water to a gentle boil in a medium saucepan.',
          'Add steel-cut oats, reduce heat to low, cover, and simmer for 15 minutes until creamy.',
          'Stir in Ceylon cinnamon, vanilla extract, and ground flaxseed.',
          'Spoon into warm breakfast bowls. Top generously with wild blueberries and crushed walnuts.',
        ],
        saltFreeSeasoningTips: 'Fragrant Ceylon cinnamon and sweet wild blueberries provide warm sweetness with zero added sugar or sodium.',
        vegetarianSwapTip: 'Soluble beta-glucan fiber in steel-cut oats actively binds to cholesterol to promote clear vessels.',
        healthBenefit: 'Lowers LDL cholesterol and stabilizes morning blood glucose without insulin spikes.',
        emoji: '🥣',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-4',
        title: 'Avocado, Baby Spinach & Potassium Green Smoothie',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 25,
        caloriesPerServing: 190,
        description: 'Silky, refreshing green smoothie loaded with ripe avocado, baby spinach, banana, and fresh lime juice.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1/2 ripe Hass avocado',
          '2 cups fresh baby spinach leaves',
          '1 ripe banana (fresh or frozen)',
          '1.5 cups unsweetened almond milk or coconut water',
          '1 tbsp chia seeds',
          '1 tbsp fresh lime juice',
        ],
        instructions: [
          'Place baby spinach, avocado, banana, and chia seeds into a high-speed blender.',
          'Pour in cold almond milk and fresh lime juice.',
          'Blend on high speed for 60 seconds until completely silky and smooth.',
          'Pour into chilled glasses and enjoy immediately.',
        ],
        saltFreeSeasoningTips: 'Fresh lime juice brightens the earthy greens and avocado into a refreshing citrus tonic.',
        healthBenefit: 'Provides 740mg potassium and healthy monounsaturated fats for cardiac endurance.',
        emoji: '🥑',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-5',
        title: 'Roasted Sweet Potato & Mediterranean Lentil Power Bowl',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 3,
        sodiumMgPerServing: 50,
        caloriesPerServing: 340,
        description: 'Caramelized roasted sweet potato cubes served over French green lentils, cucumber, and tahini lemon dressing.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 medium sweet potatoes, peeled and cubed',
          '1.5 cups cooked French green lentils',
          '1 cup English cucumber, diced',
          '2 cups baby arugula or mixed greens',
          '2 tbsp pure sesame tahini (no added salt)',
          '2 tbsp warm water and 1.5 tbsp fresh lemon juice',
          '1 tbsp extra virgin olive oil and 1 tsp ground cumin',
        ],
        instructions: [
          'Preheat oven to 400°F (200°C). Toss sweet potatoes with olive oil and cumin; roast for 25 minutes.',
          'In a small bowl, whisk sesame tahini, lemon juice, and warm water until a creamy dressing forms.',
          'Assemble bowls with warm green lentils, fresh greens, diced cucumber, and roasted sweet potatoes.',
          'Drizzle creamy tahini dressing over top and garnish with black sesame seeds.',
        ],
        saltFreeSeasoningTips: 'Creamy sesame tahini and roasted cumin give rich savory depth with zero salt.',
        healthBenefit: 'High dietary potassium and complex plant carbohydrates keep afternoon energy steady.',
        emoji: '🥗',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-6',
        title: 'Savory Herb-Roasted Cauliflower Steaks with Chimichurri',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 3,
        sodiumMgPerServing: 45,
        caloriesPerServing: 210,
        description: 'Golden roasted cauliflower center steaks served over vibrant fresh parsley, garlic, and cilantro chimichurri.',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 large heads fresh cauliflower, sliced into 3/4-inch center steaks',
          '1 cup fresh Italian parsley, finely minced',
          '1/2 cup fresh cilantro, finely minced',
          '4 cloves garlic, minced',
          '3 tbsp extra virgin olive oil',
          '2 tbsp red wine vinegar',
          '1 tsp smoked paprika and 1/2 tsp dried oregano',
        ],
        instructions: [
          'Preheat oven to 425°F (220°C). Brush cauliflower steaks with 1 tbsp olive oil and dust with smoked paprika.',
          'Roast on a parchment-lined baking sheet for 25 minutes, flipping once, until caramelized and tender.',
          'Whisk minced parsley, cilantro, garlic, red wine vinegar, remaining olive oil, and oregano for the chimichurri.',
          'Plate hot cauliflower steaks and spoon vibrant chimichurri generously over top.',
        ],
        saltFreeSeasoningTips: 'Red wine vinegar and pungent garlic chimichurri deliver steakhouse punch without sodium.',
        healthBenefit: 'Cruciferous sulforaphane supports cellular detoxification and artery health.',
        emoji: '🥦',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-7',
        title: 'Warm French Lentil & Roasted Beet Salad with Walnuts',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 3,
        sodiumMgPerServing: 60,
        caloriesPerServing: 310,
        description: 'Earthy green lentils combined with sweet roasted red beets, toasted walnuts, fresh dill, and balsamic drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups cooked French green lentils',
          '2 medium red beets, roasted and cubed',
          '2 cups baby spinach',
          '1/3 cup raw walnuts, toasted',
          '2 tbsp fresh dill, chopped',
          '1.5 tbsp extra virgin olive oil and 1 tbsp aged balsamic vinegar',
          'Cracked black pepper',
        ],
        instructions: [
          'In a wooden salad bowl, combine warm cooked green lentils and roasted beet cubes.',
          'Add baby spinach leaves and chopped fresh dill.',
          'Drizzle with olive oil and aged balsamic vinegar; toss gently.',
          'Top with toasted crunchy walnuts and cracked black pepper before serving.',
        ],
        saltFreeSeasoningTips: 'Natural nitrates in sweet roasted beets and aromatic dill eliminate need for salt.',
        healthBenefit: 'Dietary nitrates from beets promote nitric oxide production for blood pressure lowering.',
        emoji: '🥗',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
      {
        id: 'w1-rec-8',
        title: 'Creamy Lemon Rosemary White Bean Dip with Crisp Veggies',
        mealType: 'snack',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        servings: 4,
        sodiumMgPerServing: 35,
        caloriesPerServing: 160,
        description: 'Smooth and garlicky white bean spread infused with fresh rosemary, lemon zest, and olive oil with crunchy bell peppers.',
        imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 can (15 oz) no-salt-added Great Northern white beans, rinsed',
          '2 tbsp extra virgin olive oil',
          '2 cloves garlic, minced',
          '1 tbsp fresh rosemary, minced',
          '1 lemon, zested and juiced',
          'Fresh rainbow carrots, celery sticks, and bell pepper strips for dipping',
        ],
        instructions: [
          'In a food processor, blend rinsed white beans, olive oil, garlic, lemon juice, lemon zest, and rosemary.',
          'Blend for 2 minutes until completely smooth and velvety.',
          'Transfer to a serving dish and drizzle with a drop of olive oil and cracked pepper.',
          'Serve surrounded with crisp raw carrot coins, celery sticks, and sweet bell pepper slices.',
        ],
        saltFreeSeasoningTips: 'Lemon zest and fresh rosemary create herbaceous savoriness with zero table salt.',
        healthBenefit: 'Healthy senior snack providing 6g fiber and slow-burning complex plant energy.',
        emoji: '🥕',
        weekMenuTheme: 'Mediterranean Heart & Blood Pressure Harmony',
        isWeeklySpecial: true,
      },
    ],
  },

  // --- WEEK 2: Anti-Inflammatory Garden & Golden Roots ---
  {
    themeKey: 'golden_anti_inflammatory',
    title: 'Anti-Inflammatory Garden & Golden Roots',
    bannerEmoji: '✨',
    description: 'Golden turmeric, fresh ginger root, antioxidant berries, shiitake mushrooms, and cruciferous greens designed to soothe joint inflammation and arteries.',
    highlightNutrient: 'Rich in Curcumin, Gingerols, Beta-Carotene & Vitamin C',
    recipes: [
      {
        id: 'w2-rec-1',
        title: 'Golden Turmeric & Ginger Coconut Red Lentil Dahl',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        sodiumMgPerServing: 80,
        caloriesPerServing: 320,
        description: 'Velvety red lentils simmered in light coconut milk, fresh grated ginger root, golden turmeric, and sweet cherry tomatoes.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups dry red lentils, rinsed thoroughly',
          '1 can (13.5 oz) light coconut milk',
          '2.5 cups low-sodium vegetable broth or water',
          '1 tbsp fresh ginger root, finely grated',
          '1 tbsp ground turmeric (anti-inflammatory booster)',
          '1 tbsp ground cumin and 1 tsp ground coriander',
          '4 cloves garlic, minced',
          '1 cup cherry tomatoes, halved and 2 cups baby spinach',
          'Fresh cilantro and lime wedges for serving',
        ],
        instructions: [
          'In a large saucepan, sauté minced garlic and grated ginger in 1 tbsp olive oil for 2 minutes.',
          'Add turmeric, cumin, and coriander; toast spices for 45 seconds until fragrant.',
          'Add rinsed red lentils, light coconut milk, and low-sodium broth.',
          'Simmer uncovered on low heat for 18 minutes until lentils are soft and creamy.',
          'Stir in cherry tomatoes and baby spinach for 2 minutes. Garnish with fresh cilantro and lime juice.',
        ],
        saltFreeSeasoningTips: 'Fresh lime juice activates the warm turmeric and toasted cumin with zero sodium.',
        vegetarianSwapTip: 'Red lentils provide 18g clean plant protein per bowl without cholesterol.',
        healthBenefit: 'Potent curcumin and gingerols support joint comfort and reduce arterial inflammation.',
        emoji: '🍲',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-2',
        title: 'Roasted Butternut Squash & Honeycrisp Apple Ginger Soup',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        sodiumMgPerServing: 55,
        caloriesPerServing: 180,
        description: 'Naturally sweet and warming soup bursting with beta-carotene, fresh ginger root, roasted butternut squash, and crisp California apples.',
        imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 large butternut squash (about 3 lbs), peeled, seeded, and cubed',
          '2 Honeycrisp apples, peeled, cored, and chopped',
          '1 medium yellow onion, chopped',
          '4 cups low-sodium vegetable broth (under 140mg sodium)',
          '1.5 tbsp fresh ginger root, finely grated',
          '2 tbsp extra virgin olive oil',
          '1/2 tsp ground nutmeg and 1/2 tsp ground cinnamon',
          '1/4 cup raw unsalted pumpkin seeds (pepitas) for garnish',
        ],
        instructions: [
          'Preheat oven to 400°F (200°C). Toss cubed squash and onion with olive oil; roast for 25 minutes until tender.',
          'In a large soup pot, combine roasted squash, chopped apples, grated ginger, nutmeg, and vegetable broth.',
          'Bring to a boil, then reduce heat and simmer for 15 minutes until apples are completely soft.',
          'Using an immersion blender, puree the soup until velvety smooth and silky.',
          'Ladle into warm bowls and top with toasted crunchy pumpkin seeds and a dusting of cinnamon.',
        ],
        saltFreeSeasoningTips: 'Sweet Honeycrisp apples, spicy ginger root, and nutmeg create rich flavor with zero salt.',
        healthBenefit: 'Provides over 300% daily Vitamin A from beta-carotene for cellular repair.',
        emoji: '🥣',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-3',
        title: 'Moroccan Spiced Chickpea & Sweet Potato Tagine',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        sodiumMgPerServing: 70,
        caloriesPerServing: 310,
        description: 'Slow-simmered Moroccan stew with chickpeas, sweet potatoes, diced tomatoes, dried apricots, and warm spices.',
        imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added chickpeas, rinsed and drained',
          '2 large sweet potatoes, peeled and cut into chunks',
          '1 can (14 oz) no-salt-added diced tomatoes',
          '2 cups low-sodium vegetable broth',
          '1/3 cup dried apricots, chopped',
          '4 cloves garlic, minced',
          '1 tbsp ground cumin, 1 tsp coriander, and 1 tsp cinnamon',
          'Fresh cilantro and toasted slivered almonds for garnish',
        ],
        instructions: [
          'Heat olive oil in a heavy pot; sauté onion and sweet potatoes for 6 minutes.',
          'Add garlic, cumin, coriander, and cinnamon; stir for 1 minute until fragrant.',
          'Add diced tomatoes, rinsed chickpeas, vegetable broth, and dried apricots.',
          'Cover and simmer on low for 25 minutes until sweet potatoes are tender.',
          'Garnish with fresh cilantro and toasted slivered almonds; serve over whole grain couscous or quinoa.',
        ],
        saltFreeSeasoningTips: 'Cinnamon, cumin, and dried apricots provide savory and sweet complexity without salt.',
        healthBenefit: 'Sweet potatoes and chickpeas deliver over 850mg of natural potassium per serving.',
        emoji: '🍲',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-4',
        title: 'Turmeric Golden Chai Oatmeal with Chia & Almonds',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        sodiumMgPerServing: 20,
        caloriesPerServing: 270,
        description: 'Comforting warm oats infused with golden turmeric, crushed ginger, cardamom, and sliced almonds.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup rolled whole grain oats',
          '2 cups unsweetened almond milk',
          '1 tsp ground turmeric and 1/2 tsp ground ginger',
          '1/4 tsp ground cardamom and 1/2 tsp cinnamon',
          '1 tbsp chia seeds and 1 tbsp ground flaxseed',
          '1/4 cup sliced raw almonds and 1 tbsp pure maple syrup',
        ],
        instructions: [
          'In a saucepan, combine almond milk, oats, turmeric, ginger, cardamom, and cinnamon.',
          'Cook over medium-low heat for 8-10 minutes, stirring occasionally, until creamy and golden.',
          'Stir in chia seeds and flaxseed; remove from heat and let stand for 2 minutes.',
          'Serve in bowls topped with crunchy sliced almonds and a light drizzle of maple syrup.',
        ],
        saltFreeSeasoningTips: 'Golden turmeric and sweet cardamom provide comforting warmth without salt or dairy.',
        healthBenefit: 'Combats morning joint stiffness and supports blood sugar stability.',
        emoji: '🥣',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-5',
        title: 'Anti-Inflammatory Mango, Turmeric & Ginger Shake',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 180,
        description: 'Vibrant golden smoothie blending sweet ripe mango, fresh ginger root, turmeric, and organic plant milk.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups frozen mango chunks',
          '1/2 inch fresh ginger root, peeled',
          '1/2 tsp ground turmeric with a pinch of black pepper',
          '1.5 cups unsweetened oat milk or almond milk',
          '1 tbsp hemp hearts (plant protein booster)',
        ],
        instructions: [
          'Add mango chunks, fresh ginger, turmeric, black pepper, and hemp hearts into blender.',
          'Pour in cold oat milk.',
          'Blend on high speed for 60 seconds until completely creamy and golden.',
          'Serve cold in tall glasses.',
        ],
        saltFreeSeasoningTips: 'Pinch of black pepper increases curcumin absorption from turmeric by up to 2,000%.',
        healthBenefit: 'Natural digestive aid and powerful antioxidant tonic for heart vitality.',
        emoji: '🥭',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-6',
        title: 'Pan-Crisped Herb Tofu with Garlic Mashed Cauliflower',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 3,
        sodiumMgPerServing: 65,
        caloriesPerServing: 250,
        description: 'Golden seared organic tofu triangles served over fluffy garlic cauliflower mash and steamed broccolini.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 block (14 oz) extra-firm organic tofu, pressed and sliced into triangles',
          '1 large head cauliflower, cut into florets and steamed tender',
          '4 cloves garlic, roasted or minced',
          '2 tbsp nutritional yeast (savory cheese flavor with 0mg sodium)',
          '2 tbsp extra virgin olive oil',
          '1 tbsp fresh rosemary and 1 tbsp lemon juice',
        ],
        instructions: [
          'Blend steamed cauliflower florets with garlic, nutritional yeast, and 1 tbsp olive oil until smooth and creamy.',
          'In a skillet, sear tofu triangles in 1 tbsp olive oil for 4-5 minutes per side until crisp and golden.',
          'Drizzle tofu with fresh lemon juice and minced rosemary.',
          'Serve crispy tofu over warm garlic cauliflower mash with steamed greens.',
        ],
        saltFreeSeasoningTips: 'Nutritional yeast provides rich parmesan-like umami with zero sodium.',
        healthBenefit: 'Low glycemic, heart-safe plant protein that supports lean muscle retention.',
        emoji: '🍽️',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-7',
        title: 'Rainbow Crisp Cabbage, Edamame & Sesame Ginger Bowl',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 5,
        servings: 3,
        sodiumMgPerServing: 45,
        caloriesPerServing: 280,
        description: 'Crunchy red and green cabbage shredded with shelled edamame, grated carrots, and toasted sesame ginger vinaigrette.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cups shredded purple cabbage and 2 cups shredded green savoy cabbage',
          '1.5 cups organic shelled edamame, steamed',
          '1 large carrot, grated into ribbons',
          '1/4 cup toasted sliced almonds',
          '1.5 tbsp toasted sesame oil and 2 tbsp rice vinegar (unseasoned, salt-free)',
          '1 tbsp fresh ginger root, finely grated',
        ],
        instructions: [
          'In a large bowl, combine shredded cabbage, grated carrots, and warm steamed edamame.',
          'In a small jar, shake together toasted sesame oil, rice vinegar, and grated ginger.',
          'Pour dressing over cabbage slaw and toss vigorously to coat.',
          'Top with crunchy toasted almonds and black sesame seeds before serving.',
        ],
        saltFreeSeasoningTips: 'Aromatic toasted sesame oil and fresh ginger create bold Asian flavor without soy sauce.',
        healthBenefit: 'Loaded with anthocyanin antioxidants and 14g clean plant protein.',
        emoji: '🥗',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
      {
        id: 'w2-rec-8',
        title: 'Warm Spiced Roasted Carrot & Turmeric Hummus with Pita',
        mealType: 'snack',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        sodiumMgPerServing: 30,
        caloriesPerServing: 170,
        description: 'Sweet roasted carrots blended with chickpeas, golden turmeric, tahini, and lemon juice for a smooth heart-healthy dip.',
        imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 can (15 oz) no-salt-added chickpeas, rinsed and drained',
          '3 medium carrots, roasted until caramelized',
          '2 tbsp pure sesame tahini',
          '1 tbsp lemon juice and 1 tsp ground turmeric',
          '2 cloves garlic, minced',
          'Celery and cucumber rounds for dipping',
        ],
        instructions: [
          'Roast sliced carrots at 400°F (200°C) for 20 minutes until tender.',
          'Place roasted carrots, chickpeas, tahini, lemon juice, garlic, and turmeric in food processor.',
          'Blend for 2 minutes until smooth and bright golden orange.',
          'Serve with crisp cucumber rounds and celery sticks.',
        ],
        saltFreeSeasoningTips: 'Caramelized roasted carrots add natural sweetness that pairs perfectly with earthy turmeric.',
        healthBenefit: 'Provides rich carotenoids and prebiotic fibers for gut and cardiovascular wellness.',
        emoji: '🥕',
        weekMenuTheme: 'Anti-Inflammatory Garden & Golden Roots',
        isWeeklySpecial: true,
      },
    ],
  },

  // --- WEEK 3: Nordic Whole Grain, Berries & Omega-3 Vitality ---
  {
    themeKey: 'nordic_vitality',
    title: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
    bannerEmoji: '🫐',
    description: 'Ancient farro, rye grains, wild berries, steamed broccolini, dill, and restorative omega-3 fatty acids for cognitive and cardiovascular vitality.',
    highlightNutrient: 'Rich in Beta-Glucans, Anthocyanins & Heart-Safe Omega-3s',
    recipes: [
      {
        id: 'w3-rec-1',
        title: 'Autumn Harvest Roasted Butternut Squash & Farro Salad',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        sodiumMgPerServing: 65,
        caloriesPerServing: 290,
        description: 'Caramelized roasted butternut squash tossed with nutty warm farro, toasted pecans, baby arugula, and aged balsamic drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '3 cups butternut squash, peeled and cubed',
          '1 cup whole grain pearled farro, rinsed',
          '3 cups fresh baby arugula or baby kale',
          '1/3 cup raw pecans, lightly toasted',
          '2 tbsp extra virgin olive oil and 2 tbsp aged balsamic vinegar',
          '1 tsp dried sage and 1 tsp ground cinnamon',
        ],
        instructions: [
          'Preheat oven to 400°F (200°C). Toss butternut squash with 1 tbsp olive oil, dried sage, and cinnamon.',
          'Roast for 25 minutes on a baking sheet until caramelized and tender.',
          'Cook farro in 3 cups water for 20 minutes until al dente; drain excess water.',
          'Combine warm farro, roasted squash, and baby arugula in a bowl.',
          'Drizzle with olive oil and aged balsamic vinegar; top with toasted pecans.',
        ],
        saltFreeSeasoningTips: 'Aged balsamic vinegar and toasted pecans give rich nutty sweetness without salt.',
        healthBenefit: 'High in potassium (620mg) and beta-carotene antioxidants for vascular flexibility.',
        emoji: '🥗',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-2',
        title: 'Nordic Creamy Wild Forest Mushroom & Thyme Soup',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        sodiumMgPerServing: 60,
        caloriesPerServing: 210,
        description: 'Earthy blend of cremini, shiitake, and chanterelle mushrooms simmered with fresh thyme, shallots, and blended white beans.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 lb mixed wild mushrooms (cremini, shiitake, oyster), sliced',
          '1 can (15 oz) no-salt-added white beans (for natural creamy texture)',
          '4 cups low-sodium vegetable broth',
          '2 shallots and 4 cloves garlic, minced',
          '1 tbsp fresh thyme leaves and 1 tsp dried tarragon',
          '2 tbsp extra virgin olive oil',
          '1 tbsp fresh lemon juice and cracked black pepper',
        ],
        instructions: [
          'In a soup pot, sauté sliced mushrooms and shallots in olive oil for 8 minutes until deep golden brown.',
          'Add minced garlic and fresh thyme; cook for 1 minute until aromatic.',
          'Add low-sodium vegetable broth and rinsed white beans; simmer for 15 minutes.',
          'Puree half of the soup with an immersion blender to create a rich, velvety texture while leaving rustic mushroom bites.',
          'Finish with lemon juice and cracked black pepper before serving warm.',
        ],
        saltFreeSeasoningTips: 'Caramelized wild mushrooms provide deep natural umami (glutamate) that completely replaces salt.',
        healthBenefit: 'Rich in immune-supporting beta-glucans and potassium for vascular protection.',
        emoji: '🍄',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-3',
        title: 'Oven-Roasted Arctic Char with Braised Leeks & Broccolini',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 2,
        sodiumMgPerServing: 85,
        caloriesPerServing: 420,
        description: 'Delicate Arctic char fillet roasted with fresh dill, caramelized braised leeks, and steamed garden broccolini.',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 Arctic char or wild salmon fillets (6 oz each)',
          '2 large leeks (white and pale green parts), thinly sliced',
          '1 bunch tender broccolini spears',
          '2 tbsp extra virgin olive oil',
          '1 lemon, zested and sliced into wedges',
          '2 tbsp fresh dill, chopped',
          'Cracked black pepper',
        ],
        instructions: [
          'In a skillet, braise sliced leeks in 1 tbsp olive oil and 2 tbsp water over low heat for 10 minutes until meltingly sweet.',
          'Preheat oven to 400°F (200°C). Season char fillets with olive oil, lemon zest, dill, and black pepper.',
          'Roast char fillets on a baking sheet for 12-14 minutes until flaky.',
          'Steam broccolini for 4 minutes until bright green and tender.',
          'Serve fish over sweet braised leeks with broccolini on the side.',
        ],
        saltFreeSeasoningTips: 'Sweet braised leeks and fresh dill provide herbal complexity without salt.',
        healthBenefit: 'High in anti-inflammatory EPA and DHA omega-3 fatty acids for memory and cardiovascular health.',
        emoji: '🐟',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-4',
        title: 'Nordic Overnight Oats with Lingonberry Compote & Seeds',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 280,
        description: 'Chilled oats soaked in almond milk, layered with tart berry compote, pumpkin seeds, and hemp hearts.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup rolled whole oats',
          '1.5 cups unsweetened almond milk',
          '1 cup wild berries or lingonberry/cranberry compote (unsweetened)',
          '2 tbsp chia seeds and 2 tbsp raw pumpkin seeds',
          '1 tbsp hemp hearts and 1/2 tsp vanilla extract',
        ],
        instructions: [
          'In a mason jar, combine rolled oats, chia seeds, vanilla, and almond milk.',
          'Stir well, cover, and refrigerate overnight (or at least 4 hours).',
          'In the morning, top with berry compote, pumpkin seeds, and hemp hearts.',
          'Enjoy chilled as an energizing, fiber-rich breakfast.',
        ],
        saltFreeSeasoningTips: 'Tart wild berries and nutty pumpkin seeds give bright morning flavor.',
        healthBenefit: 'Soluble oats and omega seeds support healthy cholesterol elimination.',
        emoji: '🫐',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-5',
        title: 'Hearty Green Split Pea Stew with Carrots & Fresh Dill',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 35,
        servings: 4,
        sodiumMgPerServing: 50,
        caloriesPerServing: 260,
        description: 'Slow-simmered green split peas with sweet carrots, celery, bay leaves, and aromatic fresh dill.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups dry green split peas, rinsed',
          '5 cups low-sodium vegetable broth or water',
          '3 sweet carrots and 2 celery ribs, diced',
          '1 yellow onion and 3 cloves garlic, minced',
          '2 bay leaves and 1 tbsp fresh dill, chopped',
          '1 tbsp olive oil and cracked black pepper',
        ],
        instructions: [
          'Sauté onion, carrots, and celery in olive oil for 5 minutes in a Dutch oven.',
          'Add garlic, split peas, vegetable broth, and bay leaves.',
          'Bring to a boil, then reduce heat to low, cover, and simmer for 35 minutes until split peas are tender and thick.',
          'Remove bay leaves. Stir in fresh chopped dill and cracked black pepper before serving warm.',
        ],
        saltFreeSeasoningTips: 'Sweet carrots, celery mirepoix, and fresh dill create traditional hearth comfort with zero sodium.',
        healthBenefit: 'Provides 16g plant protein and 14g prebiotic fiber per bowl.',
        emoji: '🍲',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-6',
        title: 'Wild Blackberry, Baby Spinach & Flax Omega-3 Smoothie',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 20,
        caloriesPerServing: 175,
        description: 'Deep purple antioxidant powerhouse blending wild blackberries, baby spinach, golden flaxseed, and banana.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups fresh or frozen wild blackberries',
          '2 cups fresh baby spinach',
          '1 banana',
          '1.5 cups cold almond milk',
          '2 tbsp ground golden flaxseed',
        ],
        instructions: [
          'Add blackberries, spinach, banana, and flaxseed into blender.',
          'Pour in almond milk.',
          'Blend on high for 60 seconds until smooth and velvety.',
          'Serve chilled.',
        ],
        saltFreeSeasoningTips: 'Blackberries provide natural sweet-tart flavor with zero added sugar.',
        healthBenefit: 'High in anthocyanin polyphenols for brain microcirculation and arterial wellness.',
        emoji: '🍇',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-7',
        title: 'Warm Roasted Root Veggies with Lemon Mustard Quinoa',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 3,
        sodiumMgPerServing: 55,
        caloriesPerServing: 310,
        description: 'Roasted parsnips, golden beets, and carrots served over fluffy quinoa with whole grain mustard lemon vinaigrette.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 parsnips and 2 golden beets, peeled and diced',
          '2 carrots, sliced into coins',
          '1.5 cups cooked quinoa',
          '1.5 tbsp extra virgin olive oil',
          '1 tbsp whole grain stoneground mustard (low sodium)',
          '1 tbsp lemon juice and fresh cracked pepper',
        ],
        instructions: [
          'Roast parsnips, beets, and carrots at 400°F (200°C) for 25 minutes until golden.',
          'Whisk stoneground mustard, lemon juice, and olive oil for the dressing.',
          'Toss warm roasted vegetables and quinoa together in a bowl.',
          'Drizzle with vinaigrette and serve warm.',
        ],
        saltFreeSeasoningTips: 'Zesty stoneground mustard and caramelized roasted parsnips deliver robust flavor without salt.',
        healthBenefit: 'Packed with 780mg potassium and prebiotic inulin for digestive harmony.',
        emoji: '🥗',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
      {
        id: 'w3-rec-8',
        title: 'Crisp Seeded Nordic Rye Crackers with Unsalted Herb Ricotta',
        mealType: 'snack',
        dietaryTags: ['low_sodium', 'vegetarian', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 3,
        sodiumMgPerServing: 40,
        caloriesPerServing: 160,
        description: 'Crunchy whole grain rye crispbreads topped with whipped unsalted ricotta, fresh chives, dill, and cucumber slices.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '6 whole grain rye crispbreads (no-salt-added)',
          '1/2 cup part-skim unsalted ricotta cheese',
          '1 tbsp fresh dill and 1 tbsp fresh chives, minced',
          '1 English cucumber, thinly sliced into ribbons',
          'Cracked black pepper and lemon zest',
        ],
        instructions: [
          'In a small bowl, whip ricotta with minced dill, chives, lemon zest, and black pepper.',
          'Spread whipped herb ricotta generously onto rye crispbreads.',
          'Layer crisp cucumber ribbons over top and dust with extra cracked pepper.',
        ],
        saltFreeSeasoningTips: 'Fresh chives, dill, and lemon zest give clean savory richness to the ricotta.',
        healthBenefit: 'Whole grain rye fiber supports steady satiety and healthy insulin sensitivity.',
        emoji: '🧀',
        weekMenuTheme: 'Nordic Whole Grain, Berries & Omega-3 Vitality',
        isWeeklySpecial: true,
      },
    ],
  },

  // --- WEEK 4: Californian Sunshine & Coastal Fresh Harvest ---
  {
    themeKey: 'californian_sunshine',
    title: 'Californian Sunshine & Coastal Fresh Harvest',
    bannerEmoji: '🍋',
    description: 'Fresh California citrus, creamy Hass avocado, sweet corn, cilantro, heirloom legumes, and light grilled proteins.',
    highlightNutrient: 'Rich in Vitamin C, Monounsaturated Healthy Fats & Plant Flavonoids',
    recipes: [
      {
        id: 'w4-rec-1',
        title: 'Californian Avocado, Mango & Black Bean Superfood Salad',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 0,
        servings: 3,
        sodiumMgPerServing: 40,
        caloriesPerServing: 310,
        description: 'Vibrant coastal salad with ripe Hass avocado cubes, sweet mango, no-salt black beans, red bell pepper, and cilantro lime dressing.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 large ripe Hass avocado, cubed',
          '1 ripe mango, peeled and diced',
          '1 can (15 oz) no-salt-added black beans, rinsed and drained',
          '1 red bell pepper, diced',
          '1/2 red onion, finely diced',
          '1/2 cup fresh cilantro leaves, chopped',
          '2 tbsp extra virgin olive oil and 2 tbsp fresh lime juice',
          '1/2 tsp ground cumin and cracked black pepper',
        ],
        instructions: [
          'In a large salad bowl, combine rinsed black beans, diced mango, red bell pepper, and red onion.',
          'Add cubed avocado and chopped cilantro.',
          'Whisk lime juice, olive oil, and cumin together in a small cup.',
          'Pour dressing over salad and toss gently so avocado stays intact. Serve chilled or room temperature.',
        ],
        saltFreeSeasoningTips: 'Sweet juicy mango and tangy lime juice replace the need for any salt.',
        vegetarianSwapTip: 'Black beans and avocado provide 11g of plant protein and 14g of gut-friendly fiber.',
        healthBenefit: 'Provides 820mg natural potassium to help counteract dietary sodium.',
        emoji: '🥑',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-2',
        title: 'Citrus Herb Grilled Salmon with Fresh Tomato Basil Tartare',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 85,
        caloriesPerServing: 430,
        description: 'Wild salmon fillet pan-grilled in orange and lime marinade, topped with garden tomato basil relish and served with brown rice.',
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 wild salmon fillets (6 oz each)',
          '2 heirloom tomatoes, seeded and diced',
          '1/4 cup fresh basil leaves, chiffonade',
          '2 cloves garlic, minced',
          '2 tbsp fresh orange juice and 1 tbsp lime juice',
          '2 tbsp extra virgin olive oil',
          'Cracked black pepper',
        ],
        instructions: [
          'Toss diced tomatoes, fresh basil, garlic, 1 tbsp olive oil, and black pepper for the topping.',
          'Brush salmon fillets with remaining olive oil, orange juice, and lime juice.',
          'Pan-sear salmon in a hot skillet for 4-5 minutes per side until golden.',
          'Top hot grilled salmon with fresh heirloom tomato basil tartare and serve with steamed brown rice.',
        ],
        saltFreeSeasoningTips: 'Sweet orange juice and aromatic fresh basil highlight the rich salmon flavor without salt.',
        healthBenefit: 'Abundant in cardio-protective Omega-3s and lycopene for arterial health.',
        emoji: '🐟',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-3',
        title: 'Meyer Lemon Zest & Chia Seed Berry Pudding',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 220,
        description: 'Velvety chia pudding soaked in almond milk, infused with fragrant Meyer lemon zest, raspberries, and toasted pistachios.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1/3 cup chia seeds',
          '1.5 cups unsweetened almond milk',
          '1 Meyer lemon, zested and juiced (1 tbsp)',
          '1 cup fresh raspberries or strawberries',
          '2 tbsp raw pistachios, chopped',
          '1 tbsp pure maple syrup',
        ],
        instructions: [
          'In a bowl, whisk chia seeds, almond milk, lemon juice, lemon zest, and maple syrup.',
          'Let sit for 10 minutes, whisk again to prevent clumps, then cover and chill for 2 hours.',
          'Spoon into glass parfaits, layering with fresh raspberries.',
          'Top with chopped vibrant green pistachios before serving.',
        ],
        saltFreeSeasoningTips: 'Meyer lemon zest gives floral citrus aroma with zero salt or heavy cream.',
        healthBenefit: 'Packed with 8g soluble fiber and plant-based ALA omega-3s for vascular elasticity.',
        emoji: '🍋',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-4',
        title: 'Sweet Corn, Roasted Poblano & Black Bean Summer Chowder',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        sodiumMgPerServing: 60,
        caloriesPerServing: 230,
        description: 'Golden sweet corn blended with mild roasted poblano peppers, no-salt black beans, cumin, and fresh cilantro.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '4 ears fresh sweet corn (kernels cut off cob) or 4 cups frozen corn',
          '1 poblano pepper, roasted, peeled, and diced',
          '1 can (15 oz) no-salt-added black beans, rinsed',
          '4 cups low-sodium vegetable broth',
          '1 yellow onion and 3 cloves garlic, diced',
          '1 tbsp olive oil, 1 tsp ground cumin, and fresh cilantro',
        ],
        instructions: [
          'Sauté onion and garlic in olive oil for 5 minutes; add cumin and sweet corn.',
          'Add vegetable broth and simmer for 15 minutes.',
          'Blend 2 cups of the corn mixture in a blender until smooth and creamy, then pour back into pot.',
          'Stir in diced roasted poblano pepper and black beans; heat through for 5 minutes.',
          'Garnish with fresh cilantro and lime wedges.',
        ],
        saltFreeSeasoningTips: 'Blended sweet corn creates natural creaminess without cream or salt.',
        healthBenefit: 'Rich in lutein and zeaxanthin for vision and antioxidant arterial defense.',
        emoji: '🌽',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-5',
        title: 'Zucchini Ribbon & Cherry Tomato Pasta with Pine Nut Pesto',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 10,
        servings: 3,
        sodiumMgPerServing: 35,
        caloriesPerServing: 320,
        description: 'Tender whole grain pasta tossed with fresh zucchini ribbons, sweet blistered cherry tomatoes, and salt-free basil pine nut pesto.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '8 oz whole wheat penne or spaghetti',
          '2 medium zucchini, shaved into wide ribbons with a peeler',
          '2 cups sweet cherry tomatoes',
          '2 cups fresh basil leaves',
          '1/4 cup raw pine nuts or walnuts',
          '3 tbsp extra virgin olive oil',
          '3 cloves garlic and 2 tbsp nutritional yeast',
        ],
        instructions: [
          'Blend fresh basil, pine nuts, garlic, nutritional yeast, and olive oil into a fragrant pesto.',
          'Cook whole grain pasta al dente; add zucchini ribbons during the last 30 seconds of boiling, then drain.',
          'In a skillet, blister cherry tomatoes in 1 tsp olive oil until skins pop.',
          'Toss warm pasta and zucchini ribbons with pesto and blistered tomatoes.',
        ],
        saltFreeSeasoningTips: 'Nutritional yeast and toasted pine nuts provide rich parmesan-like umami with 0mg sodium.',
        healthBenefit: 'Low glycemic whole grains combined with lycopene and heart-safe fats.',
        emoji: '🍝',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-6',
        title: 'California Citrus, Ginger & Carrot Immunity Juice',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 30,
        caloriesPerServing: 130,
        description: 'Sparkling fresh blend of California oranges, sweet carrots, fresh ginger, and Meyer lemon.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 navel oranges, peeled',
          '2 medium sweet carrots, washed and chopped',
          '1/2 inch fresh ginger root',
          '1/2 Meyer lemon, peeled',
          '1 cup cold water or coconut water',
        ],
        instructions: [
          'Blend oranges, carrots, ginger, lemon, and cold water in high-speed blender.',
          'Blend on high for 90 seconds until thoroughly liquefied.',
          'Pour into chilled glasses over ice and enjoy fresh.',
        ],
        saltFreeSeasoningTips: 'Zesty ginger and sweet California oranges deliver invigorating flavor with zero additives.',
        healthBenefit: 'Full of Vitamin C and beta-carotene for immune and endothelial support.',
        emoji: '🥕',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-7',
        title: 'Warm Mediterranean Chickpea & Sun-Dried Tomato Farro Bowl',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 3,
        sodiumMgPerServing: 55,
        caloriesPerServing: 330,
        description: 'Nutty farro grain tossed with chickpeas, sun-dried tomatoes (unsalted), baby kale, and oregano dressing.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup whole farro, cooked in 3 cups water',
          '1 can (15 oz) no-salt-added chickpeas, rinsed',
          '1/3 cup oil-packed sun-dried tomatoes (low sodium), sliced',
          '2 cups baby kale or spinach',
          '2 tbsp extra virgin olive oil and 1 tbsp lemon juice',
          '1 tsp dried oregano and cracked black pepper',
        ],
        instructions: [
          'In a large skillet, warm olive oil over medium heat; sauté chickpeas and sun-dried tomatoes for 3 minutes.',
          'Add baby kale and cook for 2 minutes until wilted.',
          'Stir in warm cooked farro, lemon juice, dried oregano, and black pepper.',
          'Divide into bowls and enjoy warm.',
        ],
        saltFreeSeasoningTips: 'Sun-dried tomatoes provide intense savory richness without added salt.',
        healthBenefit: 'High dietary fiber and potassium promote smooth digestion and blood pressure regulation.',
        emoji: '🥗',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
      {
        id: 'w4-rec-8',
        title: 'Crispy Roasted Garbanzo Poppers with Smoked Paprika & Lime',
        mealType: 'snack',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 30,
        servings: 4,
        sodiumMgPerServing: 25,
        caloriesPerServing: 140,
        description: 'Crunchy oven-roasted chickpeas dusted with Spanish smoked paprika, garlic powder, and fresh lime zest.',
        imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added chickpeas, rinsed and dried thoroughly with a towel',
          '1.5 tbsp extra virgin olive oil',
          '1 tsp smoked paprika, 1 tsp garlic powder, and 1/2 tsp ground cumin',
          'Zest of 1 fresh lime',
        ],
        instructions: [
          'Preheat oven to 400°F (200°C). Dry chickpeas thoroughly on paper towels so they get crispy.',
          'Toss chickpeas with olive oil, smoked paprika, garlic powder, and cumin.',
          'Spread onto baking sheet and roast for 30 minutes, shaking pan halfway, until crispy and golden.',
          'Toss with fresh lime zest and let cool for 5 minutes before snacking.',
        ],
        saltFreeSeasoningTips: 'Smoky Spanish paprika and zesty lime replace potato chips with a crunch.',
        healthBenefit: 'Low-sodium protein crunch with 6g fiber to satisfy afternoon cravings.',
        emoji: '🍿',
        weekMenuTheme: 'Californian Sunshine & Coastal Fresh Harvest',
        isWeeklySpecial: true,
      },
    ],
  },

  // --- WEEK 5: Tuscan Rustic Harvest & Slow-Simmered Legumes ---
  {
    themeKey: 'tuscan_harvest',
    title: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
    bannerEmoji: '🫘',
    description: 'White cannellini beans, slow-simmered San Marzano tomatoes, fresh rosemary sprigs, Tuscan ribollita greens, and whole grains.',
    highlightNutrient: 'Rich in Dietary Fiber, Magnesium, Potassium & Plant Protein',
    recipes: [
      {
        id: 'w5-rec-1',
        title: 'Slow-Simmered Tuscan Ribollita Stew with Kale & White Beans',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        sodiumMgPerServing: 70,
        caloriesPerServing: 260,
        description: 'Classic rustic Tuscan country stew packed with tender Lacinato kale, white beans, sweet carrots, celery, and rosemary.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added Cannellini beans, rinsed',
          '1 bunch Lacinato (dinosaur) kale, ribs removed and chopped',
          '1 can (14 oz) no-salt-added crushed San Marzano tomatoes',
          '4 cups low-sodium vegetable broth',
          '2 carrots, 2 celery ribs, and 1 onion, diced',
          '4 cloves garlic, minced',
          '1 tbsp fresh rosemary, minced and 1 tsp dried oregano',
          '2 tbsp extra virgin olive oil and cracked black pepper',
        ],
        instructions: [
          'Sauté onion, carrots, and celery in olive oil for 6 minutes in a Dutch oven.',
          'Add garlic, rosemary, and oregano; stir for 1 minute.',
          'Add crushed tomatoes, vegetable broth, and Cannellini beans. Simmer for 20 minutes.',
          'Mash 1/3 of the beans to create a rich rustic broth.',
          'Add chopped Lacinato kale and simmer for 5 more minutes until tender. Serve hot.',
        ],
        saltFreeSeasoningTips: 'Rich San Marzano tomatoes and fragrant rosemary create deep broth savoriness without salt.',
        healthBenefit: 'Provides 850mg potassium and 13g dietary fiber to support vascular health.',
        emoji: '🍲',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-2',
        title: 'Velvety Roasted Tomato & Fresh Basil Bisque (Dairy-Free)',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
        servings: 4,
        sodiumMgPerServing: 50,
        caloriesPerServing: 170,
        description: 'Sweet oven-roasted plum tomatoes blended with garlic, fresh basil, and white beans for a rich creamy texture with zero cream.',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '3 lbs fresh plum tomatoes, halved',
          '1 can (15 oz) no-salt-added white beans (creamy base)',
          '1 cup fresh basil leaves',
          '4 cloves garlic, unpeeled',
          '3 cups low-sodium vegetable broth',
          '2 tbsp extra virgin olive oil and cracked black pepper',
        ],
        instructions: [
          'Roast halved tomatoes and garlic cloves on a baking sheet at 400°F (200°C) for 25 minutes until caramelized.',
          'Squeeze roasted garlic out of skins into a pot with roasted tomatoes, white beans, and broth.',
          'Simmer for 10 minutes, then add fresh basil leaves.',
          'Puree with an immersion blender until completely smooth and velvety.',
          'Serve warm with a drizzle of olive oil and fresh cracked pepper.',
        ],
        saltFreeSeasoningTips: 'Caramelizing tomatoes concentrates natural sweetness that replaces salt.',
        healthBenefit: 'High in bioavailable lycopene for heart and prostate wellness.',
        emoji: '🍅',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-3',
        title: 'Herb-Crusted Baked Eggplant with Lentil Marinara',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 20,
        cookTimeMinutes: 25,
        servings: 3,
        sodiumMgPerServing: 65,
        caloriesPerServing: 280,
        description: 'Crispy herb-baked eggplant cutlets layered with rich lentil marinara sauce and nutritional yeast.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 medium eggplants, sliced into 1/2-inch rounds',
          '1 cup whole wheat breadcrumbs (no-salt-added)',
          '1.5 cups cooked brown lentils',
          '2 cups no-salt-added tomato basil sauce',
          '2 tbsp nutritional yeast and 1 tbsp Italian herbs',
          '2 tbsp olive oil and cracked black pepper',
        ],
        instructions: [
          'Dip eggplant rounds in light olive oil and coat with whole wheat breadcrumbs and Italian herbs.',
          'Bake at 400°F (200°C) for 20 minutes until golden and crisp.',
          'In a pan, warm tomato sauce and cooked lentils together.',
          'Spoon lentil marinara over hot baked eggplant cutlets and dust with nutritional yeast.',
        ],
        saltFreeSeasoningTips: 'Nutritional yeast and aromatic Italian herbs provide satisfying savory depth.',
        healthBenefit: 'Eggplant skin is packed with nasunin, a powerful antioxidant that protects brain cell membranes.',
        emoji: '🍆',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-4',
        title: 'Warm Spiced Apple & Walnut Steel-Cut Oatmeal',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 15,
        caloriesPerServing: 270,
        description: 'Slow-cooked steel cut oats simmered with diced sweet apples, cinnamon, nutmeg, and crunchy walnuts.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup steel-cut oats',
          '2.5 cups unsweetened almond milk',
          '1 large Fuji or Honeycrisp apple, diced',
          '1/3 cup raw walnuts, chopped',
          '1 tsp ground cinnamon and 1/4 tsp ground nutmeg',
          '1 tbsp ground flaxseed',
        ],
        instructions: [
          'Simmer steel-cut oats, diced apple, cinnamon, and nutmeg in almond milk for 15 minutes.',
          'Stir in ground flaxseed; let rest for 2 minutes off heat.',
          'Spoon into warm bowls and top with chopped walnuts.',
        ],
        saltFreeSeasoningTips: 'Naturally sweet cooked apples and cinnamon make sugar and salt unnecessary.',
        healthBenefit: 'Beta-glucan oats and omega-3 walnuts promote clean arterial blood flow.',
        emoji: '🍎',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-5',
        title: 'Creamy Strawberry Banana & Hemp Seed Heart Smoothie',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 20,
        caloriesPerServing: 190,
        description: 'Classic sweet strawberry and banana smoothie boosted with hemp hearts for clean plant protein.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1.5 cups fresh or frozen ripe strawberries',
          '1 banana',
          '1.5 cups cold unsweetened almond milk',
          '2 tbsp organic hemp hearts',
          '1/2 tsp vanilla extract',
        ],
        instructions: [
          'Combine strawberries, banana, almond milk, hemp hearts, and vanilla in blender.',
          'Blend on high for 60 seconds until creamy and frothy.',
          'Serve chilled in tall glasses.',
        ],
        saltFreeSeasoningTips: 'Ripe bananas and strawberries provide natural fruit sweetness without added syrup.',
        healthBenefit: 'Hemp seeds provide complete plant protein with zero saturated fat.',
        emoji: '🍓',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-6',
        title: 'Tuscan White Bean, Roasted Pepper & Garlic Bruschetta Bowl',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        servings: 3,
        sodiumMgPerServing: 45,
        caloriesPerServing: 290,
        description: 'Tender Cannellini beans tossed with fire-roasted red peppers, sweet basil, garlic, and extra virgin olive oil.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 cans (15 oz) no-salt-added Cannellini beans, rinsed',
          '1 cup roasted red bell peppers (low sodium), diced',
          '1/2 cup fresh basil leaves, torn',
          '2 cloves garlic, finely minced',
          '2 tbsp extra virgin olive oil and 1 tbsp red wine vinegar',
          'Cracked black pepper',
        ],
        instructions: [
          'In a salad bowl, combine rinsed white beans, roasted red peppers, and minced garlic.',
          'Whisk olive oil, red wine vinegar, and black pepper together.',
          'Pour over beans and toss with fresh torn basil.',
          'Serve room temperature with toasted whole grain sourdough.',
        ],
        saltFreeSeasoningTips: 'Sweet roasted peppers and fresh basil provide robust Mediterranean flavor.',
        healthBenefit: 'High in potassium and plant-based protein with zero cholesterol.',
        emoji: '🥗',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-7',
        title: 'Roasted Fennel, Blood Orange & Baby Arugula Salad',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 3,
        sodiumMgPerServing: 40,
        caloriesPerServing: 210,
        description: 'Caramelized roasted fennel wedges paired with sweet blood orange wheels, peppery arugula, and pomegranate seeds.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '2 fennel bulbs, sliced into 1/2-inch wedges (fronds reserved for garnish)',
          '2 blood oranges or navel oranges, peeled and sliced into rounds',
          '3 cups fresh baby arugula',
          '1/4 cup fresh pomegranate arils',
          '2 tbsp extra virgin olive oil and 1 tbsp orange juice',
        ],
        instructions: [
          'Roast fennel wedges in 1 tbsp olive oil at 400°F (200°C) for 20 minutes until caramelized and sweet.',
          'Arrange baby arugula on a platter and top with warm roasted fennel and fresh orange rounds.',
          'Scatter pomegranate seeds and reserved feathery fennel fronds over top.',
          'Drizzle with remaining olive oil and orange juice.',
        ],
        saltFreeSeasoningTips: 'Sweet roasted fennel and juicy blood oranges create a naturally balanced sweet-savory finish.',
        healthBenefit: 'Fennel is a natural mild diuretic that assists kidney sodium excretion.',
        emoji: '🥗',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
      {
        id: 'w5-rec-8',
        title: 'Steamed French Beans & Garlic Herb Sautéed Lentils',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 3,
        sodiumMgPerServing: 50,
        caloriesPerServing: 240,
        description: 'Crisp steamed French green beans tossed with warm garlic brown lentils, toasted slivered almonds, and lemon.',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 lb fresh French green beans (haricots verts), trimmed',
          '1.5 cups cooked brown lentils',
          '3 cloves garlic, thinly sliced',
          '1/4 cup toasted slivered almonds',
          '1.5 tbsp extra virgin olive oil and 1 tbsp lemon juice',
          'Cracked black pepper',
        ],
        instructions: [
          'Steam green beans for 4 minutes until tender-crisp; plunge in cold water to preserve bright green color.',
          'In a skillet, warm olive oil; sauté sliced garlic for 1 minute until golden.',
          'Add warm cooked lentils and steamed green beans; toss for 2 minutes to heat through.',
          'Finish with lemon juice, toasted almonds, and cracked black pepper before serving.',
        ],
        saltFreeSeasoningTips: 'Golden toasted garlic and crunchy almonds give gourmet restaurant richness without salt.',
        healthBenefit: 'Low calorie, nutrient-dense green powerhouse rich in folate and potassium.',
        emoji: '🫘',
        weekMenuTheme: 'Tuscan Rustic Harvest & Slow-Simmered Legumes',
        isWeeklySpecial: true,
      },
    ],
  },

  // --- WEEK 6: Asian Garden & Gentle Ginger-Shiitake Nourishment ---
  {
    themeKey: 'asian_ginger_nourishment',
    title: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
    bannerEmoji: '🥢',
    description: 'Fragrant shiitake kombu dashi broths, grated ginger root, 100% buckwheat soba, steamed baby bok choy, and soothing silken tofu.',
    highlightNutrient: 'Rich in Beta-Glucans, Plant Isoflavones, Potassium & Zero Added Salt',
    recipes: [
      {
        id: 'w6-rec-1',
        title: 'Steamed Silken Tofu & Shiitake in Ginger Kombu Broth',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 55,
        caloriesPerServing: 210,
        description: 'Gentle Japanese-style hotpot with soft organic silken tofu, fresh shiitake mushrooms, baby bok choy, and fragrant ginger dashi.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 block (14 oz) organic silken tofu, cubed',
          '8 fresh shiitake mushrooms, sliced',
          '2 baby bok choy, halved lengthwise',
          '3 cups water with 1 piece dried kombu seaweed (unsalted broth)',
          '1 tbsp fresh ginger root, finely julienned',
          '2 scallions, thinly sliced',
          '1 tsp toasted sesame oil',
        ],
        instructions: [
          'Simmer kombu and sliced ginger in 3 cups water for 10 minutes to make fresh gentle dashi; remove kombu.',
          'Add sliced shiitake mushrooms and simmer for 5 minutes.',
          'Gently slide in cubed silken tofu and baby bok choy; simmer for 3 minutes until warmed through.',
          'Ladle tofu, mushrooms, and greens into deep ceramic bowls.',
          'Drizzle with a drop of toasted sesame oil and garnish with scallions.',
        ],
        saltFreeSeasoningTips: 'Kombu seaweed and shiitake mushrooms provide natural savory glutamates without added sodium.',
        healthBenefit: 'Extremely gentle on digestion, cardio-protective and naturally anti-inflammatory.',
        emoji: '🍲',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-2',
        title: 'Buckwheat Soba Noodle Bowl with Edamame & Sesame Dressing',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        servings: 2,
        sodiumMgPerServing: 45,
        caloriesPerServing: 320,
        description: 'Chilled 100% buckwheat soba noodles tossed with shelled edamame, cucumber, grated carrot, and toasted sesame ginger vinaigrette.',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '6 oz 100% buckwheat soba noodles (no-salt-added)',
          '1 cup shelled organic edamame, steamed',
          '1 Japanese cucumber, thinly sliced',
          '1 carrot, grated into ribbons',
          '1.5 tbsp toasted sesame oil and 2 tbsp rice vinegar',
          '1 tbsp fresh ginger, grated and 1 tbsp toasted sesame seeds',
        ],
        instructions: [
          'Cook soba noodles in boiling water for 6 minutes; drain and immediately rinse under cold running water to remove starch.',
          'In a bowl, whisk toasted sesame oil, rice vinegar, and grated ginger.',
          'Toss chilled soba noodles, steamed edamame, cucumber, and carrots with dressing.',
          'Garnish with toasted sesame seeds and scallions.',
        ],
        saltFreeSeasoningTips: 'Nutty toasted sesame oil and crisp ginger give authentic Japanese flavor without soy sauce.',
        healthBenefit: 'Buckwheat contains rutin, an antioxidant that strengthens capillary walls and improves circulation.',
        emoji: '🥢',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-3',
        title: 'Savory Ginger & Scallion Steel-Cut Oat Congee',
        mealType: 'breakfast',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 20,
        servings: 2,
        sodiumMgPerServing: 25,
        caloriesPerServing: 230,
        description: 'Comforting savory morning congee made from slow-cooked oats, fresh ginger, shiitake mushrooms, and baby greens.',
        imageUrl: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 cup steel-cut oats',
          '4 cups low-sodium vegetable broth or water',
          '1 tbsp fresh ginger root, finely grated',
          '4 fresh shiitake mushrooms, finely diced',
          '1 cup baby spinach',
          '2 scallions, sliced and 1 tsp toasted sesame oil',
        ],
        instructions: [
          'In a saucepan, combine oats, vegetable broth, grated ginger, and diced mushrooms.',
          'Simmer on low heat for 20 minutes, stirring occasionally, until velvety and porridge-like.',
          'Fold in baby spinach for 1 minute until wilted.',
          'Spoon into bowls; drizzle with sesame oil and top with sliced scallions and white pepper.',
        ],
        saltFreeSeasoningTips: 'Warming ginger and white pepper provide hearty savory warmth with zero salt.',
        healthBenefit: 'Soothes gastrointestinal lining and promotes steady all-morning blood glucose.',
        emoji: '🥣',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-4',
        title: 'Golden Kabocha Pumpkin & Coconut Ginger Velouté',
        mealType: 'soup',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        sodiumMgPerServing: 45,
        caloriesPerServing: 190,
        description: 'Sweet Japanese Kabocha pumpkin simmered in light coconut milk, fresh lemongrass, and ginger root.',
        imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 medium Kabocha pumpkin (or butternut squash), peeled, seeded, and cubed',
          '1 can (13.5 oz) light coconut milk',
          '3 cups low-sodium vegetable broth',
          '1 tbsp fresh ginger root, grated',
          '1 stalk lemongrass, bruised (or 1 tsp lemon zest)',
          '1/2 tsp ground turmeric and fresh cilantro for garnish',
        ],
        instructions: [
          'In a soup pot, combine cubed pumpkin, vegetable broth, coconut milk, ginger, and lemongrass.',
          'Simmer for 20 minutes until pumpkin is fork-tender.',
          'Remove lemongrass stalk; blend soup with an immersion blender until velvety smooth.',
          'Ladle into warm bowls and garnish with fresh cilantro.',
        ],
        saltFreeSeasoningTips: 'Naturally rich, sweet Kabocha squash requires zero sodium or added sweeteners.',
        healthBenefit: 'High in carotenoids and potassium to support arterial wall relaxation.',
        emoji: '🥣',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-5',
        title: 'Mild Turmeric Vegetable & Chickpea Coconut Curry',
        mealType: 'dinner',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 4,
        sodiumMgPerServing: 65,
        caloriesPerServing: 310,
        description: 'Fragrant golden curry with chickpeas, cauliflower florets, sweet peas, and spinach simmered in coconut turmeric sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 can (15 oz) no-salt-added chickpeas, rinsed',
          '2 cups cauliflower florets',
          '1 cup sweet green peas',
          '2 cups baby spinach',
          '1 can (13.5 oz) light coconut milk and 1 cup water',
          '1 tbsp mild yellow curry powder (salt-free) and 1 tsp ground turmeric',
          '3 cloves garlic and 1 tbsp ginger, minced',
        ],
        instructions: [
          'Sauté garlic and ginger in 1 tbsp olive oil for 1 minute; add curry powder and turmeric to toast.',
          'Add coconut milk, water, cauliflower, and chickpeas; simmer for 15 minutes.',
          'Stir in sweet peas and baby spinach for 3 minutes.',
          'Serve hot over steamed brown jasmine rice.',
        ],
        saltFreeSeasoningTips: 'Fragrant curry spices, ginger, and sweet coconut milk provide savory richness without salt.',
        healthBenefit: 'Potent anti-inflammatory benefits with over 750mg potassium per serving.',
        emoji: '🍛',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-6',
        title: 'Matcha Green Tea & Baby Spinach Vitality Smoothie',
        mealType: 'smoothie',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        sodiumMgPerServing: 20,
        caloriesPerServing: 160,
        description: 'Ceremonial matcha green tea blended with fresh baby spinach, banana, and chilled unsweetened almond milk.',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 tsp ceremonial grade Japanese matcha green tea powder',
          '2 cups fresh baby spinach',
          '1 ripe banana',
          '1.5 cups cold unsweetened almond milk',
          '1 tbsp chia seeds',
        ],
        instructions: [
          'Add matcha powder, baby spinach, banana, chia seeds, and almond milk to blender.',
          'Blend on high for 60 seconds until bright green and smooth.',
          'Pour into chilled glasses and enjoy as a clean morning antioxidant lift.',
        ],
        saltFreeSeasoningTips: 'EGCG in matcha provides clean energy without caffeine spikes or added sodium.',
        healthBenefit: 'High in EGCG catechins that protect blood vessels against oxidative stress.',
        emoji: '🍵',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-7',
        title: 'Steamed Baby Bok Choy & Garlic Quinoa Power Bowl',
        mealType: 'lunch',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        sodiumMgPerServing: 40,
        caloriesPerServing: 280,
        description: 'Tender steamed baby bok choy and organic edamame served over warm garlic quinoa with a sesame drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '4 baby bok choy, halved',
          '1 cup tri-color quinoa, cooked',
          '1 cup shelled organic edamame',
          '2 cloves garlic, minced',
          '1 tbsp toasted sesame oil and 1 tbsp lemon juice',
          'Toasted sesame seeds',
        ],
        instructions: [
          'Steam baby bok choy and edamame for 4 minutes until vibrant green and tender.',
          'Toss warm quinoa with minced garlic, lemon juice, and sesame oil.',
          'Arrange bok choy and edamame on top of quinoa.',
          'Sprinkle with toasted sesame seeds before serving.',
        ],
        saltFreeSeasoningTips: 'Toasted sesame seeds and fresh garlic provide nutty savoriness.',
        healthBenefit: 'Packed with calcium, Vitamin K, and natural potassium for bone and vascular health.',
        emoji: '🥗',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
      {
        id: 'w6-rec-8',
        title: 'Warm Steamed Edamame in the Pod with Lemon & Black Pepper',
        mealType: 'snack',
        dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
        prepTimeMinutes: 3,
        cookTimeMinutes: 5,
        servings: 3,
        sodiumMgPerServing: 15,
        caloriesPerServing: 120,
        description: 'Fresh organic whole edamame pods steamed hot and tossed with lemon zest and freshly cracked black pepper.',
        imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        ingredients: [
          '1 lb fresh or frozen whole edamame pods',
          '1 fresh lemon, zested and juiced',
          '1/2 tsp freshly cracked black pepper',
          '1/2 tsp toasted sesame oil (optional)',
        ],
        instructions: [
          'Steam edamame pods for 5 minutes until piping hot.',
          'Transfer to a serving bowl; toss immediately with lemon juice, lemon zest, and cracked black pepper.',
          'Pop tender beans directly into mouth from the pod.',
        ],
        saltFreeSeasoningTips: 'Zesty lemon and cracked pepper replace traditional coarse salt flakes completely.',
        healthBenefit: 'Provides 10g clean whole plant protein per cup with 0mg added sodium.',
        emoji: '🫛',
        weekMenuTheme: 'Asian Garden & Gentle Ginger-Shiitake Nourishment',
        isWeeklySpecial: true,
      },
    ],
  },
];

export class RecipeGeneratorService {
  private static LAST_WEEK_SYNC_KEY = 'health_app_recipes_last_week_sync_v1';
  private static MANUAL_WEEK_OFFSET_KEY = 'health_app_recipes_manual_offset_v1';

  /**
   * Calculate current 7-day Monday through Sunday calendar week info
   */
  public static getCurrentWeekInfo(date: Date = new Date(), manualOffset: number = 0) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    // Apply manual week offset if user requested advance preview
    if (manualOffset !== 0) {
      d.setDate(d.getDate() + manualOffset * 7);
    }

    const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
    // Calculate Monday of current week
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatMonthDay = (dateObj: Date) => `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

    const year = monday.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // Calculate days remaining until Sunday midnight
    const now = new Date();
    const endOfSunday = new Date(sunday);
    endOfSunday.setHours(23, 59, 59, 999);
    const msRemaining = Math.max(0, endOfSunday.getTime() - now.getTime());
    const daysRemainingInWeek = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      weekKey: `${year}-W${weekNum}`,
      weekNum,
      weekRangeLabel: `${formatMonthDay(monday)} – ${formatMonthDay(sunday)}, ${year}`,
      thisWeekFullLabel: `Week of ${formatMonthDay(monday)} – ${formatMonthDay(sunday)}, ${year}`,
      thisMonday: `Mon, ${formatMonthDay(monday)}`,
      thisSunday: `Sun, ${formatMonthDay(sunday)}`,
      daysRemainingInWeek: daysRemainingInWeek > 0 ? daysRemainingInWeek : 7,
    };
  }

  /**
   * Get active weekly theme pack based on week number
   */
  public static getThemeForWeek(weekNum: number): WeeklyThemePack {
    const themeIndex = Math.abs((weekNum - 1) % WEEKLY_RECIPE_THEMES.length);
    return WEEKLY_RECIPE_THEMES[themeIndex] || WEEKLY_RECIPE_THEMES[0];
  }

  /**
   * Get next week's theme pack
   */
  public static getNextWeekTheme(weekNum: number): WeeklyThemePack {
    const nextIndex = Math.abs(weekNum % WEEKLY_RECIPE_THEMES.length);
    return WEEKLY_RECIPE_THEMES[nextIndex] || WEEKLY_RECIPE_THEMES[0];
  }

  /**
   * Automatically synchronizes recipes on the 7-day Monday–Sunday cycle!
   * - Retains all user-bookmarked recipes and custom created recipes safely.
   * - Rotates in the fresh 7-day curated menu.
   */
  public static syncWeeklyRecipes(): WeeklySyncResult {
    let manualOffset = 0;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        manualOffset = parseInt(localStorage.getItem(this.MANUAL_WEEK_OFFSET_KEY) || '0', 10) || 0;
      }
    } catch {}

    const weekInfo = this.getCurrentWeekInfo(new Date(), manualOffset);
    const currentTheme = this.getThemeForWeek(weekInfo.weekNum);
    const nextTheme = this.getNextWeekTheme(weekInfo.weekNum);

    let lastWeekKey = '';
    let loaded: RecipeItem[] = [];

    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        lastWeekKey = localStorage.getItem(this.LAST_WEEK_SYNC_KEY) || '';
        const raw = localStorage.getItem('health_app_recipes_v1');
        if (raw && !raw.startsWith('enc:v1:')) {
          loaded = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('Error reading saved recipes', e);
    }

    const isNewWeek = lastWeekKey !== weekInfo.weekKey || loaded.length === 0;

    if (isNewWeek) {
      // Safely preserve user bookmarks and custom creations
      const currentList = loaded.length > 0 ? loaded : HealthStorageService.getAllRecipes();
      const bookmarkedIds = new Set(currentList.filter((r) => r.isBookmarked).map((r) => r.id));
      const bookmarkedItems = currentList.filter((r) => r.isBookmarked);
      const customRecipes = currentList.filter(
        (r) => r.id.startsWith('rec-custom-') || r.id.startsWith('rec-gen-')
      );

      // Prepare fresh weekly theme recipes
      const freshThemeRecipes = currentTheme.recipes.map((recipe) => ({
        ...recipe,
        weekMenuTheme: currentTheme.title,
        weekLabel: weekInfo.thisWeekFullLabel,
        isBookmarked: bookmarkedIds.has(recipe.id),
      }));

      // Combine custom creations + bookmarked favorites + fresh weekly curated pack
      const existingIds = new Set(freshThemeRecipes.map((r) => r.id));
      const preservedBookmarked = bookmarkedItems.filter((r) => !existingIds.has(r.id));
      const preservedCustom = customRecipes.filter((r) => !existingIds.has(r.id) && !bookmarkedIds.has(r.id));

      const updated = [...freshThemeRecipes, ...preservedBookmarked, ...preservedCustom];

      HealthStorageService.saveAllRecipes(updated);

      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem(this.LAST_WEEK_SYNC_KEY, weekInfo.weekKey);
        }
      } catch {}

      return {
        recipes: updated,
        isNewWeek: true,
        weekInfo,
        currentTheme,
        nextTheme,
      };
    }

    return {
      recipes: loaded.length > 0 ? loaded : HealthStorageService.getAllRecipes(),
      isNewWeek: false,
      weekInfo,
      currentTheme,
      nextTheme,
    };
  }

  /**
   * Manually advance to the next week's 7-day menu early / preview
   */
  public static advanceToNextWeeklyMenu(): WeeklySyncResult {
    let currentOffset = 0;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        currentOffset = parseInt(localStorage.getItem(this.MANUAL_WEEK_OFFSET_KEY) || '0', 10) || 0;
      }
    } catch {}

    const newOffset = currentOffset + 1;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(this.MANUAL_WEEK_OFFSET_KEY, newOffset.toString());
        localStorage.removeItem(this.LAST_WEEK_SYNC_KEY); // Force sync
      }
    } catch {}

    return this.syncWeeklyRecipes();
  }

  /**
   * Get today's featured recipe of the day based on the calendar date
   */
  public static getDailyFeaturedRecipe(allRecipes: RecipeItem[]): RecipeItem {
    if (!allRecipes || allRecipes.length === 0) {
      allRecipes = HealthStorageService.getAllRecipes();
    }
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const index = Math.abs(dayOfYear % allRecipes.length);
    return allRecipes[index] || allRecipes[0];
  }

  /**
   * Generate a custom procedural low-sodium chef recipe
   */
  public static generateProceduralRecipe(
    targetMealType: RecipeMealType = 'dinner',
    userIngredients?: string[]
  ): RecipeItem {
    const templates = [
      {
        title: 'Warm Mediterranean Lentil & Roasted Beet Power Bowl',
        mealType: 'lunch' as RecipeMealType,
        emoji: '🥗',
        sodium: 65,
        calories: 330,
        prep: 15,
        cook: 20,
        desc: 'Hearty warm French green lentils tossed with roasted baby beets, fresh dill, walnuts, and Meyer lemon dressing.',
        ingredients: [
          '1.5 cups cooked French green lentils',
          '2 roasted medium red beets, diced',
          '2 cups baby spinach or arugula',
          '1/4 cup toasted walnuts, chopped',
          '2 tbsp fresh dill, minced',
          '1.5 tbsp extra virgin olive oil and 1 tbsp Meyer lemon juice',
          'Fresh cracked black pepper',
        ],
        instructions: [
          'In a large bowl, combine warm cooked green lentils and diced roasted beets.',
          'Add fresh baby spinach and chopped dill.',
          'Whisk olive oil and Meyer lemon juice together; pour over salad and toss gently.',
          'Top with toasted walnuts and freshly cracked black pepper.',
        ],
        saltFreeTip: 'Fresh dill, Meyer lemon, and earthy roasted beets create vibrant flavor without salt.',
        healthBenefit: 'Dietary nitrates in beets support endothelial function and healthy arterial elasticity.',
      },
      {
        title: 'Comforting Tuscan Cannellini Bean & Kale Minestrone',
        mealType: 'soup' as RecipeMealType,
        emoji: '🍲',
        sodium: 75,
        calories: 220,
        prep: 10,
        cook: 25,
        desc: 'Classic Italian vegetable soup with sweet carrots, celery, crushed tomatoes, and creamy white beans simmered with fresh rosemary.',
        ingredients: [
          '2 cans (15 oz) no-salt-added white beans, rinsed',
          '4 cups low-sodium vegetable broth',
          '1 can (14 oz) no-salt-added diced tomatoes',
          '2 cups chopped Lacinato kale',
          '2 carrots and 2 celery ribs, sliced',
          '4 cloves garlic, minced',
          '1 tbsp fresh rosemary and 1 tsp dried oregano',
          '2 tbsp extra virgin olive oil',
        ],
        instructions: [
          'Sauté carrots, celery, and garlic in olive oil in a Dutch oven for 6 minutes.',
          'Add diced tomatoes, white beans, vegetable broth, rosemary, and oregano.',
          'Simmer on low for 18 minutes. Mash a third of the beans to thicken naturally.',
          'Stir in fresh chopped kale and cook for 3 more minutes until tender. Serve hot.',
        ],
        saltFreeTip: 'Rosemary, garlic, and rich tomato fond give deep savory savoriness without salt.',
        healthBenefit: 'Rich in potassium and magnesium to promote healthy vascular muscle relaxation.',
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    const id = `rec-gen-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const finalIngredients =
      userIngredients && userIngredients.length > 0
        ? [
            ...userIngredients.map((ing) => `Fresh ${ing}`),
            '2 tbsp extra virgin olive oil',
            '3 cloves garlic, minced',
            '1 tbsp fresh lemon juice',
            'Herbs & black pepper',
          ]
        : pick.ingredients;

    const finalTitle =
      userIngredients && userIngredients.length > 0
        ? `Chef's Fresh ${userIngredients[0]} & Herb Medley`
        : pick.title;

    return {
      id,
      title: finalTitle,
      mealType: targetMealType || pick.mealType,
      dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
      prepTimeMinutes: pick.prep,
      cookTimeMinutes: pick.cook,
      servings: 4,
      sodiumMgPerServing: pick.sodium,
      caloriesPerServing: pick.calories,
      description:
        userIngredients && userIngredients.length > 0
          ? `A freshly crafted heart-healthy low-sodium dish highlighting your fresh ${userIngredients.slice(0, 3).join(', ')}.`
          : pick.desc,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      ingredients: finalIngredients,
      instructions: pick.instructions,
      saltFreeSeasoningTips: pick.saltFreeTip,
      vegetarianSwapTip: '100% plant-based with zero animal cholesterol and zero added sodium.',
      healthBenefit: pick.healthBenefit,
      emoji: pick.emoji,
      isBookmarked: false,
    };
  }

  /**
   * Manually request fresh AI Chef suggestions to be added to the library
   */
  public static fetchFreshRecipeSuggestions(): { addedRecipe: RecipeItem; totalRecipes: number } {
    const existing = HealthStorageService.getAllRecipes();
    const freshRecipe = this.generateProceduralRecipe();
    HealthStorageService.addRecipe(freshRecipe);
    return {
      addedRecipe: freshRecipe,
      totalRecipes: existing.length + 1,
    };
  }
}
