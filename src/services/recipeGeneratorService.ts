import { RecipeItem, RecipeMealType } from '../types/health';
import { HealthStorageService } from './healthStorage';

export interface SeasonalSpecial {
  seasonName: string;
  theme: string;
  bannerEmoji: string;
  featuredRecipeIds: string[];
}

export const EXPANDED_RECIPE_ROTATION_POOL: RecipeItem[] = [
  {
    id: 'rot-rec-1',
    title: 'Autumn Harvest Roasted Butternut Squash & Farro Salad',
    mealType: 'lunch',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    sodiumMgPerServing: 65,
    caloriesPerServing: 290,
    description: 'Caramelized roasted butternut squash tossed with nutty warm farro, toasted pecans, baby arugula, and aged pomegranate balsamic drizzle.',
    imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '3 cups butternut squash, peeled and cubed into bite-sized pieces',
      '1 cup whole grain pearled farro (rinsed)',
      '3 cups fresh baby arugula or baby kale',
      '1/3 cup raw pecans, lightly toasted',
      '2 tbsp extra virgin olive oil',
      '2 tbsp aged balsamic vinegar or pomegranate molasses',
      '1 tsp dried sage and 1 tsp ground cinnamon',
      'Fresh cracked black pepper to taste',
    ],
    instructions: [
      'Preheat oven to 400°F (200°C). Toss butternut squash cubes with 1 tbsp olive oil, dried sage, and cinnamon.',
      'Roast for 25 minutes on a parchment-lined baking sheet until caramelized and tender.',
      'Meanwhile, cook farro in 3 cups of water for 20 minutes until al dente; drain any excess liquid.',
      'In a large wooden salad bowl, combine warm cooked farro, roasted butternut squash, and baby arugula.',
      'Drizzle with remaining olive oil and aged balsamic vinegar. Top with toasted pecans and freshly ground black pepper.',
    ],
    saltFreeSeasoningTips: 'Aged balsamic vinegar, sweet roasted squash, and toasted pecans deliver rich complexity without needing any salt shaker.',
    vegetarianSwapTip: 'Nutty ancient farro delivers 6g of protein and 5g of prebiotic fiber per serving to nourish gut microbiome.',
    healthBenefit: 'High in potassium (620mg) and beta-carotene antioxidants to support cardiovascular flexibility.',
    emoji: '🥗',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-2',
    title: 'Golden Turmeric & Ginger Coconut Red Lentil Dahl',
    mealType: 'dinner',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    sodiumMgPerServing: 80,
    caloriesPerServing: 320,
    description: 'Velvety, aromatic red lentils simmered in light coconut milk, fresh grated ginger root, golden turmeric, and sweet cherry tomatoes.',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '1.5 cups dry red lentils (rinsed thoroughly)',
      '1 can (13.5 oz) light coconut milk',
      '2.5 cups low-sodium vegetable broth or water',
      '1 tbsp fresh ginger root, finely grated',
      '1 tbsp ground turmeric (anti-inflammatory booster)',
      '1 tbsp ground cumin and 1 tsp ground coriander',
      '4 cloves garlic, minced',
      '1 cup cherry tomatoes, halved',
      '2 cups baby spinach',
      'Fresh cilantro and lime wedges for serving',
    ],
    instructions: [
      'In a large saucepan, sauté minced garlic and grated ginger in 1 tbsp olive oil over medium heat for 2 minutes.',
      'Add ground turmeric, cumin, and coriander. Toast the spices for 45 seconds until fragrant.',
      'Add rinsed red lentils, light coconut milk, and low-sodium broth.',
      'Bring to a boil, then reduce heat to low and simmer uncovered for 15-18 minutes until lentils are soft and creamy.',
      'Stir in halved cherry tomatoes and baby spinach. Cook for 2 more minutes until spinach wilts.',
      'Ladle into warm bowls. Garnish with fresh cilantro and a generous squeeze of fresh lime juice.',
    ],
    saltFreeSeasoningTips: 'Fresh lime juice activates the earthy turmeric and toasted cumin, creating deep warmth without table salt.',
    vegetarianSwapTip: 'Red lentils provide 18g of clean plant protein and break down naturally into a creamy texture without cream.',
    healthBenefit: 'Curcumin in turmeric and gingerols provide potent anti-inflammatory protection for vascular health and joints.',
    emoji: '🍲',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-3',
    title: 'Savory Herb-Roasted Cauliflower Steaks with Chimichurri',
    mealType: 'dinner',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 3,
    sodiumMgPerServing: 55,
    caloriesPerServing: 210,
    description: 'Thick, caramelized cauliflower center steaks roasted golden brown, served over a vibrant green parsley, cilantro, and garlic chimichurri.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '2 large heads of fresh cauliflower (sliced into 3/4-inch center steaks)',
      '2 tbsp extra virgin olive oil',
      '1 tsp smoked paprika and 1 tsp garlic powder',
      '1/2 tsp freshly ground black pepper',
      'For Chimichurri: 1 cup fresh Italian parsley, finely minced',
      '1/2 cup fresh cilantro, finely minced',
      '3 cloves garlic, finely grated',
      '1/4 cup extra virgin olive oil and 2 tbsp red wine vinegar',
      '1/2 tsp dried oregano and a pinch of red chili flakes',
    ],
    instructions: [
      'Preheat oven to 425°F (220°C). Line a large baking sheet with parchment paper.',
      'Brush both sides of cauliflower steaks with olive oil and dust evenly with smoked paprika, garlic powder, and black pepper.',
      'Roast for 25-30 minutes, flipping halfway through, until edges are caramelized and fork-tender.',
      'While roasting, whisk together parsley, cilantro, garlic, red wine vinegar, olive oil, and oregano in a small bowl.',
      'Plate cauliflower steaks warm and spoon zesty fresh chimichurri sauce over the top.',
    ],
    saltFreeSeasoningTips: 'Zesty red wine vinegar with fresh garlic and chopped herbs provides an explosion of tangy flavor with 0mg added sodium.',
    vegetarianSwapTip: 'Substantial, hearty steak-like centerpiece with zero saturated animal fats or dietary cholesterol.',
    healthBenefit: 'Cruciferous vegetables are rich in sulforaphane and indole-3-carbinol for cellular and cardiac protection.',
    emoji: '🥦',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-4',
    title: 'Mediterranean Quinoa-Stuffed Bell Peppers with Sun-Dried Tomato',
    mealType: 'dinner',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
    prepTimeMinutes: 20,
    cookTimeMinutes: 35,
    servings: 4,
    sodiumMgPerServing: 85,
    caloriesPerServing: 280,
    description: 'Sweet red and yellow bell peppers filled with herb-infused quinoa, diced zucchini, unsalted sun-dried tomatoes, and toasted pine nuts.',
    imageUrl: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '4 large sweet bell peppers (red, orange, or yellow), tops sliced and seeds removed',
      '1.5 cups cooked fluffy quinoa',
      '1 medium zucchini, finely diced',
      '1/3 cup oil-packed unsalted sun-dried tomatoes, chopped',
      '3 cloves garlic, minced',
      '2 tbsp pine nuts or slivered almonds (lightly toasted)',
      '2 tbsp fresh chopped basil and 1 tbsp fresh oregano',
      '1 tbsp extra virgin olive oil and 1 tbsp lemon juice',
    ],
    instructions: [
      'Preheat oven to 375°F (190°C). Place seeded bell pepper cups upright in a baking dish with 1/4 cup water in the bottom.',
      'In a skillet, heat olive oil over medium heat. Sauté minced garlic and diced zucchini for 4 minutes.',
      'Stir in cooked quinoa, chopped sun-dried tomatoes, fresh basil, oregano, toasted pine nuts, and fresh lemon juice.',
      'Spoon quinoa mixture generously into each bell pepper cavity.',
      'Cover baking dish with foil and bake for 30 minutes until peppers are soft and sweet. Uncover for the last 5 minutes.',
    ],
    saltFreeSeasoningTips: 'Sun-dried tomatoes and toasted pine nuts add natural savory depth and buttery crunch without sodium.',
    vegetarianSwapTip: 'Complete plant protein from quinoa contains all 9 essential amino acids.',
    healthBenefit: 'Sweet bell peppers deliver over 200% of daily Vitamin C and 580mg of potassium per pepper.',
    emoji: '🫑',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-5',
    title: 'Hearty Tuscan White Bean & Rosemary Flatbread Panini',
    mealType: 'lunch',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    sodiumMgPerServing: 90,
    caloriesPerServing: 310,
    description: 'Warm, crispy whole-grain panini layered with mashed garlic rosemary white beans, roasted red bell peppers, and fresh peppery baby arugula.',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '2 low-sodium sprouted whole grain ciabatta rolls or flatbreads',
      '1 can (15 oz) no-salt-added white cannellini beans, rinsed and drained',
      '2 cloves garlic, mashed into paste',
      '1 tbsp fresh rosemary, finely chopped',
      '1 tbsp extra virgin olive oil and 1 tsp lemon juice',
      '1/2 cup roasted sweet red peppers (sliced)',
      '1 cup fresh baby arugula',
      'Fresh cracked black pepper',
    ],
    instructions: [
      'In a bowl, mash white beans with garlic paste, fresh rosemary, olive oil, lemon juice, and black pepper until thick and spreadable.',
      'Slice whole grain rolls in half horizontally.',
      'Spread a thick layer of herbed white bean paste on the bottom half of each roll.',
      'Layer sliced roasted red peppers and fresh baby arugula on top, then close sandwich.',
      'Toast in a panini press or hot dry skillet for 3-4 minutes per side until golden and crusty. Slice diagonally and serve.',
    ],
    saltFreeSeasoningTips: 'Fresh rosemary and garlic infused into warm olive oil create rich Italian bistro flavors with zero sodium.',
    vegetarianSwapTip: 'Rich in soluble fiber that helps trap and lower circulating LDL cholesterol.',
    healthBenefit: 'Sprouted grains improve insulin sensitivity and prevent post-lunch fatigue.',
    emoji: '🥪',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-6',
    title: 'Antioxidant Wild Berry Chia Seed Pudding Parfait',
    mealType: 'breakfast',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 2,
    sodiumMgPerServing: 35,
    caloriesPerServing: 220,
    description: 'Creamy chia seed pudding made with unsweetened vanilla almond milk, layered with mashed wild blackberries, blueberries, and toasted walnuts.',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '1/3 cup black chia seeds',
      '1.5 cups unsweetened vanilla almond milk or oat milk',
      '1 tsp pure vanilla extract',
      '1/2 tsp ground Ceylon cinnamon',
      '1 cup mixed fresh blueberries, raspberries, and blackberries (lightly crushed)',
      '2 tbsp raw walnut pieces, toasted',
      '1 tsp unsweetened cocoa nibs (optional crunch)',
    ],
    instructions: [
      'In a medium glass bowl, whisk together chia seeds, almond milk, vanilla extract, and cinnamon until well mixed.',
      'Let sit for 10 minutes, then whisk once more to prevent clumping. Cover and chill in the refrigerator for at least 2 hours (or overnight).',
      'Layer chilled creamy chia pudding in glasses with crushed fresh berries and toasted walnut pieces.',
      'Sprinkle with a dusting of cinnamon and cocoa nibs before serving.',
    ],
    saltFreeSeasoningTips: 'Natural sweet berries, pure vanilla extract, and Ceylon cinnamon provide delightful morning sweetness with zero sugar spikes.',
    vegetarianSwapTip: 'Chia seeds provide plant-based ALA Omega-3 fats that help calm systemic vascular inflammation.',
    healthBenefit: '11g of dietary fiber per parfait promotes steady morning blood glucose control.',
    emoji: '🫐',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-7',
    title: 'Provence Herb Ratatouille with Sliced Zucchini & Eggplant',
    mealType: 'dinner',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    servings: 4,
    sodiumMgPerServing: 70,
    caloriesPerServing: 190,
    description: 'Classic French country ratatouille with spiral sliced eggplant, zucchini, yellow squash, and vine tomatoes over a fragrant garlic thyme tomato compote.',
    imageUrl: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '1 medium Italian eggplant, sliced into thin rounds',
      '2 medium zucchini, sliced into thin rounds',
      '2 yellow summer squash, sliced into thin rounds',
      '4 ripe Roma tomatoes, sliced into thin rounds',
      '1 can (14 oz) no-salt-added crushed tomatoes',
      '1 medium onion and 4 cloves garlic, minced',
      '2 tbsp extra virgin olive oil',
      '1 tbsp fresh thyme leaves and 1 tbsp chopped fresh basil',
      '1 tsp dried herbs de Provence',
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'In an oven-safe skillet, sauté diced onion and garlic in 1 tbsp olive oil for 5 minutes. Stir in crushed tomatoes, thyme, and herbs de Provence. Spread evenly across the bottom.',
      'Arrange sliced eggplant, zucchini, yellow squash, and tomato rounds in alternating concentric circles over the sauce.',
      'Drizzle with remaining 1 tbsp olive oil and season with black pepper and fresh basil.',
      'Cover with parchment paper and bake for 35 minutes until vegetables are tender. Uncover for last 5 minutes.',
      'Serve warm as a flavorful dinner alongside brown rice or crusty whole grain bread.',
    ],
    saltFreeSeasoningTips: 'Slow roasting concentrated tomatoes and herbs de Provence produces rich French culinary depth without any table salt.',
    vegetarianSwapTip: 'Hearty, comforting vegetable main that is naturally low in calories and saturated fat.',
    healthBenefit: 'Eggplant skin is loaded with nasunin, a potent antioxidant that protects brain cell membranes.',
    emoji: '🍆',
    isBookmarked: false,
  },
  {
    id: 'rot-rec-8',
    title: 'Slow-Simmered Moroccan Chickpea & Sweet Potato Tagine',
    mealType: 'dinner',
    dietaryTags: ['low_sodium', 'vegetarian', 'vegan', 'heart_healthy', 'high_potassium'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    sodiumMgPerServing: 85,
    caloriesPerServing: 310,
    description: 'A comforting North African tagine with sweet potatoes, chickpeas, dried apricots, cinnamon, ground cumin, and fresh cilantro.',
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&auto=format&fit=crop&q=80',
    ingredients: [
      '2 cans (15 oz each) no-salt-added chickpeas, rinsed and drained',
      '2 medium sweet potatoes, peeled and cut into 1-inch cubes',
      '1 can (14 oz) no-salt-added diced tomatoes',
      '2 cups low-sodium vegetable broth',
      '1/3 cup unsweetened dried apricots or golden raisins, chopped',
      '1 medium yellow onion, diced',
      '4 cloves garlic, minced',
      '1 tbsp ground cumin, 1 tsp ground coriander, and 1 tsp ground cinnamon',
      '1/2 tsp ground ginger and 1/4 tsp cayenne pepper',
      '2 tbsp extra virgin olive oil',
      'Fresh cilantro and toasted slivered almonds for garnish',
    ],
    instructions: [
      'In a large heavy pot, heat olive oil over medium heat. Sauté onion and sweet potatoes for 6 minutes.',
      'Add garlic, cumin, coriander, cinnamon, and ginger. Stir for 1 minute until highly aromatic.',
      'Add diced tomatoes, rinsed chickpeas, low-sodium vegetable broth, and chopped dried apricots.',
      'Bring to a boil, then reduce heat to low, cover, and simmer for 25 minutes until sweet potatoes are soft.',
      'Stir gently to allow natural starch from sweet potatoes to thicken the sauce.',
      'Garnish with fresh cilantro and toasted slivered almonds before serving hot over couscous or quinoa.',
    ],
    saltFreeSeasoningTips: 'Cinnamon, cumin, and dried apricots provide an exquisite sweet and savory balance that completely replaces the need for salt.',
    vegetarianSwapTip: 'Chickpeas provide hearty texture and slow-digesting carbohydrates to keep blood glucose balanced.',
    healthBenefit: 'Sweet potatoes and chickpeas together provide over 800mg of natural potassium per serving.',
    emoji: '🍲',
    isBookmarked: false,
  },
];

