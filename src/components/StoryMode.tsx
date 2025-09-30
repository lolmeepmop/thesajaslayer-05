import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Home, Volume2, BookOpen, AlertTriangle, SkipForward } from 'lucide-react';
import { GameCanvas } from './GameCanvas';
import { SurveyPrompt } from './SurveyPrompt';
import { AudioAnalyzer, AudioAnalysisResult, BeatData } from '../utils/audioAnalysis';
import { Button } from './ui/button';
import { getBackgroundPath } from './BackgroundSelector';
import { DifficultyLevel } from '../types/difficulty';
import { AudioFileValidator } from '../utils/audioFileValidator';
import { trackPlayEvent } from '@/integrations/supabase/analytics';

// Story stages data
export interface StoryStage {
  id: string;
  name: string;
  imagePath: string;
  musicUrl: string;
  category: 'stage' | 'bonus';
}

const STORY_STAGES: StoryStage[] = [
  {
    id: 'stage1',
    name: 'Watch This (우릴 봐)',
    imagePath: '/lovable-uploads/50805a81-529d-44e2-b4eb-a42fb5fda7a2.png',
    musicUrl: '/stage-1-watch-this.mp3',
    category: 'stage'
  },
  {
    id: 'stage2',
    name: 'Darkside Rewind',
    imagePath: '/lovable-uploads/63013381-c47a-40f7-8ae6-243a877fff22.png',
    musicUrl: '/stage-2-darkside-rewind.mp3',
    category: 'stage'
  },
  {
    id: 'stage3',
    name: 'Voltage',
    imagePath: '/lovable-uploads/a76fc892-c505-44de-b79c-2deeebf4b00f.png',
    musicUrl: '/stage-3-voltage.mp3',
    category: 'stage'
  },
  {
    id: 'stage4',
    name: 'Sport Light Fever',
    imagePath: '/lovable-uploads/635966d7-9ab0-400a-b557-d74c51b2e6f8.png',
    musicUrl: '/stage-4-sport-light-fever.mp3',
    category: 'stage'
  },
  {
    id: 'stage5',
    name: '너만 보여 (Only You)',
    imagePath: '/lovable-uploads/695a30f1-9981-4fc0-9691-563319872f86.png',
    musicUrl: '/stage-5-only-you.mp3',
    category: 'stage'
  },
  {
    id: 'stage6',
    name: 'Off Guard',
    imagePath: '/lovable-uploads/4163f6e2-7389-4c34-8abb-cae2f601991c.png',
    musicUrl: '/stage-6-off-guard.mp3',
    category: 'stage'
  },
  {
    id: 'stage7',
    name: 'BANG!',
    imagePath: '/lovable-uploads/24aa969f-156d-4d7c-9092-8ce076fa093a.png',
    musicUrl: '/stage-7-bang.mp3',
    category: 'stage'
  },
  {
    id: 'bonus1',
    name: 'Nope! (안 돼!)',
    imagePath: '/lovable-uploads/a5a140eb-6183-45a9-9155-9064030a0f51.png',
    musicUrl: '/bonus-1-nope.mp3',
    category: 'bonus'
  },
  {
    id: 'bonus2',
    name: 'Sugar Crush',
    imagePath: '/lovable-uploads/bc1b473d-7e12-4d5b-8abd-6fe2997572e5.png',
    musicUrl: '/bonus-2-sugar-crush.mp3',
    category: 'bonus'
  }
];

type StoryGamePhase = 'menu' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'complete' | 'error';

interface GameStats {
  score: number;
  accuracy: number;
  maxCombo: number;
  beatsHit: number;
  beatsMissed: number;
}

interface LoadError {
  stageName: string;
  error: string;
  canRetry: boolean;
}

interface StoryModeProps {
  onExitStoryMode: () => void;
  difficulty?: DifficultyLevel;
}

