// Web Speech API wrapper for Text-to-Speech & Speech-to-Text with multi-voice selection

export interface VoicePersona {
  id: string;
  name: string;
  label: string;
  description: string;
  gender: 'female' | 'male' | 'neutral';
  accent: string;
  emoji: string;
  matchKeywords: string[];
  defaultPitch: number;
  sampleText: string;
}

export const CURATED_VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'samantha',
    name: 'Samantha',
    label: 'Samantha • Warm & Gentle',
    description: 'Warm, compassionate, and friendly. Great for daily health check-ins.',
    gender: 'female',
    accent: 'US English',
    emoji: '👩‍🦳',
    matchKeywords: ['samantha', 'ava', 'allison', 'natural', 'victoria', 'female', 'en-us'],
    defaultPitch: 1.0,
    sampleText: "Good morning! I'm Samantha. I'm here to help you record your daily health and medications.",
  },
  {
    id: 'alex',
    name: 'Alex',
    label: 'Alex • Calm & Steady',
    description: 'Clear, reassuring, and comforting tone for relaxed listening.',
    gender: 'male',
    accent: 'US English',
    emoji: '👨‍🦳',
    matchKeywords: ['alex', 'tom', 'david', 'evan', 'male', 'en-us'],
    defaultPitch: 1.0,
    sampleText: "Hello there. I'm Alex. Let's take a look at your wellness and blood pressure readings today.",
  },
  {
    id: 'daniel',
    name: 'Daniel',
    label: 'Daniel • British Accent',
    description: 'Polite, clear, and distinguished British accent.',
    gender: 'male',
    accent: 'UK English',
    emoji: '🇬🇧',
    matchKeywords: ['daniel', 'oliver', 'george', 'en-gb', 'british'],
    defaultPitch: 0.95,
    sampleText: "Good day! I'm Daniel. It's a pleasure to assist you with your health check-in today.",
  },
  {
    id: 'karen',
    name: 'Karen',
    label: 'Karen • Australian Accent',
    description: 'Bright, cheerful, and friendly Australian tone.',
    gender: 'female',
    accent: 'AU English',
    emoji: '🇦🇺',
    matchKeywords: ['karen', 'catherine', 'moira', 'fiona', 'en-au', 'australian'],
    defaultPitch: 1.05,
    sampleText: "G'day! I'm Karen. Ready whenever you are to check in on how you're feeling today.",
  },
  {
    id: 'victoria',
    name: 'Victoria',
    label: 'Victoria • Serene & Soft',
    description: 'Soft-spoken, peaceful, and relaxing tone for calm conversation.',
    gender: 'female',
    accent: 'US English',
    emoji: '🌸',
    matchKeywords: ['victoria', 'serena', 'susan', 'en-us'],
    defaultPitch: 1.1,
    sampleText: "Hello. I'm Victoria. Take your time, relax, and let's go over how your morning is going.",
  },
  {
    id: 'arthur',
    name: 'Arthur',
    label: 'Arthur • Deep & Resonant',
    description: 'Deeper voice pitch, steady and easy to hear for low-frequency preference.',
    gender: 'male',
    accent: 'US English',
    emoji: '🎙️',
    matchKeywords: ['fred', 'arthur', 'ralph', 'bruce', 'deep', 'male'],
    defaultPitch: 0.85,
    sampleText: "Hello. I'm Arthur. All your health records are safe and securely saved on your device.",
  },
];

export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static activeVoiceURI: string | null = null;
  private static activePersonaId: string = 'samantha';
  private static activePitch: number = 1.0;

  static {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.refreshVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }
    }
  }

  public static refreshVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    try {
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        this.cachedVoices = voices;
      }
      return this.cachedVoices;
    } catch (_) {
      return [];
    }
  }

  public static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0) {
      this.refreshVoices();
    }
    return this.cachedVoices;
  }

  public static getCuratedPersonas(): VoicePersona[] {
    return CURATED_VOICE_PERSONAS;
  }

  public static setActiveVoiceConfig(config: { voicePersona?: string; voiceId?: string; voicePitch?: number }): void {
    if (config.voicePersona) this.activePersonaId = config.voicePersona;
    if (config.voiceId !== undefined) this.activeVoiceURI = config.voiceId;
    if (config.voicePitch !== undefined) this.activePitch = config.voicePitch;
  }

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  private static resolveBestVoice(voiceIdOrPersona?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    const target = (voiceIdOrPersona || this.activeVoiceURI || this.activePersonaId || 'samantha').toLowerCase();

    // 1. Direct match by voiceURI or exact name
    const exactVoice = voices.find(
      (v) => v.voiceURI.toLowerCase() === target || v.name.toLowerCase() === target
    );
    if (exactVoice) return exactVoice;

    // 2. Check if target matches a curated persona
    const persona = CURATED_VOICE_PERSONAS.find((p) => p.id === target || p.name.toLowerCase() === target);
    if (persona) {
      for (const kw of persona.matchKeywords) {
        const matched = voices.find(
          (v) => v.name.toLowerCase().includes(kw) || v.lang.toLowerCase().includes(kw)
        );
        if (matched) return matched;
      }
    }

    // 3. Match keyword in target
    const partialMatch = voices.find(
      (v) => v.name.toLowerCase().includes(target) || v.lang.toLowerCase().includes(target)
    );
    if (partialMatch) return partialMatch;

    // 4. Default to warm English voice
    const fallbackEnglish = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Natural') || v.name.includes('Google'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    return fallbackEnglish || voices[0] || null;
  }

  public static speak(
    text: string, 
    rate: number = 1.0, 
    onEnd?: () => void, 
    voiceOption?: string,
    pitch?: number
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // 1.0 is standard normal talking speed
      
      const chosenVoice = this.resolveBestVoice(voiceOption);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      // Resolve pitch
      let resolvedPitch = pitch !== undefined ? pitch : this.activePitch;
      if (pitch === undefined && voiceOption) {
        const persona = CURATED_VOICE_PERSONAS.find((p) => p.id === voiceOption);
        if (persona) resolvedPitch = persona.defaultPitch;
      }
      utterance.pitch = Math.max(0.6, Math.min(1.5, resolvedPitch));
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      if (onEnd) onEnd();
    }
  }

  public static stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): () => void {
    if (typeof window === 'undefined') {
      onError('Speech recognition not available in this environment');
      return () => {};
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      onError('Voice recognition is not supported in this browser. You can still type your responses.');
      return () => {};
    }

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          onResult(final.trim(), true);
        } else if (interim) {
          onResult(interim.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        onError(event.error || 'Microphone error');
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch (_) {}
      };
    } catch (err: any) {
      onError(err.message || 'Could not access microphone');
      return () => {};
    }
  }

  public static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
  }
}