export class RecipeGeneratorService {
  private static LAST_ROTATION_KEY = 'health_app_recipes_last_rotation_date_v1';

  /**
   * Get today's featured recipe of the day based on the calendar date
   */
  public static getDailyFeaturedRecipe(allRecipes: RecipeItem[]): RecipeItem {
    if (!allRecipes || allRecipes.length === 0) {
      allRecipes = HealthStorageService.getAllRecipes();
    }
    const today = new Date();
    // Unique daily hash from year + day of year
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const index = Math.abs(dayOfYear % allRecipes.length);
    return allRecipes[index] || allRecipes[0];
  }

  /**
   * Auto-check and inject fresh seasonal suggestions into the user's recipe library
   * if not updated today, ensuring the library never gets stale!
   */
  public static ensureFreshSeasonalRecipes(): { addedCount: number; newRecipes: RecipeItem[] } {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastRotation = localStorage.getItem(this.LAST_ROTATION_KEY);

    const existing = HealthStorageService.getAllRecipes();
    const existingIds = new Set(existing.map((r) => r.id));

    // If it's a new day or first run, check for fresh items from the pool
    const unaddedFromPool = EXPANDED_RECIPE_ROTATION_POOL.filter((r) => !existingIds.has(r.id));

    if (unaddedFromPool.length > 0 && lastRotation !== todayStr) {
      // Pick 2 fresh recipes from pool to add smoothly
      const toAdd = unaddedFromPool.slice(0, 2);
      const updated = [...toAdd, ...existing];
      HealthStorageService.saveAllRecipes(updated);
      localStorage.setItem(this.LAST_ROTATION_KEY, todayStr);
      return { addedCount: toAdd.length, newRecipes: toAdd };
    }

    return { addedCount: 0, newRecipes: [] };
  }

