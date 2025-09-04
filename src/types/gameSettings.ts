export interface GameSettings {
  audioOffset: number; // in milliseconds (-200 to +200)
  noteSpeed: number; // multiplier (0.5 to 2.0)
  backgroundBrightness: number; // percentage (0 to 100)
  inputSensitivity: number; // multiplier (0.5 to 2.0)
  masterVolume: number; // percentage (0 to 100)
  sfxVolume: number; // percentage (0 to 100)
  showHitIndicators: boolean;
  showComboCounter: boolean;
  showAccuracyPercentage: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  audioOffset: 0,
  noteSpeed: 1.0,
  backgroundBrightness: 50,
  inputSensitivity: 1.0,
  masterVolume: 70,
  sfxVolume: 50,
  showHitIndicators: true,
  showComboCounter: true,
  showAccuracyPercentage: true,
};

export const SETTINGS_RANGES = {
  audioOffset: { min: -200, max: 200, step: 10 },
  noteSpeed: { min: 0.5, max: 2.0, step: 0.1 },
  backgroundBrightness: { min: 0, max: 100, step: 5 },
  inputSensitivity: { min: 0.5, max: 2.0, step: 0.1 },
  masterVolume: { min: 0, max: 100, step: 5 },
  sfxVolume: { min: 0, max: 100, step: 5 },
};