export const StoryMode: React.FC<StoryModeProps> = ({ onExitStoryMode, difficulty = 'medium' }) => {
  const [gamePhase, setGamePhase] = useState<StoryGamePhase>('menu');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
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
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  const audioAnalyzer = useRef<AudioAnalyzer | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const gameUpdateInterval = useRef<number | null>(null);
  const audioValidator = useRef<AudioFileValidator>(new AudioFileValidator());

  const currentStage = STORY_STAGES[currentStageIndex];

  // Initialize audio analyzer
  useEffect(() => {
    audioAnalyzer.current = new AudioAnalyzer();
    return () => {
      if (audioAnalyzer.current) {
        audioAnalyzer.current.stopAudio();
      }
    };
  }, []);

  // Multi-strategy audio loading function
  const loadStage = useCallback(async (stageIndex: number) => {
    if (!audioAnalyzer.current || stageIndex >= STORY_STAGES.length) return;

    const stage = STORY_STAGES[stageIndex];
    setGamePhase('loading');
    setLoadError(null);
    
    console.log(`[StoryMode] Loading stage: ${stage.name}`);

    try {
      // Validate stage configuration
      if (!stage.musicUrl) {
        throw new Error(`No music URL specified for stage: ${stage.name}`);
      }

      // Create absolute URL with cache bust in preview mode
      const isPreviewMode = window.location.hostname.includes('lovableproject.com') || window.location.hostname.includes('preview');
      const cacheBust = isPreviewMode ? `?v=${Date.now()}` : '';
      const absoluteUrl = new URL(stage.musicUrl + cacheBust, window.location.origin).toString();
      
      console.log(`[StoryMode] Target URL: ${absoluteUrl}`);
      
      // Validate file accessibility first
      console.log(`[StoryMode] Validating audio file accessibility`);
      const validator = audioValidator.current;
      const status = await validator.validateFile(absoluteUrl);
      if (!status.exists) {
        throw new Error(`Audio file not accessible: ${status.error || 'Unknown validation error'}`);
      }
      
      console.log(`[StoryMode] File validation passed, attempting multi-strategy loading`);

      // Strategy 1: Try direct URL loading first (simpler, faster)
      let audio: HTMLAudioElement;
      let analysisResult: AudioAnalysisResult;
      
      try {
        console.log(`[StoryMode] Attempting direct URL loading strategy`);
        const { audio: directAudio, analysisResult: directAnalysis } = await loadAudioDirect(absoluteUrl, stage, isPreviewMode);
        audio = directAudio;
        analysisResult = directAnalysis;
        console.log(`[StoryMode] Direct loading successful`);
        
      } catch (directError) {
        console.warn(`[StoryMode] Direct loading failed, trying blob strategy:`, directError);
        
        // Strategy 2: Fallback to blob-based loading (more robust)
        const { audio: blobAudio, analysisResult: blobAnalysis } = await loadAudioBlob(absoluteUrl, stage, isPreviewMode);
        audio = blobAudio;
        analysisResult = blobAnalysis;
        console.log(`[StoryMode] Blob loading successful`);
      }

      // Verify analysis result
      if (!analysisResult.beats || analysisResult.beats.length === 0) {
        console.warn(`[StoryMode] No beats detected in audio file`);
      }

      // Store audio element and analysis
      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current = null;
      }
      
      audioElement.current = audio;
      setAnalysisResult(analysisResult);
      setCurrentStageIndex(stageIndex);
      setGamePhase('ready');
      
      console.log(`[StoryMode] Stage ${stage.name} loaded successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[StoryMode] Failed to load stage ${stage.name}:`, errorMessage);
      
      let canRetry = true;
      
      // Determine if retry is likely to help
      if (errorMessage.includes('not supported') || 
          errorMessage.includes('invalid duration') || 
          errorMessage.includes('corrupted') ||
          errorMessage.includes('Browser cannot play')) {
        canRetry = false;
      }
      
      setLoadError({
        stageName: stage.name,
        error: errorMessage,
        canRetry
      });
      setGamePhase('error');
    }
  }, [volume]);

  // Strategy 1: Direct URL loading
  const loadAudioDirect = async (url: string, stage: StoryStage, isPreviewMode: boolean): Promise<{ audio: HTMLAudioElement; analysisResult: AudioAnalysisResult }> => {
    console.log(`[StoryMode] Direct loading: Creating audio element`);
    
    // Check browser MP3 capability first
    const capabilityTest = document.createElement('audio');
    const canPlayMp3 = capabilityTest.canPlayType('audio/mpeg');
    if (!canPlayMp3) {
      throw new Error('Browser cannot play MP3 format');
    }
    
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    (audio as any).playsInline = true; // TypeScript workaround for mobile playback
    audio.preload = 'auto';
    audio.volume = volume;
    
    // Load audio with promise-based error handling
    await new Promise<void>((resolve, reject) => {
      let isResolved = false;
      
      const handleSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        
        if (isNaN(audio.duration) || audio.duration <= 0) {
          reject(new Error('Audio has invalid duration'));
          return;
        }
        
        console.log(`[StoryMode] Direct audio loaded - duration: ${audio.duration}s`);
        resolve();
      };

      const handleError = () => {
        if (isResolved) return;
        isResolved = true;
        
        const audioError = audio.error;
        let errorMessage = 'Direct loading failed';
        
        if (audioError) {
          errorMessage = `${getMediaErrorMessage(audioError.code)}`;
        }
        
        reject(new Error(errorMessage));
      };

      audio.addEventListener('loadedmetadata', handleSuccess, { once: true });
      audio.addEventListener('canplaythrough', handleSuccess, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      // Timeout for direct loading
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('Direct loading timeout (5s)'));
        }
      }, 5000);

      audio.src = url;
      audio.load();
    });

    // Fetch audio for analysis
    console.log(`[StoryMode] Direct loading: Fetching audio for analysis`);
    const response = await fetch(url, { 
      cache: 'no-cache',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Analysis fetch failed: ${response.status}`);
    }
    
    const audioBlob = await response.blob();
    const audioFile = new File([audioBlob], `${stage.id}.mp3`, { type: audioBlob.type || 'audio/mpeg' });

    const audioBuffer = await audioAnalyzer.current!.loadAudioFile(audioFile);
    const analysisResult = await audioAnalyzer.current!.analyzeAudio(audioBuffer);
    
    console.log(`[StoryMode] Direct loading analysis complete: ${analysisResult.beats.length} beats`);
    
    return { audio, analysisResult };
  };

  // Strategy 2: Blob-based loading (fallback)
  const loadAudioBlob = async (url: string, stage: StoryStage, isPreviewMode: boolean): Promise<{ audio: HTMLAudioElement; analysisResult: AudioAnalysisResult }> => {
    console.log(`[StoryMode] Blob loading: Fetching audio as blob`);
    
    // Fetch audio as blob with enhanced headers
    const response = await fetch(url, { 
      cache: 'no-cache',
      mode: 'cors',
      headers: {
        'Accept': 'audio/mpeg, audio/*',
        'Range': 'bytes=0-'  // Request full file
      }
    });
    
    if (!response.ok) {
      throw new Error(`Blob fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`[StoryMode] Blob response - Content-Type: ${contentType}`);
    
    const audioBlob = await response.blob();
    console.log(`[StoryMode] Blob created - size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    
    if (audioBlob.size === 0) {
      throw new Error('Audio file is empty (0 bytes)');
    }

    // Create blob URL for playback
    const blobUrl = URL.createObjectURL(audioBlob);
    console.log(`[StoryMode] Blob URL created: ${blobUrl}`);
    
    try {
      // Create audio element for blob playback
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      (audio as any).playsInline = true; // TypeScript workaround for mobile playback
      audio.preload = 'auto';
      audio.volume = volume;

      // Load audio from blob URL
      await new Promise<void>((resolve, reject) => {
        let isResolved = false;
        
        const cleanup = () => {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        };

        const handleSuccess = () => {
          if (isResolved) return;
          isResolved = true;
          
          if (isNaN(audio.duration) || audio.duration <= 0) {
            cleanup();
            reject(new Error('Blob audio has invalid duration'));
            return;
          }
          
          console.log(`[StoryMode] Blob audio loaded - duration: ${audio.duration}s`);
          resolve();
        };

        const handleError = () => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          
          const audioError = audio.error;
          let errorMessage = 'Blob audio loading failed';
          if (audioError) {
            errorMessage = `${getMediaErrorMessage(audioError.code)}`;
          }
          reject(new Error(errorMessage));
        };

        audio.addEventListener('loadedmetadata', handleSuccess, { once: true });
        audio.addEventListener('canplaythrough', handleSuccess, { once: true });
        audio.addEventListener('error', handleError, { once: true });

        // Timeout for blob loading
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Blob loading timeout (8s)'));
          }
        }, 8000);

        audio.src = blobUrl;
        audio.load();
      });

      // Analyze audio from blob
      console.log(`[StoryMode] Blob loading: Analyzing audio`);
      const audioFile = new File([audioBlob], `${stage.id}.mp3`, { type: audioBlob.type || 'audio/mpeg' });
      
      const audioBuffer = await audioAnalyzer.current!.loadAudioFile(audioFile);
      const analysisResult = await audioAnalyzer.current!.analyzeAudio(audioBuffer);
      
      console.log(`[StoryMode] Blob analysis complete: ${analysisResult.beats.length} beats`);
      
      return { audio, analysisResult };
      
    } catch (error) {
      // Clean up blob URL on error
      URL.revokeObjectURL(blobUrl);
      throw error;
    }
  };

  // Helper function to get readable error messages
  const getMediaErrorMessage = (code: number): string => {
    switch (code) {
      case 1: return 'MEDIA_ERR_ABORTED - The fetching process was aborted by the user';
      case 2: return 'MEDIA_ERR_NETWORK - A network error occurred while fetching the media';
      case 3: return 'MEDIA_ERR_DECODE - An error occurred while decoding the media';
      case 4: return 'MEDIA_ERR_SRC_NOT_SUPPORTED - The media format is not supported';
      default: return `Unknown media error code: ${code}`;
    }
  };

  // Start story mode
  const startStoryMode = useCallback(() => {
    setCurrentStageIndex(0);
    loadStage(0);
  }, [loadStage]);

  // Handle stage completion
  const onStageComplete = useCallback(() => {
    // Track stage completion
    trackPlayEvent('game_end', {
      mode: 'story',
      stage: STORY_STAGES[currentStageIndex]?.id || 'unknown',
      difficulty: difficulty,
    });

    // Cleanup current audio
    if (audioElement.current) {
      audioElement.current.removeEventListener('ended', onStageComplete);
      audioElement.current.pause();
      URL.revokeObjectURL(audioElement.current.src);
      audioElement.current = null;
    }
    
    if (gameUpdateInterval.current) {
      clearInterval(gameUpdateInterval.current);
      gameUpdateInterval.current = null;
    }
    
    // Use functional state update to get the current stage index
    setCurrentStageIndex((prevStageIndex) => {
      console.log('Stage completion triggered, current stage:', prevStageIndex);
      const nextStageIndex = prevStageIndex + 1;
      console.log('Next stage index:', nextStageIndex, 'Total stages:', STORY_STAGES.length);
      
      if (nextStageIndex < STORY_STAGES.length) {
        console.log('Loading next stage:', STORY_STAGES[nextStageIndex].name);
        setAnalysisResult(null); // Clear current analysis
        loadStage(nextStageIndex);
        return nextStageIndex;
      } else {
        console.log('Story complete!');
        setGamePhase('complete');
        return prevStageIndex;
      }
    });
  }, [loadStage, currentStageIndex, difficulty]);

  // Start current stage
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

    audioElement.current.currentTime = 0;
    audioElement.current.play();

    // Track story stage start
    trackPlayEvent('game_start', {
      mode: 'story',
      stage: currentStage.id,
      difficulty: difficulty,
    });

    gameUpdateInterval.current = window.setInterval(() => {
      if (audioElement.current) {
        setAudioCurrentTime(audioElement.current.currentTime);
        
        if (audioElement.current.ended) {
          console.log('Audio ended, triggering stage completion');
          setGamePhase('ended');
          if (gameUpdateInterval.current) {
            clearInterval(gameUpdateInterval.current);
          }
        }
      }
    }, 16);
  }, [analysisResult, currentStage, difficulty]);

  // Pause/resume game
  const pauseGame = useCallback(() => {
    if (!audioElement.current) return;

    if (gamePhase === 'playing') {
      audioElement.current.pause();
      setGamePhase('paused');
      if (gameUpdateInterval.current) {
        clearInterval(gameUpdateInterval.current);
        gameUpdateInterval.current = null;
      }
    } else if (gamePhase === 'paused') {
      audioElement.current.play();
      setGamePhase('playing');
      gameUpdateInterval.current = window.setInterval(() => {
        if (audioElement.current) {
          setAudioCurrentTime(audioElement.current.currentTime);
          if (audioElement.current.ended) {
            console.log('Audio ended during resume, triggering stage completion');
            setGamePhase('ended');
            if (gameUpdateInterval.current) {
              clearInterval(gameUpdateInterval.current);
            }
          }
        }
      }, 16);
    }
  }, [gamePhase]);

  // Restart current stage
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

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioElement.current) {
      audioElement.current.volume = newVolume;
    }
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

  // Story mode menu
  if (gamePhase === 'menu') {
    return (
      <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <div className="cosmic-card p-8 max-w-2xl text-center z-10">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-cosmic-gradient mb-4">Story Mode</h1>
          <div className="text-muted-foreground mb-8 text-lg leading-relaxed space-y-4">
            <p className="font-medium">Step into the spotlight. Fight for your soul.</p>
            <p>
              You are Nova, an idol trainee on the verge of debut. But when your rhythm begins to sync with something… otherworldly, your stage becomes a battleground.
            </p>
            <p>
              Face off against cursed idols, corrupted stages, and your own doubts across 7 supernatural chapters and 2 hidden memories.
            </p>
            <p className="italic">Can you survive the rhythm and rewrite your fate?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-bold text-primary mb-2">7 Main Chapters</h3>
              <p className="text-muted-foreground">Uncover the dark truth and confront each Saja member in rhythm-based scenario battles.</p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-bold text-primary mb-2">2 Hidden Rooms</h3>
              <p className="text-muted-foreground">Unlock secret stages by collecting clues and syncing deeper with your soul.</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={startStoryMode} className="cosmic-button">
              <Play className="w-5 h-5 mr-2" />
              Begin Debut
            </Button>
            <Button onClick={onExitStoryMode} variant="outline">
              <Home className="w-5 h-5 mr-2" />
              Return to Training Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Story complete screen
  if (gamePhase === 'complete') {
    return (
      <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <div className="cosmic-card p-8 max-w-md text-center z-10">
          <h1 className="text-3xl font-bold text-cosmic-gradient mb-4">Story Complete!</h1>
          <p className="text-muted-foreground mb-8">
            You've conquered all 9 stages of the cosmic rhythm journey! 
            The universe celebrates your musical mastery.
          </p>
          
          <SurveyPrompt />
          
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setGamePhase('menu')} className="cosmic-button">
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
            <Button onClick={onExitStoryMode} variant="outline">
              <Home className="w-5 h-5 mr-2" />
              Return to Freeplay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (gamePhase === 'loading') {
    return (
      <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background" />
        <div className="cosmic-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cosmic-gradient mb-2">Loading {currentStage?.name}</h2>
          <p className="text-muted-foreground">Preparing cosmic audio...</p>
          <p className="text-xs text-muted-foreground/70 mt-2">Stage {currentStageIndex + 1} of {STORY_STAGES.length}</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (gamePhase === 'error' && loadError) {
    return (
      <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background" />
        <div className="cosmic-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold text-destructive mb-2">Failed to Load Stage</h2>
          <h3 className="text-lg font-semibold mb-4">{loadError.stageName}</h3>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{loadError.error}</p>
            
            {loadError.error.includes('Preview Mode') && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mt-3 text-sm">
                <p className="text-amber-400 font-medium">Preview Mode Notice:</p>
                <p className="text-amber-200">Audio files may take longer to load in preview mode. This usually works fine in the published version.</p>
              </div>
            )}
            
            {loadError.error.includes('network') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mt-3 text-sm">
                <p className="text-blue-400 font-medium">Network Issue:</p>
                <p className="text-blue-200">Check your internet connection and try again.</p>
              </div>
            )}
            
            {loadError.error.includes('Preview is building') && (
              <div className="bg-green-500/10 border border-green-500/20 rounded p-3 mt-3 text-sm">
                <p className="text-green-400 font-medium">Build in Progress:</p>
                <p className="text-green-200">The preview is still building. Please wait a moment and try again.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {loadError.canRetry && (
              <Button 
                onClick={() => loadStage(currentStageIndex)}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => {
                setLoadError(null);
                onStageComplete();
              }}
              variant="secondary"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip This Stage
            </Button>
            
            <Button 
              onClick={onExitStoryMode}
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Exit Story Mode
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Stage {currentStageIndex + 1} of {STORY_STAGES.length}
          </p>
        </div>
      </div>
    );
  }

  // Game interface (same as regular game but with story stage info)
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

      {/* Game canvas */}
      <div className="absolute inset-0">
        {analysisResult && currentStage && (
          <GameCanvas
            audioAnalysis={analysisResult}
            audioCurrentTime={audioCurrentTime}
            onBeatHit={handleBeatHit}
            onBeatMiss={handleBeatMiss}
            onScoreUpdate={handleScoreUpdate}
            onComboUpdate={handleComboUpdate}
            gameState={gamePhase === 'playing' ? 'playing' : gamePhase === 'paused' ? 'paused' : 'ended'}
            selectedBackground={currentStage.id}
            difficulty={difficulty}
          />
        )}
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {/* Stage info */}
        <div className="cosmic-card p-4 bg-card/80 backdrop-blur">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              {currentStage?.category === 'bonus' ? 'BONUS' : 'STAGE'} {currentStageIndex + 1}/9
            </span>
          </div>
          <h3 className="font-bold text-lg mb-1">{currentStage?.name}</h3>
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
      <div className="absolute bottom-4 left-4 right-4 flex justify-center items-center gap-4 z-20">
        <div className="cosmic-card p-4 flex items-center gap-4">
          <Button
            onClick={onExitStoryMode}
            variant="outline"
            size="sm"
            className="cosmic-button"
          >
            <Home className="w-4 h-4 mr-2" />
            Exit Story
          </Button>

          <Button
            onClick={restartGame}
            variant="outline"
            size="sm"
            className="cosmic-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart Stage
          </Button>

          {/* Skip Stage button for testing/debugging */}
          {(gamePhase === 'playing' || gamePhase === 'paused') && (
            <Button
              onClick={() => setGamePhase('ended')}
              variant="outline"
              size="sm"
              className="cosmic-button bg-yellow-500/20 hover:bg-yellow-500/30"
            >
              Skip Stage
            </Button>
          )}

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

      {/* Ready screen */}
      {gamePhase === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 backdrop-blur-sm">
          <div className="cosmic-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-cosmic-gradient mb-4">{currentStage?.name}</h2>
            <div className="space-y-3 text-muted-foreground mb-6">
              <p>🎯 Hit the beats as they reach the target line</p>
              <p>🖱️ Click, tap, or use keyboard to play</p>
              <p>🎵 Stay in sync with the cosmic rhythm</p>
              <p>⭐ Complete the stage to continue the story</p>
            </div>
            
            <Button onClick={startGame} className="cosmic-button w-full">
              <Play className="w-5 h-5 mr-2" />
              Begin {currentStage?.name}
            </Button>
          </div>
        </div>
      )}

      {/* Stage complete screen */}
      {gamePhase === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 backdrop-blur-sm">
          <div className="cosmic-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-cosmic-gradient mb-4">Stage Complete!</h2>
            <div className="space-y-2 mb-6">
              <div className="text-3xl font-bold text-primary">{gameStats.score.toLocaleString()}</div>
              <div className="text-muted-foreground">Stage Score</div>
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
            <div className="flex gap-2">
              <Button onClick={restartGame} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Stage
              </Button>
              <Button onClick={onStageComplete} className="cosmic-button flex-1">
                <Play className="w-4 h-4 mr-2" />
                {currentStageIndex + 1 < STORY_STAGES.length ? 'Next Stage' : 'Complete Story'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryMode;