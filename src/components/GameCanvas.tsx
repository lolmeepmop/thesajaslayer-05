import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BeatData, AudioAnalysisResult } from '../utils/audioAnalysis';
import { EnhancedBeatData, BeatmapGenerator } from '../utils/beatmapGenerator';
import { modifyBeatmapForStage7 } from '../utils/stage7BeatmapMod';
import { getBackgroundPath } from './BackgroundSelector';
import { DifficultyLevel, getDifficultyConfig } from '../types/difficulty';
import { getHitQuality, calculateScore, HitQualityData, HIT_QUALITY_CONFIGS } from '../types/hitQuality';
import { HitQualityIndicator } from './HitQualityIndicator';
import { GameSettings } from '../types/gameSettings';
import { PerformanceConfig, PerformanceMetrics, PERFORMANCE_THRESHOLDS } from '../types/performance';
import { 
  createGameObjectPool, 
  createParticlePool, 
  PerformanceOptimizer,
  optimizeCanvas,
  checkCollision,
  PooledGameObject,
  PooledParticle 
} from '../utils/performanceOptimizer';

interface GameCanvasProps {
  beats?: BeatData[]; // Make beats optional since we use enhanced beatmaps
  audioAnalysis: AudioAnalysisResult; // Make required since we need it for beatmap generation
  audioCurrentTime: number;
  onBeatHit: (accuracy: number, beatType: BeatData['type']) => void;
  onBeatMiss: () => void;
  onScoreUpdate?: (score: number) => void;
  onComboUpdate?: (combo: number) => void;
  gameState: 'playing' | 'paused' | 'ended';
  selectedBackground?: string;
  difficulty?: DifficultyLevel;
  gameSettings?: GameSettings;
  performanceConfig?: PerformanceConfig;
  onPerformanceUpdate?: (metrics: { objectCount: number; particleCount: number; fps: number }) => void;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  lane: number; // 0-3 for four lanes
  beat: BeatData;
  created: number;
  hit: boolean;
  isHolding?: boolean; // For hold notes
  holdStartTime?: number; // When the hold started
}

interface TargetArrow {
  lane: number;
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  beats,
  audioAnalysis,
  audioCurrentTime,
  onBeatHit,
  onBeatMiss,
  onScoreUpdate,
  onComboUpdate,
  gameState,
  selectedBackground = 'stage1',
  difficulty = 'medium',
  gameSettings,
  performanceConfig = {
    targetFPS: 60,
    maxParticles: 100,
    maxGameObjects: 50,
    qualityLevel: 'high',
    adaptiveQuality: true
  },
  onPerformanceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [screenShake, setScreenShake] = useState(0);
  const [screenFlash, setScreenFlash] = useState(0);
  const [hitQualityDisplay, setHitQualityDisplay] = useState<{data: HitQualityData, x: number, y: number} | null>(null);
  
