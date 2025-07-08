/**
 * Sound Service for handling notification sounds
 */

export interface SoundOptions {
  volume?: number;
  type?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

class SoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
    // Preload notification sounds
    this.preloadSounds();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Preload notification sound files
   */
  private preloadSounds() {
    const soundFiles = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3',
      default: '/sounds/notification.mp3'
    };

    Object.entries(soundFiles).forEach(([type, url]) => {
      try {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = 0.3;
        this.audioCache.set(type, audio);
      } catch (error) {
        console.warn(`Failed to preload sound ${type}:`, error);
      }
    });
  }

  /**
   * Play audio file if available, fallback to generated sound
   */
  private playAudioFile(type: string, volume: number = 0.3): boolean {
    const audio = this.audioCache.get(type);
    if (audio) {
      try {
        audio.volume = volume;
        audio.currentTime = 0; // Reset to beginning
        audio.play().catch(error => {
          console.warn(`Failed to play audio file ${type}:`, error);
          return false;
        });
        return true;
      } catch (error) {
        console.warn(`Error playing audio file ${type}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Enable or disable notification sounds
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  /**
   * Check if sounds are enabled
   */
  isEnabledForUser(): boolean {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }

  /**
   * Generate a notification sound using Web Audio API
   */
  private generateSound(frequency: number, duration: number, volume: number = 0.1, waveType: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled || !this.isEnabledForUser()) return;

    // Resume audio context if suspended (required for some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    // Create a more pleasant sound with filtering
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configure oscillator
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = waveType;

    // Configure filter for smoother sound
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
    filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);

    // Configure gain envelope for smooth attack and decay
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02); // Smooth attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play notification sound based on type
   */
  playNotificationSound(options: SoundOptions = {}) {
    if (!this.isEnabled || !this.isEnabledForUser()) return;

    const { volume = 0.3, type = 'default' } = options;

    // Try to play audio file first
    if (this.playAudioFile(type, volume)) {
      return;
    }

    // Fallback to generated sounds
    switch (type) {
      case 'success':
        // Higher pitch for success - pleasant ascending tones
        this.generateSound(523, 0.15, volume); // C5
        setTimeout(() => this.generateSound(659, 0.15, volume), 100); // E5
        setTimeout(() => this.generateSound(784, 0.2, volume), 200); // G5
        break;
      
      case 'error':
        // Lower pitch for errors - descending warning tones
        this.generateSound(400, 0.2, volume);
        setTimeout(() => this.generateSound(350, 0.2, volume), 150);
        setTimeout(() => this.generateSound(300, 0.3, volume), 300);
        break;
      
      case 'warning':
        // Medium pitch for warnings - attention-grabbing pattern
        this.generateSound(600, 0.1, volume);
        setTimeout(() => this.generateSound(600, 0.1, volume), 150);
        setTimeout(() => this.generateSound(600, 0.15, volume), 300);
        break;
      
      case 'info':
        // Clean tone for info - simple and pleasant
        this.generateSound(523, 0.2, volume); // C5
        setTimeout(() => this.generateSound(659, 0.2, volume), 150); // E5
        break;
      
      default:
        // Standard notification sound - gentle and non-intrusive
        this.generateSound(440, 0.2, volume); // A4
        setTimeout(() => this.generateSound(523, 0.15, volume), 200); // C5
        break;
    }
  }

  /**
   * Play system alert sound
   */
  playAlertSound() {
    if (!this.audioContext || !this.isEnabled || !this.isEnabledForUser()) return;

    // Three quick beeps
    this.generateSound(800, 0.1, 0.15);
    setTimeout(() => this.generateSound(800, 0.1, 0.15), 150);
    setTimeout(() => this.generateSound(800, 0.1, 0.15), 300);
  }

  /**
   * Test sound functionality
   */
  testSound() {
    this.playNotificationSound({ type: 'info', volume: 0.3 });
  }

  /**
   * Test all notification sound types
   */
  testAllSounds() {
    const types: Array<'success' | 'warning' | 'error' | 'info' | 'default'> = ['success', 'info', 'warning', 'error', 'default'];
    
    types.forEach((type, index) => {
      setTimeout(() => {
        console.log(`Playing ${type} sound`);
        this.playNotificationSound({ type, volume: 0.3 });
      }, index * 1500); // 1.5 second delay between each sound
    });
  }
}

// Create and export singleton instance
const soundService = new SoundService();
export default soundService;