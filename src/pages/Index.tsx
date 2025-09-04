import React, { useState } from 'react';
import { RhythmGame } from '../components/RhythmGame';
import { StoryMode } from '../components/StoryMode';
import { LandingPage } from '../components/LandingPage';
import { StoryDifficultySelector } from '../components/StoryDifficultySelector';
import { DifficultyLevel } from '../types/difficulty';

type AppMode = 'landing' | 'story' | 'freeplay' | 'story-difficulty';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('landing');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');

  const handleStartStoryMode = () => {
    setCurrentMode('story-difficulty');
  };

  const handleStoryDifficultySelected = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setCurrentMode('story');
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
        onStartStoryMode={handleStartStoryMode}
        onStartFreeplay={handleStartFreeplay}
      />
    );
  }

  if (currentMode === 'story') {
    return <StoryMode onExitStoryMode={handleExitToLanding} difficulty={selectedDifficulty} />;
  }

  if (currentMode === 'story-difficulty') {
    return (
      <StoryDifficultySelector
        onBack={handleExitToLanding}
        onStartStory={handleStoryDifficultySelected}
      />
    );
  }

  if (currentMode === 'freeplay') {
    return <RhythmGame difficulty={selectedDifficulty} />;
  }

  return null;
};

export default Index;