  // Performance optimization
  const gameObjectPoolRef = useRef(createGameObjectPool(performanceConfig.maxGameObjects));
  const particlePoolRef = useRef(createParticlePool(performanceConfig.maxParticles));
  const performanceOptimizerRef = useRef(new PerformanceOptimizer(performanceConfig));
  const frameTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    audioLatency: 0,
    renderTime: 0,
    gameObjects: 0,
    particles: 0
  });

  // Canvas optimization on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      optimizeCanvas(canvas);
    }
  }, []);
  
  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const frameTime = now - lastFrameTimeRef.current;
      
      if (frameTime > 0) {
        const fps = 1000 / frameTime;
        performanceOptimizerRef.current.recordFrame(frameTime);
        
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        
        const metrics: PerformanceMetrics = {
          fps: Math.round(fps),
          frameTime: Number(frameTime.toFixed(2)),
          memoryUsage,
          audioLatency: gameSettings?.audioOffset || 0,
          renderTime: frameTimeRef.current,
          gameObjects: gameObjects.length,
          particles: particles.length
        };
        
        setPerformanceMetrics(metrics);
        
        if (onPerformanceUpdate) {
          onPerformanceUpdate({
            objectCount: gameObjects.length,
            particleCount: particles.length,
            fps: Math.round(fps)
          });
        }
      }
      
      lastFrameTimeRef.current = now;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameObjects.length, particles.length, gameSettings?.audioOffset, onPerformanceUpdate]);
  
  const TARGET_Y = 0.15; // Target arrows at 15% from top
  const HIT_TOLERANCE = 0.15; // 150ms tolerance
  const APPROACH_TIME = 3.0; // 3 seconds for arrows to reach target
  const LANES = 4; // Four lanes for arrows

  // Target arrows (static positions)
  const targetArrows: TargetArrow[] = [
    { lane: 0, x: 0.2, y: TARGET_Y },
    { lane: 1, x: 0.4, y: TARGET_Y },
    { lane: 2, x: 0.6, y: TARGET_Y },
    { lane: 3, x: 0.8, y: TARGET_Y },
  ];

  // Get arrow color and direction based on lane
  const getArrowProps = (lane: number) => {
    switch (lane) {
      case 0: return { color: '#F59E0B', direction: '←' }; // Left - Gold
      case 1: return { color: '#10B981', direction: '↓' }; // Down - Green  
      case 2: return { color: '#06B6D4', direction: '↑' }; // Up - Cyan
      case 3: return { color: '#EC4899', direction: '→' }; // Right - Pink
      default: return { color: '#8B5CF6', direction: '↑' };
    }
  };

  // Handle input (keyboard for arrow keys)
  const handleInput = useCallback((lane: number) => {
    if (gameState !== 'playing') return;

    // Check for hits on arrows near the target in the specified lane
    const currentTime = audioCurrentTime;
    let bestHit: { object: GameObject; accuracy: number } | null = null;

    gameObjects.forEach(obj => {
      if (obj.hit || obj.lane !== lane) return;

      // Check if arrow is near the target position
      const targetDistance = Math.abs(obj.y - TARGET_Y);
      if (targetDistance > 0.1) return; // Too far from target

      const timeDiff = Math.abs(obj.beat.time - currentTime);
      if (timeDiff <= HIT_TOLERANCE) {
        const accuracy = 1 - (timeDiff / HIT_TOLERANCE);
        if (!bestHit || accuracy > bestHit.accuracy) {
          bestHit = { object: obj, accuracy };
        }
      }
    });

    if (bestHit) {
      // Mark as hit
      bestHit.object.hit = true;
      
      // Import hit quality system
      const hitQuality = getHitQuality(bestHit.accuracy);
      const points = calculateScore(hitQuality, combo);
      
      // Create hit quality data
      const hitQualityData: HitQualityData = {
        quality: hitQuality,
        accuracy: bestHit.accuracy,
        points,
        multiplier: HIT_QUALITY_CONFIGS[hitQuality].multiplier
      };
      
      setScore(prev => {
        const newScore = prev + points;
        onScoreUpdate?.(newScore);
        return newScore;
      });
      if (hitQuality !== 'miss') {
        setCombo(prev => {
          const newCombo = prev + 1;
          onComboUpdate?.(newCombo);
          return newCombo;
        });
      } else {
        setCombo(0);
        onComboUpdate?.(0);
      }
      
      // Visual effects
      setScreenFlash(0.3);
      setScreenShake(0.1);
      createHitParticles(bestHit.object.x, bestHit.object.y, bestHit.object.lane);
      
      // Show hit quality indicator
      setHitQualityDisplay({ data: hitQualityData, x: bestHit.object.x, y: TARGET_Y });
      
      onBeatHit(bestHit.accuracy, bestHit.object.beat.type);
    }
  }, [gameState, audioCurrentTime, gameObjects, combo, onBeatHit]);

  // Create particle explosion on hit
  const createHitParticles = (x: number, y: number, lane: number) => {
    const { color } = getArrowProps(lane);
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.2;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 0.02 + Math.random() * 0.01
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Keyboard events for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let lane = -1;
      switch (e.code) {
        case 'ArrowLeft':
          lane = 0;
          break;
        case 'ArrowDown':
          lane = 1;
          break;
        case 'ArrowUp':
          lane = 2;
          break;
        case 'ArrowRight':
          lane = 3;
          break;
        default:
          return;
      }
      e.preventDefault();
      handleInput(lane);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // Mouse and touch events for clicking on arrows
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Check which lane was clicked based on x position
    let clickedLane = -1;
    for (let i = 0; i < targetArrows.length; i++) {
      const laneX = targetArrows[i].x;
      if (Math.abs(x - laneX) < 0.1) { // Within 10% of lane center
        clickedLane = i;
        break;
      }
    }

    if (clickedLane !== -1) {
      handleInput(clickedLane);
    }
  }, [gameState, handleInput]);

  const handleCanvasTouch = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || event.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    // Check which lane was touched based on x position
    let touchedLane = -1;
    for (let i = 0; i < targetArrows.length; i++) {
      const laneX = targetArrows[i].x;
      if (Math.abs(x - laneX) < 0.1) { // Within 10% of lane center
        touchedLane = i;
        break;
      }
    }

    if (touchedLane !== -1) {
      handleInput(touchedLane);
    }
  }, [gameState, handleInput]);

  // Generate enhanced beatmap using new generator
  const [enhancedBeats, setEnhancedBeats] = useState<EnhancedBeatData[]>([]);
  
  useEffect(() => {
    if (audioAnalysis) {
      console.log('🎮 Generating enhanced beatmap for gameplay...');
      const difficultySettings = getDifficultyConfig(difficulty);
      const beatmapGenerator = new BeatmapGenerator(audioAnalysis, difficultySettings);
      let generatedBeatmap = beatmapGenerator.generateBeatmap();
      
      // Apply Stage 7 specific modifications if selected
      if (selectedBackground === 'stage7') {
        console.log('🎵 Applying Stage 7 beatmap enhancements...');
        generatedBeatmap = modifyBeatmapForStage7(generatedBeatmap, difficulty);
      }
      
      console.log(`✅ Enhanced beatmap ready: ${generatedBeatmap.length} beats, ${generatedBeatmap.filter(b => b.isHold).length} holds`);
      setEnhancedBeats(generatedBeatmap);
    }
  }, [audioAnalysis, difficulty, selectedBackground]); // Include selectedBackground to regenerate when stage changes

  // Update game objects based on current time
  const updateGameObjects = useCallback(() => {
    if (gameState !== 'playing') return;

    const currentTime = audioCurrentTime;
    
    setGameObjects(prev => {
      const newObjects: GameObject[] = [];
      
      // Use enhanced beatmap if available, otherwise fall back to original beats
      const beatsToUse = enhancedBeats.length > 0 ? enhancedBeats : (beats || []);
      
      // Add new objects for upcoming beats
      beatsToUse.forEach((beat) => {
        const timeUntilBeat = beat.time - currentTime;
        if (timeUntilBeat > 0 && timeUntilBeat <= APPROACH_TIME) {
          const existingObject = prev.find(obj => obj.beat.time === beat.time);
          if (!existingObject) {
            // For enhanced beats, use the pre-calculated lane and hold properties
            const enhancedBeat = beat as EnhancedBeatData;
            const lane = enhancedBeat.lane !== undefined ? enhancedBeat.lane : (beatsToUse.indexOf(beat) % LANES);
            const laneX = targetArrows[lane].x;
            
            // Use enhanced hold note properties for more variety
            const isHoldNote = enhancedBeat.isHold || false;
            const holdDuration = enhancedBeat.holdDuration || 0;
            
            console.log(`🎵 Creating beat at ${beat.time.toFixed(2)}s: lane=${lane}, isHold=${isHoldNote}, duration=${holdDuration.toFixed(2)}s, pattern=${enhancedBeat.templateName}, section=${enhancedBeat.section}`);
            
            newObjects.push({
              id: `${beat.time}-${beat.type}-${lane}`,
              x: laneX,
              y: 1.2, // Start below screen
              lane,
              beat: {
                ...beat,
                type: isHoldNote ? 'hold' : beat.type
              },
              created: currentTime,
              hit: false,
              isHolding: false,
              holdStartTime: undefined
            });
          }
        }
      });

      // Update existing objects
      const updated = prev.map(obj => {
        const elapsed = currentTime - obj.created;
        const progress = elapsed / APPROACH_TIME;
        
        // Arrow moves from bottom (y=1.2) to target (y=TARGET_Y)
        const startY = 1.2;
        const endY = TARGET_Y;
        const newY = startY - (startY - endY) * progress;
        
        return {
          ...obj,
          y: newY
        };
      }).filter(obj => {
        // Remove objects that are too far past the target
        const timePast = currentTime - obj.beat.time;
        if (timePast > HIT_TOLERANCE && !obj.hit) {
          onBeatMiss();
          setCombo(0);
          return false;
        }
        return timePast < 1; // Keep for 1 second after passing
      });

      return [...updated, ...newObjects];
    });
  }, [audioCurrentTime, beats, gameState, onBeatMiss, enhancedBeats]);

  // Update game objects when state changes
  useEffect(() => {
    updateGameObjects();
  }, [updateGameObjects]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply screen shake
      if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 10;
        const shakeY = (Math.random() - 0.5) * screenShake * 10;
        ctx.translate(shakeX, shakeY);
        setScreenShake(prev => Math.max(0, prev - 0.02));
      }

      // Apply screen flash
      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(139, 92, 246, ${screenFlash * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setScreenFlash(prev => Math.max(0, prev - 0.02));
      }

      // Draw target arrows
      targetArrows.forEach(target => {
        const x = target.x * canvas.width;
        const y = target.y * canvas.height;
        const { color, direction } = getArrowProps(target.lane);
        
        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
        gradient.addColorStop(0, color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Arrow shape
        ctx.fillStyle = color;
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(direction, x, y);
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeText(direction, x, y);
      });

      // Draw moving arrows
      gameObjects.forEach(obj => {
        if (obj.hit) return;

        const x = obj.x * canvas.width;
        const y = obj.y * canvas.height;
        const { color, direction } = getArrowProps(obj.lane);
        
        // Calculate opacity based on distance to target
        const distanceToTarget = Math.abs(obj.y - TARGET_Y);
        const opacity = Math.max(0.3, 1 - distanceToTarget * 2);
        
        // For hold notes, draw a trailing effect
        if (obj.beat.type === 'hold') {
          // Draw hold trail
          const trailHeight = 60; // Height of the hold trail
          const gradient = ctx.createLinearGradient(x, y - trailHeight, x, y + trailHeight);
          gradient.addColorStop(0, color + '20');
          gradient.addColorStop(0.5, color + Math.floor(opacity * 180).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, color + '20');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 20, y - trailHeight, 40, trailHeight * 2);
          
          // Draw hold note border
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 20, y - trailHeight, 40, trailHeight * 2);
        }
        
        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 35);
        gradient.addColorStop(0, color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Arrow - make hold notes slightly larger
        const fontSize = obj.beat.type === 'hold' ? 30 : 25;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(direction, x, y);
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = obj.beat.type === 'hold' ? 2 : 1.5;
        ctx.strokeText(direction, x, y);
        ctx.globalAlpha = 1;
      });

      // Draw particles
      const updatedParticles = particles.map(particle => {
        particle.x += particle.vx * 0.016;
        particle.y += particle.vy * 0.016;
        particle.life -= 0.016;
        
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(
          particle.x * canvas.width,
          particle.y * canvas.height,
          particle.size * canvas.width,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        return particle;
      }).filter(p => p.life > 0);
      
      // Update particles state only if there's a change
      if (updatedParticles.length !== particles.length) {
        setTimeout(() => setParticles(updatedParticles), 0);
      }

      // Draw UI
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 40);
      ctx.fillText(`Combo: ${combo}`, 20, 70);

      animationRef.current = requestAnimationFrame(animate);
    };

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameObjects, particles, score, combo, screenShake, screenFlash]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const backgroundImage = getBackgroundPath(selectedBackground);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouch}
      />
      {hitQualityDisplay && (
        <HitQualityIndicator
          hitData={hitQualityDisplay.data}
          x={hitQualityDisplay.x}
          y={hitQualityDisplay.y}
        />
      )}
    </div>
  );
};