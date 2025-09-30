import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { DifficultyLevel } from '../types/difficulty';

interface StoryDifficultySelectorProps {
  onBack: () => void;
  onStartStory: (difficulty: DifficultyLevel) => void;
}

export const StoryDifficultySelector: React.FC<StoryDifficultySelectorProps> = ({ 
  onBack, 
  onStartStory 
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Continue the background music from landing page
    const audio = new Audio('/start-page-audio-2.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log('Audio autoplay prevented');
      });
    }

    // Add entrance animation delay
    const timer = setTimeout(() => setIsLoaded(true), 100);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStartStory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onStartStory(selectedDifficulty);
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('/lovable-uploads/b5e657df-0271-4657-b1eb-3998fe0409b6.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Back button */}
      <Button
        variant="outline"
        className="absolute top-4 left-4 z-50 bg-white/10 border-white/30 text-white hover:bg-white/20"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Main content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="synthwave-title text-5xl md:text-7xl">
              CHOOSE YOUR PATH
            </h1>
            <h2 className="synthwave-subtitle text-xl md:text-3xl">
              Select difficulty to begin your journey
            </h2>
          </div>
          
          {/* Story context */}
          <div className="synthwave-narrative max-w-2xl mx-auto space-y-2 text-lg">
            <p>The corrupted rhythms grow stronger with each stage.</p>
            <p>How confident are you in your sync abilities?</p>
          </div>

          {/* Difficulty selection */}
          <div className="max-w-md mx-auto">
            <DifficultySelector
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
            />
          </div>

          {/* Start button */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="synthwave-button text-xl px-12 py-6"
              onClick={handleStartStory}
            >
              BEGIN STORY MODE
            </Button>
            <p className="text-sm text-electric-lavender/70 font-mono">
              * Difficulty can be changed later in settings
            </p>
          </div>
        </div>
      </div>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-neon-coral/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-neon-cyan/20 rounded-full blur-xl animate-pulse delay-2000" />
      </div>
    </div>
  );
};