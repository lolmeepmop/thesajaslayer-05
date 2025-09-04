export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultySettings {
  level: DifficultyLevel;
  speedMultiplier: number;
  noteCapacity: number; // Max notes per bar
  timingWindow: number; // Hit window tolerance in milliseconds
  holdNoteFrequency: number; // 0-1, how often to add hold notes
  complexPatterns: boolean; // Whether to use complex patterns
  description: string;
  icon: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultySettings> = {
  easy: {
    level: 'easy',
    speedMultiplier: 0.8,
    noteCapacity: 4,
    timingWindow: 150,
    holdNoteFrequency: 0.3,
    complexPatterns: false,
    description: 'Slower speed, fewer notes, relaxed timing window',
    icon: '🔵'
  },
  medium: {
    level: 'medium', 
    speedMultiplier: 1.0,
    noteCapacity: 6,
    timingWindow: 100,
    holdNoteFrequency: 0.5,
    complexPatterns: true,
    description: 'Default setting, balanced difficulty',
    icon: '🟣'
  },
  hard: {
    level: 'hard',
    speedMultiplier: 1.3,
    noteCapacity: 8,
    timingWindow: 75,
    holdNoteFrequency: 0.7,
    complexPatterns: true,
    description: 'Faster speed, denser notes, tighter timing',
    icon: '🔴'
  }
};

export const getDifficultyConfig = (level: DifficultyLevel): DifficultySettings => {
  return DIFFICULTY_CONFIGS[level];
};