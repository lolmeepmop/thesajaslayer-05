import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Home, Volume2, Settings } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { GameCanvas } from './GameCanvas';
import { BackgroundSelector } from './BackgroundSelector';

import { PauseMenu } from './PauseMenu';
import { GameSettingsPanel } from './GameSettingsPanel';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ErrorBoundary } from './ErrorBoundary';
import { CalibrationTool } from './CalibrationTool';
import { LoadingProgress } from './LoadingProgress';
import { AudioErrorHandler } from './AudioErrorHandler';
import { SurveyPrompt } from './SurveyPrompt';
import { AudioAnalyzer, AudioAnalysisResult, BeatData } from '../utils/audioAnalysis';
import { Button } from './ui/button';
import { DifficultyLevel } from '../types/difficulty';
import { GameSettings, DEFAULT_SETTINGS } from '../types/gameSettings';
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from '../types/performance';
import { CalibrationData, DEFAULT_CALIBRATION } from '../types/calibration';
import { trackPlayEvent } from '@/integrations/supabase/analytics';

type GamePhase = 'upload' | 'analyzing' | 'ready' | 'playing' | 'paused' | 'ended';
type GameMode = 'freeplay';

interface GameStats {
  score: number;
  accuracy: number;
  maxCombo: number;
  beatsHit: number;
  beatsMissed: number;
}

interface RhythmGameProps {
  difficulty?: DifficultyLevel;
  preselectedSong?: {
    id: string;
    name: string;
    musicUrl: string;
    imagePath?: string;
  };
  onBack?: () => void;
}

