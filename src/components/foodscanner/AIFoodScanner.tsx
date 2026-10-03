import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ScannedFoodResult, MealContext, ReminderItem } from '../../types/health';
import { FoodScannerService, PRESET_FOOD_DATABASE, PresetFoodItem } from '../../services/foodScannerService';
import { HealthStorageService } from '../../services/healthStorage';
import { SpeechService } from '../../services/speechService';
import {
  Camera,
  CameraOff,
  Scan,
  Sparkles,
  Utensils,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Heart,
  ShieldCheck,
  Info,
  ChevronRight,
  Flame,
  ArrowRight,
  RefreshCw,
  Sliders,
  History,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video
} from 'lucide-react';

interface AIFoodScannerProps {
  profile: UserProfile;
  onNavigateToRecipes?: () => void;
  onNavigateToCheckin?: () => void;
}

export const AIFoodScanner: React.FC<AIFoodScannerProps> = ({
  profile,
  onNavigateToRecipes,
  onNavigateToCheckin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'presets' | 'history'>('scanner');
  
  // Camera & Image State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Scanning / Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [activeResult, setActiveResult] = useState<ScannedFoodResult | null>(null);
  const [selectedMealContext, setSelectedMealContext] = useState<MealContext>('restaurant');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [basePreset, setBasePreset] = useState<PresetFoodItem | null>(PRESET_FOOD_DATABASE[0]);

  // History & Action State
  const [history, setHistory] = useState<ScannedFoodResult[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);

  // Refs for video and file input
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize history & default sample
  useEffect(() => {
    loadScanHistory();
    // Default to the first preset meal if none scanned yet
    const initialResult = FoodScannerService.calculateNutrition(PRESET_FOOD_DATABASE[0], 1.0, 'restaurant');
    setActiveResult(initialResult);
    setBasePreset(PRESET_FOOD_DATABASE[0]);
    setCapturedImage(PRESET_FOOD_DATABASE[0].photoUrl);
  }, []);

  const loadScanHistory = () => {
    const list = FoodScannerService.getScanHistory();
    setHistory(list);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Could not open live camera. Please grant camera permission or use the "Upload Food Photo" button.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Toggle Camera Facing Mode (Front/Back)
  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    if (isCameraActive) {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture Frame from Video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      triggerAIAnalysis(dataUrl, 'camera_capture');
    }
  };

  // Process Chosen Photo or Video from Library
  const processUploadedFile = (file: File) => {
    stopCamera();

    if (file.type.startsWith('video/')) {
      setIsAnalyzing(true);
      setAnalysisStep('🎥 Extracting clear meal frame from uploaded video...');

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadeddata = () => {
        // Seek to 1 second or midway for a clear shot
        video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration / 2 : 0.5);
      };

      video.onseeked = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedImage(dataUrl);
          triggerAIAnalysis(dataUrl, file.name);
        }
        URL.revokeObjectURL(objectUrl);
      };

      video.onerror = () => {
        setIsAnalyzing(false);
        setFeedbackMessage('Could not read video from library. Please select another photo or video.');
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      // Photo file
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        triggerAIAnalysis(dataUrl, file.name);
      };
      reader.onerror = () => {
        setFeedbackMessage('Could not read photo from library. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle File Upload event
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    e.target.value = ''; // Reset input to allow selecting same file again
  };

  // Trigger Simulated Visual AI Pipeline
  const triggerAIAnalysis = async (imageDataUrl: string, hint?: string) => {
    setIsAnalyzing(true);
    setAnalysisStep('🔍 Segmenting plate boundaries & food volumes...');

    setTimeout(() => {
      setAnalysisStep('🔬 Detecting ingredients, sauces, and cooking oils...');
    }, 450);

    setTimeout(() => {
      setAnalysisStep('📊 Calculating carbohydrates, dietary fiber & glycemic load...');
    }, 900);

    setTimeout(() => {
      setAnalysisStep('🧂 Evaluating restaurant sodium vs. blood pressure risk...');
    }, 1350);

    try {
      const result = await FoodScannerService.analyzeImage(imageDataUrl, hint);
      // Find matching preset for base calculation
      const matchedPreset = PRESET_FOOD_DATABASE.find((p) => p.name === result.name) || PRESET_FOOD_DATABASE[0];
      setBasePreset(matchedPreset);
      setPortionMultiplier(1.0);
      result.mealContext = selectedMealContext;
      setActiveResult(result);
      FoodScannerService.saveScanToHistory(result);
      loadScanHistory();

      const successMsg = `Food identified: ${result.name} (${result.calories} kcal, ${result.carbsGrams}g carbs)`;
      setFeedbackMessage(successMsg);
      if (profile.soundEnabled) {
        SpeechService.speak(
          `Scanned ${result.name}. Estimated ${result.calories} calories, ${result.carbsGrams} grams carbohydrates, and ${result.sodiumMg} milligrams sodium.`,
          profile.voiceSpeed
        );
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage('Could not analyze photo. Please try another sample.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Select a preset food item
  const handleSelectPreset = (preset: PresetFoodItem) => {
    setBasePreset(preset);
    setCapturedImage(preset.photoUrl);
    setPortionMultiplier(1.0);
    const result = FoodScannerService.calculateNutrition(preset, 1.0, selectedMealContext);
    setActiveResult(result);
    FoodScannerService.saveScanToHistory(result);
    loadScanHistory();
    setActiveSubTab('scanner');

    const msg = `Loaded meal: ${preset.name}`;
    setFeedbackMessage(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(
        `${preset.name}. ${preset.baseCalories} calories, ${preset.baseCarbs} grams of carbohydrates, and ${preset.baseSodiumMg} milligrams of sodium.`,
        profile.voiceSpeed
      );
    }
  };

  // Change portion multiplier
  const handleMultiplierChange = (mult: number) => {
    setPortionMultiplier(mult);
    if (basePreset) {
      const updated = FoodScannerService.calculateNutrition(basePreset, mult, selectedMealContext);
      if (capturedImage && !capturedImage.startsWith('http')) {
        updated.imageUrl = capturedImage;
      }
      setActiveResult(updated);
    }
  };

  // Change Meal Context
  const handleContextChange = (ctx: MealContext) => {
    setSelectedMealContext(ctx);
    if (activeResult) {
      const updated = { ...activeResult, mealContext: ctx };
      setActiveResult(updated);
    }
  };

  // Voice Read Aloud
  const handleReadAloud = () => {
    if (!activeResult) return;
    if (isReadingAloud) {
      SpeechService.stopSpeaking();
      setIsReadingAloud(false);
      return;
    }

    setIsReadingAloud(true);
    const textToRead = `${activeResult.name}. Portion size: ${activeResult.baseServingDescription}. Total Calories: ${activeResult.calories}. Carbohydrates: ${activeResult.carbsGrams} grams, with ${activeResult.fiberGrams} grams of dietary fiber. Sodium content: ${activeResult.sodiumMg} milligrams. Blood pressure advisory: ${activeResult.bloodPressureAssessment.details}. Blood sugar impact: ${activeResult.bloodSugarAssessment.details}. Dining out tip: ${activeResult.diningOutSmartTips[0] || 'Enjoy in moderation.'}`;

    SpeechService.speak(textToRead, profile.voiceSpeed, () => {
      setIsReadingAloud(false);
    });
  };

  // Save to Reminders / Grocery List
  const handleSaveIngredientsToReminders = () => {
    if (!activeResult) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const ingredientList = activeResult.ingredients
      .map((i) => `${i.name} (${i.estimatedAmount || ''})`)
      .join(', ');

    const newReminder: ReminderItem = {
      id: `rem-scan-${Date.now()}`,
      title: `Food Note: ${activeResult.name}`,
      priority: 'less_urgent',
      dueDate: todayStr,
      dueTime: 'Afternoon',
      notes: `Scanned Meal Details:\n• Calories: ${activeResult.calories} kcal\n• Carbs: ${activeResult.carbsGrams}g (Fiber: ${activeResult.fiberGrams}g)\n• Sodium: ${activeResult.sodiumMg}mg\n• Ingredients: ${ingredientList}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newReminder);
    const msg = `Saved food breakdown for "${activeResult.name}" to your Reminders list!`;
    setFeedbackMessage(msg);
    if (profile.soundEnabled) {
      SpeechService.speak(msg, profile.voiceSpeed);
    }
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = FoodScannerService.deleteScanFromHistory(id);
    setHistory(updated);
    setFeedbackMessage('Removed item from scan history.');
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your meal scan history?')) {
      FoodScannerService.clearHistory();
      setHistory([]);
      setFeedbackMessage('Scan history cleared.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-3 sm:my-6 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Hidden canvas for webcam frame snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                AI Vision Nutrition Scanner
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Instant Calories • Carbs • Sodium • Health Tips
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2 sm:gap-3">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <span>AI Food & Dining Out Scanner</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 max-w-3xl">
              Snap a picture of your plate at restaurants, dinner with friends, or at home. The AI instantly calculates ingredients, calories, carbs, sodium, and blood pressure impacts so you can eat out with confidence!
            </p>
          </div>

          {/* Quick Sub-Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'scanner'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scanner</span>
            </button>

            <button
              onClick={() => setActiveSubTab('presets')}
              className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'presets'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Sample Meals ({PRESET_FOOD_DATABASE.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 relative ${
                activeSubTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 font-extrabold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: LIVE CAMERA & PHOTO SCANNER */}
      {activeSubTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera / Photo Capture Section */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <span>Plate Capture</span>
                </h3>

                {/* Where are you eating context */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-bold hidden sm:inline">Context:</span>
                  <select
                    value={selectedMealContext}
                    onChange={(e) => handleContextChange(e.target.value as MealContext)}
                    className="bg-slate-100 border border-slate-300 rounded-xl px-2 py-1 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="restaurant">🍽️ Restaurant</option>
                    <option value="at_friends">👥 At Friends / Party</option>
                    <option value="cafe">☕ Cafe / Brunch</option>
                    <option value="takeout">🥡 Takeout Meal</option>
                    <option value="home_cooked">🏡 Home Cooked</option>
                  </select>
                </div>
              </div>

              {/* Live Video / Captured Photo Viewport */}
              <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Target Overlay Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                      <div className="w-full h-full border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
                        <div className="bg-slate-950/60 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                          <Scan className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Center Food Plate</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Scanned Food Plate"
                      className="w-full h-full object-cover"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                          <Scan className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-sm sm:text-base text-emerald-300 animate-pulse">
                            {analysisStep || 'Analyzing meal with AI...'}
                          </p>
                          <p className="text-xs text-slate-300">
                            Estimating ingredients, carbs, sodium & portion size
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <Utensils className="w-12 h-12 mx-auto text-slate-500" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-300">
                      No photo captured yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Start your camera or choose an image below
                    </p>
                  </div>
                )}
              </div>

              {/* Camera Error Notice if any */}
              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Capture Control Buttons */}
              <div className="space-y-2.5">
                {isCameraActive ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCapturePhoto}
                      className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      onClick={toggleCameraFacingMode}
                      className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      title="Flip between front and back camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Flip Camera</span>
                    </button>

                    <button
                      onClick={stopCamera}
                      className="col-span-2 py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Close Camera</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={startCamera}
                        className="py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Open Live Camera</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 px-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-extrabold text-xs sm:text-sm border-2 border-indigo-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                        title="Upload chosen pictures or videos from library"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <Video className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>Upload from Library</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-center text-slate-500 font-semibold flex items-center justify-center gap-1">
                      <span>📸 Photos & 🎥 Videos supported from your device library</span>
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.mp4,.mov,.webm,.m4v,.png,.jpg,.jpeg,.heic,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Quick Try Sample Dishes Carousel */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Or Try Instant Demo Plates:</span>
                  </span>
                  <button
                    onClick={() => setActiveSubTab('presets')}
                    className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-800"
                  >
                    View All ({PRESET_FOOD_DATABASE.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_FOOD_DATABASE.slice(0, 4).map((dish) => (
                    <button
                      key={dish.id}
                      onClick={() => handleSelectPreset(dish)}
                      className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                        basePreset?.id === dish.id
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{dish.emoji}</span>
                      <span className="text-[10px] font-extrabold text-slate-800 line-clamp-1 leading-tight">
                        {dish.name.split(' ')[0]} {dish.name.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Eating Out Senior Tips Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Eating Out & Visiting Friends Safety Guide</span>
              </div>
              <ul className="text-xs space-y-1.5 font-semibold text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-extrabold">•</span>
                  <span><strong>Secret Salt in Sauces:</strong> Restaurant dressings and marinades often hide 500mg+ sodium. Ask for sauces on the side.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-extrabold">•</span>
                  <span><strong>Portion Control:</strong> Split restaurant pasta or rice bowls in half and take the rest home to avoid glucose spikes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-extrabold">•</span>
                  <span><strong>Hydration Buffer:</strong> When eating sodium-rich restaurant food, drink a tall glass of water to support kidney filtration.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Comprehensive AI Nutrition & Health Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {activeResult ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
                {/* Result Title & Confidence */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <span>{activeResult.emoji}</span>
                        <span>{activeResult.detectedCategory}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
                        ✨ {activeResult.confidenceScore}% AI Confidence
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                        📍 {activeResult.mealContext.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5 leading-snug">
                      {activeResult.name}
                    </h3>
                  </div>

                  {/* Audio Read & Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={handleReadAloud}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                        isReadingAloud
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title="Read nutrition breakdown aloud"
                    >
                      {isReadingAloud ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                      <span>{isReadingAloud ? 'Stop Reading' : 'Read Aloud'}</span>
                    </button>

                    <button
                      onClick={handleSaveIngredientsToReminders}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-xs sm:text-sm flex items-center gap-1 transition-all"
                      title="Save nutrition and notes to Reminders"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Save Note</span>
                    </button>
                  </div>
                </div>

                {/* Portion Size Adjustment Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>Adjust Portion Eaten:</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                      {portionMultiplier === 0.5 ? 'Half Plate (0.5x)' :
                       portionMultiplier === 0.75 ? 'Light Serving (0.75x)' :
                       portionMultiplier === 1.0 ? 'Standard Plate (1.0x)' :
                       portionMultiplier === 1.5 ? 'Large Serving (1.5x)' :
                       portionMultiplier === 2.0 ? 'Double / Shared (2.0x)' :
                       `${portionMultiplier}x Multiplier`}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { mult: 0.5, label: '½ Half' },
                      { mult: 0.75, label: '¾ Light' },
                      { mult: 1.0, label: '1x Regular' },
                      { mult: 1.5, label: '1.5x Large' },
                      { mult: 2.0, label: '2x Double' },
                    ].map((item) => (
                      <button
                        key={item.mult}
                        onClick={() => handleMultiplierChange(item.mult)}
                        className={`py-1.5 px-1 rounded-xl text-xs font-extrabold transition-all text-center ${
                          portionMultiplier === item.mult
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Core Nutrition High-Impact Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Calories */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[11px] font-extrabold text-orange-900 uppercase tracking-wider block">
                      Calories
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-orange-950 mt-0.5">
                      {activeResult.calories}
                    </div>
                    <span className="text-[10px] font-bold text-orange-700">kcal energy</span>
                  </div>

                  {/* Carbohydrates & Net Carbs */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
                      Carbohydrates
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-blue-950 mt-0.5">
                      {activeResult.carbsGrams}g
                    </div>
                    <span className="text-[10px] font-bold text-blue-700">
                      Net: {activeResult.netCarbsGrams}g • Fiber: {activeResult.fiberGrams}g
                    </span>
                  </div>

                  {/* Sodium & Salt Check */}
                  <div
                    className={`border rounded-2xl p-3.5 text-center ${
                      activeResult.sodiumMg > 750
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : activeResult.sodiumMg > 450
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-wider block">
                      Sodium (Salt)
                    </span>
                    <div className="text-2xl sm:text-3xl font-black mt-0.5">
                      {activeResult.sodiumMg}
                    </div>
                    <span className="text-[10px] font-extrabold block">
                      mg ({activeResult.sodiumMg > 750 ? '⚠️ High' : activeResult.sodiumMg > 450 ? 'Moderate' : '🟢 Heart-Safe'})
                    </span>
                  </div>

                  {/* Protein & Healthy Fats */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                    <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                      Protein & Fats
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-0.5">
                      {activeResult.proteinGrams}g
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700">
                      Fat: {activeResult.fatGrams}g • Potassium: {activeResult.potassiumMg}mg
                    </span>
                  </div>
                </div>

                {/* Health Impact Indicators (Blood Pressure & Blood Sugar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Blood Pressure Impact */}
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                      activeResult.bloodPressureAssessment.status === 'high_sodium'
                        ? 'bg-rose-50/80 border-rose-300'
                        : activeResult.bloodPressureAssessment.status === 'moderate'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-emerald-50/80 border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>Blood Pressure Assessment</span>
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          activeResult.bloodPressureAssessment.status === 'high_sodium'
                            ? 'bg-rose-200 text-rose-900'
                            : activeResult.bloodPressureAssessment.status === 'moderate'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {activeResult.bloodPressureAssessment.ratingLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {activeResult.bloodPressureAssessment.details}
                    </p>
                  </div>

                  {/* Blood Sugar Impact */}
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                      activeResult.bloodSugarAssessment.status === 'spike_risk'
                        ? 'bg-rose-50/80 border-rose-300'
                        : activeResult.bloodSugarAssessment.status === 'moderate'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-blue-50/80 border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-blue-950">
                        <Flame className="w-4 h-4 text-amber-600" />
                        <span>Blood Sugar & Glucose Impact</span>
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          activeResult.bloodSugarAssessment.status === 'spike_risk'
                            ? 'bg-rose-200 text-rose-900'
                            : activeResult.bloodSugarAssessment.status === 'moderate'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {activeResult.bloodSugarAssessment.ratingLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {activeResult.bloodSugarAssessment.details}
                    </p>
                  </div>
                </div>

                {/* Detected Ingredients Breakdown */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>🥕 Identified Ingredients ({activeResult.ingredients.length})</span>
                    </h4>
                    {activeResult.allergens.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                          Contains: {activeResult.allergens.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeResult.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              ing.isHealthyHighlight
                                ? 'bg-emerald-500'
                                : ing.isCautionItem
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="font-bold text-slate-800">{ing.name}</span>
                        </div>
                        {ing.estimatedAmount && (
                          <span className="text-slate-500 font-semibold">{ing.estimatedAmount}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dining Out Smart Hacks & Swaps */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Doctor & Dietitian Dining Out Tips</span>
                    </span>
                    <ul className="space-y-1 text-xs font-semibold text-slate-700">
                      {activeResult.diningOutSmartTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-extrabold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activeResult.healthierModifications.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-600" />
                        <span>Easy Order Customizations for Next Time:</span>
                      </span>
                      <ul className="space-y-1 text-xs font-medium text-slate-600">
                        {activeResult.healthierModifications.map((mod, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-600 font-bold">✓</span>
                            <span>{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Links */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (onNavigateToRecipes) onNavigateToRecipes();
                    }}
                    className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Browse Salt-Free Recipes Library</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateToCheckin) onNavigateToCheckin();
                    }}
                    className="text-xs font-extrabold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    <span>Log into Daily Health Check-In</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center space-y-3">
                <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-xl font-extrabold text-slate-900">Ready to Scan Food</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Take a photo of your plate or pick a sample dish from the gallery to calculate calories, carbohydrates, and restaurant sodium instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SAMPLE MEALS GALLERY */}
      {activeSubTab === 'presets' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Sample Dining Out & Restaurant Dishes
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Click any meal to simulate an instant high-precision AI plate scan with full nutrition breakdown.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {PRESET_FOOD_DATABASE.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => handleSelectPreset(meal)}
                  className="group bg-slate-50 hover:bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-200">
                      <img
                        src={meal.photoUrl}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                        {meal.emoji} {meal.detectedCategory.split(' ')[0]}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                      {meal.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-900">
                        {meal.baseCalories} kcal
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                        {meal.baseCarbs}g carbs
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          meal.baseSodiumMg > 700
                            ? 'bg-rose-100 text-rose-900 font-extrabold'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {meal.baseSodiumMg}mg salt
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(meal);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Analyze This Dish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SCAN HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>My Scanned Meals History</span>
              </h3>
              <p className="text-xs text-slate-500">
                Log of dishes you have photographed and analyzed.
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-400">
              <History className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No scanned meals recorded yet</p>
              <p className="text-xs text-slate-400">
                Photos you take will be saved here so you can review your dining out nutrition over time.
              </p>
              <button
                onClick={() => setActiveSubTab('scanner')}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs"
              >
                Start First Scan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => {
                    setActiveResult(scan);
                    setCapturedImage(scan.imageUrl || null);
                    setActiveSubTab('scanner');
                  }}
                  className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 p-4 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-white border border-slate-200 flex-shrink-0">
                      {scan.emoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {scan.name}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full capitalize">
                          {scan.mealContext.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {scan.calories} kcal • {scan.carbsGrams}g carbs • {scan.sodiumMg}mg sodium
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveResult(scan);
                        setCapturedImage(scan.imageUrl || null);
                        setActiveSubTab('scanner');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs"
                    >
                      View Breakdown
                    </button>

                    <button
                      onClick={(e) => handleDeleteHistory(scan.id, e)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete scan entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
