import React, { useState } from 'react';
import { RhythmGame } from '../components/RhythmGame';
import { SongBank } from '../components/SongBank';
import { LandingPage } from '../components/LandingPage';
import { DifficultySelector } from '../components/DifficultySelector';
import { DifficultyLevel } from '../types/difficulty';
import { Song } from '../types/song';

type AppMode = 'landing' | 'song-bank' | 'difficulty-select' | 'song-game' | 'freeplay';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('landing');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleStartSongBank = () => {
    setCurrentMode('difficulty-select');
  };

  const handleDifficultySelected = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setCurrentMode('song-bank');
  };

  const handleSongSelected = (song: Song, difficulty: DifficultyLevel) => {
    setSelectedSong(song);
    setSelectedDifficulty(difficulty);
    setCurrentMode('song-game');
  };

  const handleStartFreeplay = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setCurrentMode('freeplay');
  };

  const handleExitToLanding = () => {
    setCurrentMode('landing');
  };

  if (currentMode === 'landing') {
    return (
      <LandingPage 
        onStartSongBank={handleStartSongBank}
        onStartFreeplay={handleStartFreeplay}
      />
    );
  }

  if (currentMode === 'difficulty-select') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `url('/lovable-uploads/b5e657df-0271-4657-b1eb-3998fe0409b6.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="relative z-10 text-center space-y-8">
          <h1 className="synthwave-title text-4xl md:text-6xl">
            SELECT DIFFICULTY
          </h1>
          <div className="max-w-md mx-auto">
            <DifficultySelector
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={handleDifficultySelected}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'song-bank') {
    return (
      <SongBank
        onSongSelected={handleSongSelected}
        onBack={handleExitToLanding}
        difficulty={selectedDifficulty}
      />
    );
  }

  if (currentMode === 'song-game' && selectedSong) {
    return (
      <RhythmGame 
        difficulty={selectedDifficulty} 
        preselectedSong={selectedSong}
        onBack={() => setCurrentMode('song-bank')}
      />
    );
  }

  if (currentMode === 'freeplay') {
    return (
      <RhythmGame 
        difficulty={selectedDifficulty}
        onBack={() => setCurrentMode('landing')}
      />
    );
  }

  return null;
};

export default Index;