export const RhythmGame: React.FC<RhythmGameProps> = ({ difficulty = 'medium', preselectedSong, onBack }) => {
  const [gameMode, setGameMode] = useState<GameMode>('freeplay');
  const [gamePhase, setGamePhase] = useState<GamePhase>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    accuracy: 0,
    maxCombo: 0,
    beatsHit: 0,
    beatsMissed: 0
  });
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [selectedBackground, setSelectedBackground] = useState(() => 
    localStorage.getItem('selectedBackground') || 'stage1'
  );
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('gameSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Phase 2: Performance, Error Handling, and Calibration
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig>(DEFAULT_PERFORMANCE_CONFIG);
  const [calibrationData, setCalibrationData] = useState<CalibrationData>(DEFAULT_CALIBRATION);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [showCalibrationTool, setShowCalibrationTool] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'loading' | 'analyzing' | 'generating' | 'optimizing'>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioAnalyzer = useRef<AudioAnalyzer | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const gameUpdateInterval = useRef<number | null>(null);

  // Initialize audio analyzer
  useEffect(() => {
    audioAnalyzer.current = new AudioAnalyzer();
    
    // Auto-load preselected song if provided
    if (preselectedSong) {
      handlePreselectedSong();
    }
    
    return () => {
      if (audioAnalyzer.current) {
        audioAnalyzer.current.stopAudio();
      }
    };
  }, []);

  const handlePreselectedSong = async () => {
    if (!preselectedSong) return;
    
    try {
      setGamePhase('analyzing');
      
      // Try local URL first, then fallback to GitHub if needed
      let audioUrl = preselectedSong.musicUrl;
      let response = await fetch(audioUrl);
      
      if (!response.ok) {
        // Fallback to GitHub assets if local file not found
        const githubBase = import.meta.env.VITE_SONG_ASSETS_BASE;
        if (githubBase) {
          audioUrl = `${githubBase}/${preselectedSong.musicUrl}`;
          response = await fetch(audioUrl);
        }
        if (!response.ok) throw new Error('Failed to fetch audio from both local and GitHub');
      }
      
      const blob = await response.blob();
      const file = new File([blob], `${preselectedSong.name}.mp3`, { type: 'audio/mpeg' });
      
      // Load and analyze audio
      const audioBuffer = await audioAnalyzer.current!.loadAudioFile(file);
      const analysis = await audioAnalyzer.current!.analyzeAudio(audioBuffer);
      
      // Create audio element for playback
      const audioObjectUrl = URL.createObjectURL(file);
      const audio = new Audio(audioObjectUrl);
      audio.volume = volume;
      audioElement.current = audio;
      
      setAnalysisResult(analysis);
      setAudioFile(file);
      
      // Set background image if available
      if (preselectedSong.imagePath) {
        setSelectedBackground(preselectedSong.imagePath);
      }
      
      setGamePhase('ready');
    } catch (error) {
      console.error('Error loading preselected song:', error);
      setGamePhase('upload'); // Fall back to upload mode
    }
  };

  // Handle file upload and analysis
  const handleFileUpload = useCallback(async (file: File) => {
    if (!audioAnalyzer.current) return;

    setAudioFile(file);
    setGamePhase('analyzing');

    try {
      console.log('Starting file upload process for:', file.name);
      
      // Load and analyze audio with timeout
      const audioBuffer = await Promise.race([
        audioAnalyzer.current.loadAudioFile(file),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Audio loading timeout after 15 seconds')), 15000)
        )
      ]);

      const analysis = await Promise.race([
        audioAnalyzer.current.analyzeAudio(audioBuffer),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Audio analysis timeout')), 60000)
        )
      ]);
      
      // Create audio element for playback
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioElement.current = audio;

      console.log('Analysis complete, setting game ready');
      setAnalysisResult(analysis);
      setGamePhase('ready');
    } catch (error) {
      console.error('Audio analysis failed:', error);
      alert(`Failed to analyze audio: ${error.message}. Please try a different file or check your browser console for more details.`);
      setGamePhase('upload');
    }
  }, [volume]);

  // Start game
  const startGame = useCallback(() => {
    if (!audioElement.current || !analysisResult) return;

    setGamePhase('playing');
    setGameStats({
      score: 0,
      accuracy: 0,
      maxCombo: 0,
      beatsHit: 0,
      beatsMissed: 0
    });

    // Start audio playback
    audioElement.current.currentTime = 0;
    audioElement.current.play();

    // Track game start (non-blocking)
    trackPlayEvent('game_start', {
      mode: gameMode,
      stage: selectedBackground,
      difficulty: difficulty,
    });

    // Update current time regularly
    gameUpdateInterval.current = window.setInterval(() => {
      if (audioElement.current) {
        setAudioCurrentTime(audioElement.current.currentTime);
        
        // Check if song ended
        if (audioElement.current.ended) {
          setGamePhase('ended');
          if (gameUpdateInterval.current) {
            clearInterval(gameUpdateInterval.current);
          }
        }
      }
    }, 16); // ~60fps updates
  }, [analysisResult, gameMode, selectedBackground, difficulty]);

  // Restart game
  const restartGame = useCallback(() => {
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.currentTime = 0;
    }
    if (gameUpdateInterval.current) {
      clearInterval(gameUpdateInterval.current);
      gameUpdateInterval.current = null;
    }
    setAudioCurrentTime(0);
    setGamePhase('ready');
  }, []);

  // Return to upload
  const returnToUpload = useCallback(() => {
    if (audioElement.current) {
      audioElement.current.pause();
      URL.revokeObjectURL(audioElement.current.src);
      audioElement.current = null;
    }
    if (gameUpdateInterval.current) {
      clearInterval(gameUpdateInterval.current);
      gameUpdateInterval.current = null;
    }
    setAudioFile(null);
    setAnalysisResult(null);
    setAudioCurrentTime(0);
    setGamePhase('upload');
  }, []);

  // Handle beat hit
  const handleBeatHit = useCallback((accuracy: number, beatType: BeatData['type']) => {
    setGameStats(prev => {
      const newBeatsHit = prev.beatsHit + 1;
      const totalBeats = newBeatsHit + prev.beatsMissed;
      const newAccuracy = totalBeats > 0 ? (newBeatsHit / totalBeats) * 100 : 0;
      
      return {
        ...prev,
        beatsHit: newBeatsHit,
        accuracy: newAccuracy
      };
    });
  }, []);

  // Handle score update from GameCanvas
  const handleScoreUpdate = useCallback((score: number) => {
    setGameStats(prev => ({ ...prev, score }));
  }, []);

  // Handle combo update from GameCanvas
  const handleComboUpdate = useCallback((combo: number) => {
    setGameStats(prev => ({ ...prev, maxCombo: Math.max(prev.maxCombo, combo) }));
  }, []);

  // Handle beat miss
  const handleBeatMiss = useCallback(() => {
    setGameStats(prev => {
      const newBeatsMissed = prev.beatsMissed + 1;
      const totalBeats = prev.beatsHit + newBeatsMissed;
      const newAccuracy = totalBeats > 0 ? (prev.beatsHit / totalBeats) * 100 : 0;
      
      return {
        ...prev,
        beatsMissed: newBeatsMissed,
        accuracy: newAccuracy
      };
    });
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setGameSettings(newSettings);
    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
    
    // Apply volume changes immediately
    if (audioElement.current) {
      audioElement.current.volume = newSettings.masterVolume / 100;
    }
    setVolume(newSettings.masterVolume / 100);
  }, []);

  // Handle pause with menu
  const pauseGame = useCallback(() => {
    if (gamePhase === 'playing') {
      if (audioElement.current) {
        audioElement.current.pause();
      }
      if (gameUpdateInterval.current) {
        clearInterval(gameUpdateInterval.current);
        gameUpdateInterval.current = null;
      }
      setGamePhase('paused');
      setShowPauseMenu(true);
    } else if (gamePhase === 'paused') {
      resumeGame();
    }
  }, [gamePhase]);

  // Resume game with countdown
  const resumeGame = useCallback(() => {
    setShowPauseMenu(false);
    
    // Simple resume - in a more advanced version, you might want a countdown
    setTimeout(() => {
      if (audioElement.current && analysisResult) {
        audioElement.current.play();
        
        gameUpdateInterval.current = window.setInterval(() => {
          if (audioElement.current) {
            setAudioCurrentTime(audioElement.current.currentTime);
            
            if (audioElement.current.ended) {
              setGamePhase('ended');
              if (gameUpdateInterval.current) {
                clearInterval(gameUpdateInterval.current);
                gameUpdateInterval.current = null;
              }
            }
          }
        }, 16);
        
        setGamePhase('playing');
      }
    }, 100);
  }, [analysisResult]);

  // Handle volume change  
  const handleVolumeChange = useCallback((newVolume: number) => {
    const updatedSettings = { ...gameSettings, masterVolume: newVolume * 100 };
    handleSettingsChange(updatedSettings);
  }, [gameSettings, handleSettingsChange]);

  // Handle background change
  const handleBackgroundChange = useCallback((backgroundId: string) => {
    setSelectedBackground(backgroundId);
    localStorage.setItem('selectedBackground', backgroundId);
  }, []);

  // Handle settings panel toggle
  const toggleSettingsPanel = useCallback(() => {
    setShowSettingsPanel(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameUpdateInterval.current) {
        clearInterval(gameUpdateInterval.current);
      }
      if (audioElement.current) {
        audioElement.current.pause();
        URL.revokeObjectURL(audioElement.current.src);
      }
    };
  }, []);

  // Track game end when phase transitions to 'ended'
  useEffect(() => {
    if (gamePhase === 'ended') {
      trackPlayEvent('game_end', {
        mode: gameMode,
        stage: selectedBackground,
        difficulty,
      });
    }
  }, [gamePhase, gameMode, selectedBackground, difficulty]);


  // Upload phase
  if (gamePhase === 'upload' || gamePhase === 'analyzing') {
    return (
      <div className="h-screen w-screen relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
        

        <FileUpload 
          onFileSelect={handleFileUpload}
          isProcessing={gamePhase === 'analyzing'}
          onBack={onBack}
        />
      </div>
    );
  }

  // Game interface
  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background">
        <div className="absolute inset-0 opacity-20">
          {/* Animated background particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Game canvas */}
      <div className="absolute inset-0">
        {analysisResult && (
          <GameCanvas
            audioAnalysis={analysisResult}
            audioCurrentTime={audioCurrentTime}
            onBeatHit={handleBeatHit}
            onBeatMiss={handleBeatMiss}
            onScoreUpdate={handleScoreUpdate}
            onComboUpdate={handleComboUpdate}
            gameState={gamePhase === 'playing' ? 'playing' : gamePhase === 'paused' ? 'paused' : 'ended'}
            selectedBackground={selectedBackground}
            difficulty={difficulty}
            gameSettings={gameSettings}
            performanceConfig={performanceConfig}
            onPerformanceUpdate={(metrics) => {
              if (metrics.fps < 30) {
                setPerformanceConfig(prev => ({ ...prev, qualityLevel: 'low', maxParticles: 25 }));
              }
            }}
          />
        )}
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {/* Song info */}
        <div className="cosmic-card p-4 bg-card/80 backdrop-blur">
          <h3 className="font-bold text-lg mb-1">{audioFile?.name || 'Unknown Track'}</h3>
          {analysisResult && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>BPM: {analysisResult.bpm}</div>
              <div>Duration: {Math.floor(analysisResult.duration / 60)}:{(analysisResult.duration % 60).toFixed(0).padStart(2, '0')}</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="cosmic-card p-4 bg-card/80 backdrop-blur text-right">
          <div className="text-2xl font-bold text-primary">{gameStats.score.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Accuracy: {gameStats.accuracy.toFixed(1)}%</div>
            <div>Hits: {gameStats.beatsHit} / Misses: {gameStats.beatsMissed}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center items-center gap-4 z-10">
        <div className="cosmic-card p-4 bg-card/80 backdrop-blur flex items-center gap-4">
          <Button
            onClick={onBack || returnToUpload}
            variant="outline"
            size="sm"
            className="cosmic-button"
          >
            <Home className="w-4 h-4 mr-2" />
            New Song
          </Button>

          <Button
            onClick={restartGame}
            variant="outline"
            size="sm"
            className="cosmic-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>

          <Button
            onClick={toggleSettingsPanel}
            variant="outline"
            size="sm"
            className="border-accent/50 text-accent hover:bg-accent/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>

          {gamePhase === 'ready' && (
            <Button
              onClick={startGame}
              className="cosmic-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}

          {(gamePhase === 'playing' || gamePhase === 'paused') && (
            <Button
              onClick={pauseGame}
              className="cosmic-button"
            >
              {gamePhase === 'playing' ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {gamePhase === 'playing' ? 'Pause' : 'Resume'}
            </Button>
          )}

          {/* Volume control */}
          <div className="flex items-center gap-2 ml-4">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Pause Menu */}
      <PauseMenu
        isOpen={showPauseMenu}
        onResume={resumeGame}
        onRestart={() => {
          setShowPauseMenu(false);
          restartGame();
        }}
        onSettings={() => {
          setShowSettingsPanel(true);
        }}
        onMainMenu={() => {
          setShowPauseMenu(false);
          returnToUpload();
        }}
      />

      {/* Settings Panel */}
      <GameSettingsPanel
        settings={gameSettings}
        onSettingsChange={handleSettingsChange}
        onClose={() => setShowSettingsPanel(false)}
        isOpen={showSettingsPanel}
      />

      {/* Instructions */}
      {gamePhase === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 backdrop-blur-sm">
          <div className="cosmic-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-cosmic-gradient mb-4">Ready to Play!</h2>
            <div className="space-y-3 text-muted-foreground mb-6">
              <p>🎯 Hit the beats as they reach the target line</p>
              <p>🖱️ Click, tap, or use keyboard to play</p>
              <p>🎵 Stay in sync with the cosmic rhythm</p>
              <p>⭐ Build combos for higher scores</p>
            </div>
            
            <div className="mb-6">
              <BackgroundSelector
                selectedBackground={selectedBackground}
                onBackgroundChange={handleBackgroundChange}
                showThumbnails={true}
              />
            </div>
            <Button onClick={startGame} className="cosmic-button w-full">
              <Play className="w-5 h-5 mr-2" />
              Start Cosmic Journey
            </Button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gamePhase === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 backdrop-blur-sm">
          <div className="cosmic-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-cosmic-gradient mb-4">Cosmic Journey Complete!</h2>
            <div className="space-y-2 mb-6">
              <div className="text-3xl font-bold text-primary">{gameStats.score.toLocaleString()}</div>
              <div className="text-muted-foreground">Final Score</div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-bold">{gameStats.accuracy.toFixed(1)}%</div>
                  <div className="text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="font-bold">{gameStats.beatsHit}</div>
                  <div className="text-muted-foreground">Hits</div>
                </div>
              </div>
            </div>
            
            <SurveyPrompt />
            
            <div className="flex gap-2">
              <Button onClick={restartGame} className="cosmic-button flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button onClick={returnToUpload} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                New Song
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};