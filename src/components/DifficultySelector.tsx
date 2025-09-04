import React from 'react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types/difficulty';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  className?: string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onDifficultyChange,
  className
}) => {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      <h3 className="text-lg font-bold text-electric-lavender text-center">
        Choose Difficulty
      </h3>
      
      <ToggleGroup
        type="single"
        value={selectedDifficulty}
        onValueChange={(value) => value && onDifficultyChange(value as DifficultyLevel)}
        className="grid grid-cols-1 gap-2"
      >
        {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
          const config = DIFFICULTY_CONFIGS[level];
          const isSelected = selectedDifficulty === level;
          
          return (
            <ToggleGroupItem
              key={level}
              value={level}
              className={`
                px-4 py-3 text-left flex items-center gap-3 
                bg-white/10 border border-white/20 rounded-lg
                hover:bg-white/20 transition-all duration-200
                data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500/30 data-[state=on]:to-pink-500/30
                data-[state=on]:border-purple-400/50 data-[state=on]:shadow-lg
                ${isSelected ? 'ring-2 ring-purple-400/50' : ''}
              `}
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-white capitalize">{level}</div>
                <div className="text-sm text-electric-lavender/80">
                  {config.description}
                </div>
              </div>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};