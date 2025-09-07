import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Volume2, VolumeX, Upload } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { DifficultyLevel } from '../types/difficulty';

interface LandingPageProps {
  onStartSongBank: () => void;
  onStartFreeplay: (difficulty: DifficultyLevel) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSongBank, onStartFreeplay }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFreeplayMode, setShowFreeplayMode] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize background music
    const audio = new Audio('/start-page-audio.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Attempt to play background music (with autoplay restrictions handling)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Background music started');
        })
        .catch(() => {
          console.log('Autoplay prevented - user interaction required');
          setIsMuted(true);
        });
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Add a small delay for entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const handleStartSongBank = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onStartSongBank();
  };

  const handleStartFreeplay = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onStartFreeplay(selectedDifficulty);
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
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Audio control button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 border border-white/30"
        onClick={toggleMute}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>


      {/* Mode toggle button */}
      <Button
        variant="outline"
        className="absolute top-4 left-4 z-50 bg-white/10 border-white/30 text-white hover:bg-white/20"
        onClick={() => setShowFreeplayMode(!showFreeplayMode)}
      >
        <Upload className="h-4 w-4 mr-2" />
        {showFreeplayMode ? 'Back to Song Bank' : 'Upload a Song'}
      </Button>

      {/* Main content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {!showFreeplayMode ? (
          // Song Bank Interface
          <div className="space-y-8">
            {/* Title with animated neon gradient */}
            <div className="space-y-4">
              <h1 className="synthwave-title text-6xl md:text-8xl">
                SOUL SYNC
              </h1>
              <h2 className="synthwave-subtitle text-2xl md:text-4xl">
                THE SAJA SLAYER
              </h2>
            </div>
            
            {/* Tagline with typewriter animation */}
            <p className="synthwave-tagline text-xl md:text-2xl font-medium">
              Choose your rhythm. Sync your soul.
            </p>

            {/* Narrative description with tech font */}
            <div className="synthwave-narrative max-w-2xl mx-auto space-y-2 text-lg">
              <p>Select from our curated collection of electronic beats.</p>
              <p>From K-pop bangers to synthwave classics.</p>
              <p>Each song offers a unique rhythmic challenge.</p>
            </div>

            {/* Start button with synthwave styling */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="synthwave-button text-xl px-12 py-6"
                onClick={handleStartSongBank}
              >
                EXPLORE SONG BANK
              </Button>
              <p className="text-sm text-electric-lavender/70 font-mono">
                * This is a fan-made game
              </p>
            </div>
          </div>
        ) : (
          // Freeplay Mode Interface
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="synthwave-title text-5xl md:text-7xl">
                FREEPLAY MODE
              </h1>
              <p className="synthwave-tagline text-xl md:text-2xl">
                Upload your own song and sync to the beat
              </p>
            </div>

            {/* Difficulty selection for freeplay */}
            <div className="max-w-md mx-auto">
              <DifficultySelector
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
              />
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="text-xl px-12 py-6 bg-gradient-to-r from-neon-blue to-neon-cyan hover:from-blue-600 hover:to-cyan-600 text-white border-2 border-neon-cyan/50 shadow-2xl hover:shadow-neon-cyan/25 transition-all duration-300 hover:scale-105 font-orbitron font-bold"
                onClick={handleStartFreeplay}
              >
                <Upload className="h-6 w-6 mr-3" />
                UPLOAD YOUR SONG
              </Button>
              <p className="text-sm text-electric-lavender/70 font-mono">
                * Please ensure you own the rights to your uploaded song
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced ambient particles with neon colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-neon-coral/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-neon-cyan/20 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-neon-magenta/15 rounded-full blur-lg animate-pulse delay-500" />
        <div className="absolute bottom-1/3 right-1/2 w-28 h-28 bg-neon-blue/10 rounded-full blur-xl animate-pulse delay-1500" />
      </div>
    </div>
  );
};