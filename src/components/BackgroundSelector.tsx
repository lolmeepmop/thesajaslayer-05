import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Shuffle } from 'lucide-react';

export interface BackgroundOption {
  id: string;
  name: string;
  imagePath: string;
  category: 'stage' | 'bonus';
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'stage1', name: 'Stage 1: "Debut or Die Trying (First Stage)"', imagePath: '/lovable-uploads/12d3e3f6-6109-4398-8ab2-f0579d342e9f.png', category: 'stage' },
  { id: 'stage2', name: 'Stage 2: "The Eyes Behind the Hair"', imagePath: '/lovable-uploads/a5a140eb-6183-45a9-9155-9064030a0f51.png', category: 'stage' },
  { id: 'stage3', name: 'Stage 3: "Battle with the Showoff"', imagePath: '/lovable-uploads/695a30f1-9981-4fc0-9691-563319872f86.png', category: 'stage' },
  { id: 'stage4', name: 'Stage 4: "Don\'t Fall for the Beat"', imagePath: '/lovable-uploads/a76fc892-c505-44de-b79c-2deeebf4b00f.png', category: 'stage' },
  { id: 'stage5', name: 'Stage 5: "Cute Can Be Cruel"', imagePath: '/lovable-uploads/bc1b473d-7e12-4d5b-8abd-6fe2997572e5.png', category: 'stage' },
  { id: 'stage6', name: 'Stage 6: "Leader\'s Final Note"', imagePath: '/lovable-uploads/63013381-c47a-40f7-8ae6-243a877fff22.png', category: 'stage' },
  { id: 'stage7', name: 'Stage 7: "Encore of the Damned"', imagePath: '/lovable-uploads/50805a81-529d-44e2-b4eb-a42fb5fda7a2.png', category: 'stage' },
  { id: 'bonus1', name: 'Bonus Room 1: "Member B Visual"', imagePath: '/lovable-uploads/24aa969f-156d-4d7c-9092-8ce076fa093a.png', category: 'bonus' },
  { id: 'bonus2', name: 'Bonus Room 2: "Member A Visual"', imagePath: '/lovable-uploads/4163f6e2-7389-4c34-8abb-cae2f601991c.png', category: 'bonus' },
];

interface BackgroundSelectorProps {
  selectedBackground: string;
  onBackgroundChange: (backgroundId: string) => void;
  showThumbnails?: boolean;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onBackgroundChange,
  showThumbnails = false
}) => {
  const [isRandomMode, setIsRandomMode] = useState(selectedBackground === 'random');

  const handleSelectionChange = (value: string) => {
    setIsRandomMode(value === 'random');
    onBackgroundChange(value);
  };

  const handleRandomToggle = () => {
    if (isRandomMode) {
      // Switch to first stage background
      handleSelectionChange('stage1');
    } else {
      // Switch to random mode
      handleSelectionChange('random');
    }
  };

  const selectedOption = BACKGROUND_OPTIONS.find(option => option.id === selectedBackground);

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Choose Stage Background</label>
        <Button
          variant={isRandomMode ? "default" : "outline"}
          size="sm"
          onClick={handleRandomToggle}
          className="flex items-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Random
        </Button>
      </div>

      {!isRandomMode && (
        <Select value={selectedBackground} onValueChange={handleSelectionChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a background" />
          </SelectTrigger>
          <SelectContent>
            {BACKGROUND_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex items-center gap-2">
                  {showThumbnails && (
                    <div 
                      className="w-8 h-6 rounded border bg-cover bg-center"
                      style={{ backgroundImage: `url(${option.imagePath})` }}
                    />
                  )}
                  <span>{option.name}</span>
                  {option.category === 'bonus' && (
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                      BONUS
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showThumbnails && selectedOption && !isRandomMode && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded border">
          <div 
            className="w-16 h-12 rounded border bg-cover bg-center"
            style={{ backgroundImage: `url(${selectedOption.imagePath})` }}
          />
          <div>
            <p className="text-sm font-medium">{selectedOption.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedOption.category === 'bonus' ? 'Bonus Stage' : 'Main Stage'}
            </p>
          </div>
        </div>
      )}

      {isRandomMode && (
        <div className="p-3 bg-muted rounded border text-center">
          <p className="text-sm text-muted-foreground">
            Background will be randomly selected for each song
          </p>
        </div>
      )}
    </div>
  );
};

// Utility functions for background management
export const getBackgroundPath = (backgroundId: string): string => {
  if (backgroundId === 'random') {
    const randomOption = BACKGROUND_OPTIONS[Math.floor(Math.random() * BACKGROUND_OPTIONS.length)];
    return randomOption.imagePath;
  }
  
  const option = BACKGROUND_OPTIONS.find(opt => opt.id === backgroundId);
  return option?.imagePath || BACKGROUND_OPTIONS[0].imagePath; // Fallback to first background
};

export const saveBackgroundPreference = (backgroundId: string): void => {
  localStorage.setItem('selectedBackground', backgroundId);
};

export const loadBackgroundPreference = (): string => {
  return localStorage.getItem('selectedBackground') || 'stage1';
};

export { BACKGROUND_OPTIONS };