  /**
   * Manually request fresh AI Chef suggestions to be added to the library
   */
  public static fetchFreshRecipeSuggestions(): { addedRecipe: RecipeItem; totalRecipes: number } {
    const existing = HealthStorageService.getAllRecipes();
    const existingIds = new Set(existing.map((r) => r.id));

    // Look for next unadded pool item
    const unadded = EXPANDED_RECIPE_ROTATION_POOL.find((r) => !existingIds.has(r.id));

    let freshRecipe: RecipeItem;

    if (unadded) {
      freshRecipe = { ...unadded, isBookmarked: false };
    } else {
      // Generate a procedural fresh recipe
      freshRecipe = this.generateProceduralRecipe();
    }

    HealthStorageService.addRecipe(freshRecipe);
    return {
      addedRecipe: freshRecipe,
      totalRecipes: existing.length + 1,
    };
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
          '1.5 tbsp extra virgin olive oil',
          '1 tbsp fresh Meyer lemon juice',
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
          '1 tbsp chopped fresh rosemary and 1 tsp dried oregano',
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
      {
        title: 'Crispy Lemon Rosemary Tofu with Garlic Mashed Cauliflower',
        mealType: 'dinner' as RecipeMealType,
        emoji: '🍽️',
        sodium: 80,
        calories: 270,
        prep: 15,
        cook: 20,
        desc: 'Golden pan-crisped organic tofu triangles served alongside fluffy garlic cauliflower mash and steamed broccolini.',
        ingredients: [
          '1 block (14 oz) extra-firm organic tofu, pressed and cut into triangles',
          '1 large head cauliflower, cut into florets and steamed tender',
          '4 cloves garlic, roasted or minced',
          '2 tbsp nutritional yeast (nutty cheese flavor with 0mg sodium)',
          '2 tbsp extra virgin olive oil',
          '1 tbsp fresh rosemary, minced',
          '1 tbsp fresh lemon juice and zest',
        ],
        instructions: [
          'Steam cauliflower florets until very tender; blend in a food processor with garlic, nutritional yeast, and 1 tbsp olive oil until smooth and creamy.',
          'In a skillet, heat 1 tbsp olive oil. Sear tofu triangles for 4-5 minutes per side until golden and crispy.',
          'Drizzle tofu with fresh lemon juice, lemon zest, and minced rosemary.',
          'Serve crispy tofu atop a bed of warm garlic cauliflower mash.',
        ],
        saltFreeTip: 'Nutritional yeast provides savory parmesan-like richness with zero sodium.',
        healthBenefit: 'Organic soy isoflavones and cruciferous cauliflower protect heart vessels.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    const id = `rec-gen-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const finalIngredients = userIngredients && userIngredients.length > 0
      ? [...userIngredients.map((ing) => `Fresh ${ing}`), '2 tbsp extra virgin olive oil', '3 cloves garlic, minced', '1 tbsp fresh lemon juice', 'Herbs & black pepper']
      : pick.ingredients;

    const finalTitle = userIngredients && userIngredients.length > 0
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
      description: userIngredients && userIngredients.length > 0 ? `A freshly crafted heart-healthy low-sodium dish highlighting your fresh ${userIngredients.slice(0, 3).join(', ')}.` : pick.desc,
      imageUrl: pick.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      ingredients: finalIngredients,
      instructions: pick.instructions,
      saltFreeSeasoningTips: pick.saltFreeTip,
      vegetarianSwapTip: '100% plant-based with zero animal cholesterol and zero added sodium.',
      healthBenefit: pick.healthBenefit,
      emoji: pick.emoji,
      isBookmarked: false,
    };
  }
}
