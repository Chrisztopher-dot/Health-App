// Web Speech API wrapper for Text-to-Speech & Speech-to-Text

export class SpeechService {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  public static speak(text: string, rate: number = 0.9, onEnd?: () => void): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // 0.85 - 0.95 is ideal for seniors
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select a warm English voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google')))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

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
