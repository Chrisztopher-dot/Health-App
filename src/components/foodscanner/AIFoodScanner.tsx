import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Video,
  Wheat,
  Activity,
  Check,
  Upload,
  Zap,
  RotateCcw,
  Search
} from 'lucide-react';

interface AIFoodScannerProps {
  profile: UserProfile;
  onNavigateToRecipes?: () => void;
  onNavigateToCheckin?: () => void;
}

// Utility: Resize and compress image to ensure fast, reliable analysis without memory lag
const resizeImageBase64 = (dataUrl: string, maxWidth = 1280, maxHeight = 1280): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

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
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [customDishQuery, setCustomDishQuery] = useState<string>('');

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
  const [savedToReminders, setSavedToReminders] = useState<boolean>(false);

  // Refs for video, canvas, and file inputs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize scan history only (do NOT pre-load sample recipe photo so user starts in fresh camera/upload mode)
  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = () => {
    const list = FoodScannerService.getScanHistory();
    setHistory(list);
  };

  // Attach camera stream to video element when active
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== cameraStream) {
        video.srcObject = cameraStream;
      }
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.muted = true;
      video.play().catch((err) => {
        console.warn('Video play interrupted:', err);
      });
    }
  }, [isCameraActive, cameraStream]);

  // Check if camera stream supports torch / flashlight
  useEffect(() => {
    if (cameraStream) {
      const track = cameraStream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = (track.getCapabilities && track.getCapabilities()) || {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } else {
      setHasTorch(false);
      setIsTorchOn(false);
    }
  }, [cameraStream]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setCameraLoading(false);
  }, [cameraStream]);

  // Start Live Camera with robust cascading fallback
  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    setCameraLoading(true);
    setActiveSubTab('scanner');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live camera stream is not supported in this browser window. Opening photo & camera file selector...'
      );
      setCameraLoading(false);
      mobileCameraInputRef.current?.click();
      return;
    }

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream | null = null;

      // 1. First attempt: ideal HD resolution + requested facing mode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (_) {
        // 2. Second attempt: simple facing mode constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (__) {
          // 3. Third attempt: basic video constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        setCameraFacingMode(facing);
        setIsCameraActive(true);
        setCameraLoading(false);
        setCapturedImage(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.warn);
        }
      }
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      setCameraLoading(false);
      setIsCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was blocked. Opening photo picker to take or select a photo...');
        galleryInputRef.current?.click();
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera detected. Opening photo gallery...');
        galleryInputRef.current?.click();
      } else {
        setCameraError('Could not start live stream. Please choose a photo from your gallery.');
      }
    }
  };

  // Toggle Camera Facing Mode (Front/Back)
  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  // Toggle Flashlight / Torch
  const toggleTorch = async () => {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Could not toggle torch:', err);
      }
    }
  };

  // Capture Frame from Live Video
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();

      const compressed = await resizeImageBase64(rawDataUrl);
      setCapturedImage(compressed);
      triggerAIAnalysis(compressed, 'camera_capture');
    }
  };

  // Process Chosen Photo or Video from Library / File System
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
        video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration / 2 : 0.5);
      };

      video.onseeked = async () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const compressed = await resizeImageBase64(dataUrl);
          setCapturedImage(compressed);
          triggerAIAnalysis(compressed, file.name);
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
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          const compressed = await resizeImageBase64(rawDataUrl);
          setCapturedImage(compressed);
          triggerAIAnalysis(compressed, file.name);
        }
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
    e.target.value = '';
  };

  // Drag and Drop support on plate viewport
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Trigger Visual AI Pipeline
  const triggerAIAnalysis = async (imageDataUrl: string, hint?: string) => {
    setIsAnalyzing(true);
    setSavedToReminders(false);
    setAnalysisStep('🔍 Segmenting food plate boundaries & portion volumes...');

    const stepTimer1 = setTimeout(() => {
      setAnalysisStep('🔬 Identifying ingredients, sauces, and cooking oils...');
    }, 450);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep('📊 Calculating carbohydrates, dietary fiber & glycemic load...');
    }, 900);

    const stepTimer3 = setTimeout(() => {
      setAnalysisStep('🧂 Evaluating restaurant sodium vs. cardiovascular health...');
    }, 1350);

    try {
      const result = await FoodScannerService.analyzeImage(imageDataUrl, hint || customDishQuery);
      const matchedPreset = PRESET_FOOD_DATABASE.find((p) => p.name === result.name) || PRESET_FOOD_DATABASE[0];
      setBasePreset(matchedPreset);
      setPortionMultiplier(1.0);
      result.mealContext = selectedMealContext;
      setActiveResult(result);
      setCustomDishQuery(result.name);
      FoodScannerService.saveScanToHistory(result);
      loadScanHistory();

      const successMsg = `Plate analyzed: ${result.name} (${result.calories} kcal, ${result.carbsGrams}g carbs)`;
      setFeedbackMessage(successMsg);
      if (profile.soundEnabled) {
        SpeechService.speak(
          `Scanned ${result.name}. Estimated ${result.calories} calories, ${result.carbsGrams} grams carbohydrates, and ${result.sodiumMg} milligrams sodium.`,
          profile.voiceSpeed
        );
      }
    } catch (e) {
      console.error(e);
      setFeedbackMessage('Could not complete food analysis. Please try another photo.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Handle manual dish query search / fine-tuning
  const handleSearchDish = () => {
    if (!customDishQuery.trim()) return;
    const result = FoodScannerService.searchAndAnalyzeDish(customDishQuery, portionMultiplier, selectedMealContext);
    if (capturedImage) {
      result.imageUrl = capturedImage;
    }
    setActiveResult(result);
    FoodScannerService.saveScanToHistory(result);
    loadScanHistory();

    const successMsg = `Loaded breakdown for: ${result.name}`;
    setFeedbackMessage(successMsg);
    if (profile.soundEnabled) {
      SpeechService.speak(
        `${result.name}. Estimated ${result.calories} calories, ${result.carbsGrams} grams carbs, and ${result.sodiumMg} milligrams sodium.`,
        profile.voiceSpeed
      );
    }
  };

  // Select a preset food item
  const handleSelectPreset = (preset: PresetFoodItem) => {
    stopCamera();
    setBasePreset(preset);
    setCapturedImage(preset.photoUrl);
    setPortionMultiplier(1.0);
    setCustomDishQuery(preset.name);
    setSavedToReminders(false);
    const result = FoodScannerService.calculateNutrition(preset, 1.0, selectedMealContext);
    setActiveResult(result);
    FoodScannerService.saveScanToHistory(result);
    loadScanHistory();
    setActiveSubTab('scanner');

    const msg = `Loaded dish: ${preset.name}`;
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
    if (activeResult) {
      if (basePreset && basePreset.name === activeResult.name) {
        const updated = FoodScannerService.calculateNutrition(basePreset, mult, selectedMealContext);
        if (capturedImage && !capturedImage.startsWith('http')) {
          updated.imageUrl = capturedImage;
        }
        setActiveResult(updated);
      } else {
        const updated = FoodScannerService.searchAndAnalyzeDish(activeResult.name, mult, selectedMealContext);
        if (capturedImage) {
          updated.imageUrl = capturedImage;
        }
        setActiveResult(updated);
      }
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

  // Save to Reminders / Food Log Notes
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
      notes: `Scanned Meal Details:\n• Calories: ${activeResult.calories} kcal\n• Carbs: ${activeResult.carbsGrams}g (Fiber: ${activeResult.fiberGrams}g)\n• Sodium: ${activeResult.sodiumMg}mg\n• Context: ${activeResult.mealContext}\n• Ingredients: ${ingredientList}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    HealthStorageService.addReminder(newReminder);
    setSavedToReminders(true);
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
      {/* Hidden canvas for webcam frame snapshot & image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Glassmorphic Container Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 text-white">
        {/* Top Header & Sub-Navigation */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Camera & Photo Food Scanner
              </span>
              <span className="text-xs font-bold text-slate-400 bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-rose-400" />
                Real-Time Ingredient Breakdown • Calories • Carbs • Sodium
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <span>AI Food & Plate Scanner</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-3xl leading-relaxed">
              Snap a picture with your live camera or upload any food photo from your library. The visual AI model identifies every ingredient and calculates calories, carbs, and sodium from the detected foods!
            </p>
          </div>

          {/* Sub-Navigation Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-full lg:w-auto self-stretch lg:self-center flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setActiveSubTab('scanner')}
              className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSubTab === 'scanner'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Food Scanner</span>
            </button>

            <button
              onClick={() => {
                stopCamera();
                setActiveSubTab('presets');
              }}
              className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSubTab === 'presets'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Sample Dishes</span>
            </button>

            <button
              onClick={() => {
                stopCamera();
                setActiveSubTab('history');
              }}
              className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 relative cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-400 hover:text-emerald-300 font-black text-xs px-2 py-1 rounded-lg hover:bg-emerald-900/50 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SUBTAB 1: LIVE CAMERA & PHOTO SCANNER */}
        {activeSubTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Camera / Photo Capture Section */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-inner space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Food Photo & Camera View</span>
                  </h3>

                  {/* Meal Context Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-bold hidden sm:inline">Context:</span>
                    <select
                      value={selectedMealContext}
                      onChange={(e) => handleContextChange(e.target.value as MealContext)}
                      aria-label="Meal dining context"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="restaurant">🍽️ Restaurant</option>
                      <option value="at_friends">👥 At Friends / Party</option>
                      <option value="cafe">☕ Cafe / Brunch</option>
                      <option value="takeout">🥡 Takeout Meal</option>
                      <option value="home_cooked">🏡 Home Cooked</option>
                    </select>
                  </div>
                </div>

                {/* Live Video / Captured Photo Viewport with Drag and Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border shadow-2xl flex items-center justify-center transition-all ${
                    isDraggingOver
                      ? 'border-emerald-400 ring-4 ring-emerald-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && cameraStream && el.srcObject !== cameraStream) {
                            el.srcObject = cameraStream;
                            el.setAttribute('playsinline', 'true');
                            el.setAttribute('autoplay', 'true');
                            el.muted = true;
                            el.play().catch(console.warn);
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Camera Target HUD Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="w-full h-full border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-center justify-center relative">
                          {/* Corner Reticles */}
                          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />

                          <div className="bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xl">
                            <Scan className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span>Center Food Plate</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Torch & Facing Controls Overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                        {hasTorch && (
                          <button
                            onClick={toggleTorch}
                            className={`p-2 rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                              isTorchOn
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-900/80 text-slate-300 border-slate-700'
                            }`}
                            title="Toggle Flashlight / Torch"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={toggleCameraFacingMode}
                          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
                          title="Flip Camera (Front/Back)"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : capturedImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={capturedImage}
                        alt="Scanned Food Plate"
                        className="w-full h-full object-cover"
                      />

                      {/* Quick Action Overlay on photo */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <button
                          onClick={() => {
                            if (capturedImage) triggerAIAnalysis(capturedImage, customDishQuery || 'rescan');
                          }}
                          className="px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-emerald-300 border border-emerald-500/40 rounded-xl backdrop-blur-md text-xs font-black flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                          title="Re-analyze this photo"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Re-Analyze</span>
                        </button>
                      </div>

                      {/* Floating bottom pill on photo for immediate camera or upload */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 z-10">
                        <button
                          onClick={() => startCamera()}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Live Camera</span>
                        </button>
                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-white font-black text-xs shadow-lg backdrop-blur-md border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Pick Photo</span>
                        </button>
                      </div>

                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-30">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                            <Scan className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-sm sm:text-base text-emerald-300 animate-pulse">
                              {analysisStep || 'Segmenting plate ingredients with AI...'}
                            </p>
                            <p className="text-xs text-slate-400">
                              Detecting proteins, vegetables, carbs, sauces & sodium load
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                        <Camera className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <p className="text-sm font-black text-white">
                          Food Scanner Viewport
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Position your meal plate in the center. Use the controls below to start live camera or upload a picture.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Error Notice if any */}
                {cameraError && (
                  <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center justify-between gap-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-black border border-rose-700 transition-colors flex-shrink-0"
                    >
                      Pick Photo
                    </button>
                  </div>
                )}

                {/* Capture & Upload Control Buttons */}
                <div className="space-y-2.5">
                  {isCameraActive ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCapturePhoto}
                        className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                        <span>Snap Photo & Detect</span>
                      </button>

                      <button
                        onClick={toggleCameraFacingMode}
                        className="py-3.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                        title="Flip between front and back camera"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-300" />
                        <span>Flip Camera</span>
                      </button>

                      <button
                        onClick={stopCamera}
                        className="col-span-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-slate-800 cursor-pointer transition-colors"
                      >
                        <CameraOff className="w-3.5 h-3.5" />
                        <span>Close Live Camera</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Exactly ONE Clean Pair of Primary Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          onClick={() => startCamera()}
                          disabled={cameraLoading}
                          className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                          <span>{cameraLoading ? 'Starting Camera...' : 'Start Live Camera'}</span>
                        </button>

                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-black text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:border-slate-600 cursor-pointer"
                          title="Upload photo from phone or computer gallery"
                        >
                          <Upload className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>Upload from Library</span>
                        </button>
                      </div>

                      {/* Secondary Mobile Direct Camera / Video Pickers */}
                      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-bold pt-1">
                        <button
                          onClick={() => mobileCameraInputRef.current?.click()}
                          className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Camera Snap</span>
                        </button>

                        <span>•</span>

                        <button
                          onClick={() => galleryInputRef.current?.click()}
                          className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Photos & Videos</span>
                        </button>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*,video/*,.mp4,.mov,.webm,.m4v,.png,.jpg,.jpeg,.heic,.webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <input
                        ref={mobileCameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Instant Dish Name Fine-Tuning & Search Bar */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Search or Fine-Tune Food Name:</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customDishQuery}
                      onChange={(e) => setCustomDishQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchDish();
                      }}
                      placeholder="e.g. Salmon with asparagus, Greek salad, Lentil soup..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                    />

                    <button
                      onClick={handleSearchDish}
                      className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Analyze</span>
                    </button>
                  </div>
                </div>

                {/* Quick Test Demo Plates helper */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Try Test Food Scan:</span>
                    </span>
                    <button
                      onClick={() => {
                        stopCamera();
                        setActiveSubTab('presets');
                      }}
                      className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      Browse Samples →
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_FOOD_DATABASE.slice(0, 4).map((dish) => (
                      <button
                        key={dish.id}
                        onClick={() => handleSelectPreset(dish)}
                        className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          basePreset?.id === dish.id && activeResult?.name === dish.name
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={dish.name}
                      >
                        <span className="text-xl sm:text-2xl">{dish.emoji}</span>
                        <span className="text-[10px] font-black line-clamp-1 leading-tight">
                          {dish.name.split(' ')[0]} {dish.name.split(' ')[1] || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Senior Dining & Blood Pressure Quick Guide */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-inner space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Senior Dining & Sodium Safety Tips</span>
                </div>
                <ul className="text-xs space-y-2 font-medium text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">•</span>
                    <span><strong className="text-white">Sauces & Dressings:</strong> Restaurant sauces often contain 400-800mg of hidden sodium. Request them on the side.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">•</span>
                    <span><strong className="text-white">Potassium Balance:</strong> Veggies like spinach, broccoli, and sweet potatoes help balance blood pressure naturally.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: AI Ingredient Breakdown & Nutrient Engine */}
            <div className="lg:col-span-7 space-y-5">
              {activeResult ? (
                <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-inner space-y-6">
                  {/* Result Title & Confidence */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span>{activeResult.emoji}</span>
                          <span>{activeResult.detectedCategory}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          ✨ {activeResult.confidenceScore}% AI Confidence
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          📍 {activeResult.mealContext.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        {activeResult.name}
                      </h3>
                    </div>

                    {/* Audio Read & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={handleReadAloud}
                        className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          isReadingAloud
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        }`}
                        title="Read nutrition breakdown aloud"
                      >
                        {isReadingAloud ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                        <span>{isReadingAloud ? 'Stop' : 'Read Aloud'}</span>
                      </button>

                      <button
                        onClick={handleSaveIngredientsToReminders}
                        className={`px-3 py-2 rounded-xl border font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                          savedToReminders
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Save nutrition and notes to Reminders"
                      >
                        {savedToReminders ? (
                          <>
                            <Check className="w-4 h-4 text-slate-950" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Save Note</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 🥗 HERO SECTION 1: DETECTED INGREDIENTS BREAKDOWN (Main Focus) */}
                  <div className="space-y-3 bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">🥗</span>
                          <span>AI Detected Ingredients Breakdown ({activeResult.ingredients.length})</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ingredients segmented from photo to calculate clinical nutrition & sodium load
                        </p>
                      </div>

                      {activeResult.allergens.length > 0 && (
                        <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
                          Allergens: {activeResult.allergens.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {activeResult.ingredients.map((ing, idx) => {
                        // Determine category tag style
                        const categoryIcons: Record<string, { label: string; icon: string; style: string }> = {
                          protein: { label: 'Protein', icon: '🥩', style: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
                          vegetable: { label: 'Veggies', icon: '🥦', style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
                          carb: { label: 'Carbs', icon: '🍚', style: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
                          fat: { label: 'Fat / Oil', icon: '🥑', style: 'bg-lime-500/10 text-lime-300 border-lime-500/30' },
                          sauce: { label: 'Sauce', icon: '🥣', style: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
                          seasoning: { label: 'Seasoning', icon: '🧂', style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
                          dairy: { label: 'Dairy', icon: '🧀', style: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
                          fruit: { label: 'Fruit', icon: '🍎', style: 'bg-pink-500/10 text-pink-300 border-pink-500/30' },
                        };
                        const cat = categoryIcons[ing.category] || { label: ing.category, icon: '🥗', style: 'bg-slate-800 text-slate-300 border-slate-700' };

                        return (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-xs transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{cat.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-xs sm:text-sm block">
                                    {ing.name}
                                  </span>
                                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-1 ${cat.style}`}>
                                    {cat.label}
                                  </span>
                                </div>
                              </div>
                              {ing.estimatedAmount && (
                                <span className="text-slate-300 font-bold text-xs bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 whitespace-nowrap">
                                  {ing.estimatedAmount}
                                </span>
                              )}
                            </div>

                            {/* Ingredient highlight or caution note */}
                            {ing.isHealthyHighlight && (
                              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span>Heart & nutrient rich ingredient</span>
                              </div>
                            )}
                            {ing.isCautionItem && (
                              <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span>Higher sodium / fat content</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 📊 SECTION 2: CALCULATED NUTRITION FROM DETECTED INGREDIENTS */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Calculated Nutritional Values</span>
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400">
                        Based on detected plate portion
                      </span>
                    </div>

                    {/* Portion Size Adjustment Bar */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <span>Adjust Serving / Multiplier:</span>
                        </span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full self-start sm:self-auto">
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
                            className={`py-2 px-1 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
                              portionMultiplier === item.mult
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
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
                      <div className="bg-slate-900/80 border border-orange-500/30 rounded-2xl p-3.5 text-center space-y-0.5">
                        <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider block">
                          Calories
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          {activeResult.calories}
                        </div>
                        <span className="text-[10px] font-bold text-orange-300">kcal calculated</span>
                      </div>

                      {/* Carbohydrates & Net Carbs */}
                      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-3.5 text-center space-y-0.5">
                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider block">
                          Carbohydrates
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          {activeResult.carbsGrams}g
                        </div>
                        <span className="text-[10px] font-bold text-cyan-300">
                          Net: {activeResult.netCarbsGrams}g • Fiber: {activeResult.fiberGrams}g
                        </span>
                      </div>

                      {/* Sodium & Salt Check */}
                      <div
                        className={`border rounded-2xl p-3.5 text-center space-y-0.5 ${
                          activeResult.sodiumMg > 750
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            : activeResult.sodiumMg > 450
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider block text-slate-300">
                          Sodium (Salt)
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          {activeResult.sodiumMg}
                        </div>
                        <span className="text-[10px] font-black block">
                          mg ({activeResult.sodiumMg > 750 ? '⚠️ High Salt Alert' : activeResult.sodiumMg > 450 ? 'Moderate' : '🟢 Heart-Safe'})
                        </span>
                      </div>

                      {/* Protein & Healthy Fats */}
                      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-3.5 text-center space-y-0.5">
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
                          Protein & Fats
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                          {activeResult.proteinGrams}g
                        </div>
                        <span className="text-[10px] font-bold text-emerald-300">
                          Fat: {activeResult.fatGrams}g • K+: {activeResult.potassiumMg}mg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Health Impact Indicators (Blood Pressure & Blood Sugar) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Blood Pressure Impact */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        activeResult.bloodPressureAssessment.status === 'high_sodium'
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : activeResult.bloodPressureAssessment.status === 'moderate'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-emerald-950/30 border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-white">
                          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                          <span>Blood Pressure Assessment</span>
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                            activeResult.bloodPressureAssessment.status === 'high_sodium'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : activeResult.bloodPressureAssessment.status === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {activeResult.bloodPressureAssessment.ratingLabel}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed">
                        {activeResult.bloodPressureAssessment.details}
                      </p>
                    </div>

                    {/* Blood Sugar Impact */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        activeResult.bloodSugarAssessment.status === 'spike_risk'
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : activeResult.bloodSugarAssessment.status === 'moderate'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-cyan-950/30 border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-white">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span>Blood Sugar & Glycemic</span>
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                            activeResult.bloodSugarAssessment.status === 'spike_risk'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : activeResult.bloodSugarAssessment.status === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {activeResult.bloodSugarAssessment.ratingLabel}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed">
                        {activeResult.bloodSugarAssessment.details}
                      </p>
                    </div>
                  </div>

                  {/* Dining Out Smart Hacks & Swaps */}
                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Dietitian Dining Out Tips</span>
                      </span>
                      <ul className="space-y-1.5 text-xs font-medium text-slate-300">
                        {activeResult.diningOutSmartTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-black">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {activeResult.healthierModifications.length > 0 && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-cyan-400" />
                          <span>Easy Customizations for Next Time:</span>
                        </span>
                        <ul className="space-y-1.5 text-xs font-medium text-slate-300">
                          {activeResult.healthierModifications.map((mod, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">✓</span>
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Bottom Navigation Links */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        if (onNavigateToRecipes) onNavigateToRecipes();
                      }}
                      className="text-xs font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wheat className="w-3.5 h-3.5" />
                      <span>Browse Low-Sodium Recipes Category</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (onNavigateToCheckin) onNavigateToCheckin();
                      }}
                      className="text-xs font-black text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Log into Daily Health Check-In</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ✨ Interactive AI Ingredient Engine Studio Launchpad (When No Photo is Scanned) */
                <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-inner">
                  <div className="border-b border-slate-800 pb-5 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI Ingredient & Nutrient Engine</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Ready to Scan & Calculate Meal Ingredients
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                      Upload a photo or point your live camera at your dish. The AI vision model segments each individual ingredient to calculate precise calories, carbs, and sodium.
                    </p>
                  </div>

                  {/* 3-Step Ingredient Detection Workflow */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                          📸
                        </div>
                        <h4 className="font-extrabold text-sm text-white">1. Capture Meal</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Take a photo using the live camera or choose any picture from your gallery.
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                        Live / Gallery
                      </span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg">
                          🥗
                        </div>
                        <h4 className="font-extrabold text-sm text-white">2. Detect Ingredients</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          AI detects proteins, vegetables, carbs, fats, sauces & sodium seasonings.
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wide">
                        Visual Segmentation
                      </span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                          ⚡
                        </div>
                        <h4 className="font-extrabold text-sm text-white">3. Calculate Nutrients</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Calculates total calories, net carbs, salt load, and blood pressure safety.
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide">
                        Clinical Math
                      </span>
                    </div>
                  </div>

                  {/* AI Vision Insights & Accuracy Badge */}
                  <div className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm text-white">
                        AI Clinical Nutrition Engine
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Evaluates ingredients against clinical low-sodium (&lt;140mg) guidelines and checks blood pressure / glycemic impact in real time.
                      </p>
                    </div>
                  </div>

                  {/* Link to Recipes category for cooking */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-medium">
                      Looking for low-sodium cooking recipes and meal prep guides?
                    </span>
                    <button
                      onClick={() => {
                        if (onNavigateToRecipes) onNavigateToRecipes();
                      }}
                      className="font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Go to Recipes Tab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: SAMPLE MEALS GALLERY */}
        {activeSubTab === 'presets' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-inner space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Sample Dining Out & Restaurant Dishes
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Click any dish to simulate an instant high-precision AI plate scan with full clinical nutrition breakdown.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {PRESET_FOOD_DATABASE.map((meal) => (
                  <div
                    key={meal.id}
                    onClick={() => handleSelectPreset(meal)}
                    className="group bg-slate-900/90 hover:bg-slate-850 rounded-2xl border border-slate-800 hover:border-emerald-500/60 p-4 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img
                          src={meal.photoUrl}
                          alt={meal.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                          {meal.emoji} {meal.detectedCategory.split(' ')[0]}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-sm leading-snug line-clamp-2">
                        {meal.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {meal.baseCalories} kcal
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {meal.baseCarbs}g carbs
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md border ${
                            meal.baseSodiumMg > 700
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
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
                      className="w-full py-2.5 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <span>Analyze This Plate</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SCAN HISTORY */}
        {activeSubTab === 'history' && (
          <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-inner space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  <span>My Scanned Meals History</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological record of dishes photographed and analyzed.
                </p>
              </div>

              {history.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-12 text-center space-y-3 text-slate-500">
                <History className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-black text-slate-300">No scanned meals recorded yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Photos you take will be saved here so you can review your dining out nutrition over time.
                </p>
                <button
                  onClick={() => setActiveSubTab('scanner')}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md"
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
                      setCustomDishQuery(scan.name);
                      setActiveSubTab('scanner');
                    }}
                    className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                        {scan.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-sm sm:text-base">
                            {scan.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full capitalize">
                            {scan.mealContext.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
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
                          setCustomDishQuery(scan.name);
                          setActiveSubTab('scanner');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                      >
                        View Breakdown
                      </button>

                      <button
                        onClick={(e) => handleDeleteHistory(scan.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
    </div>
  );
};
