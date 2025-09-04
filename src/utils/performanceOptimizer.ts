import { ObjectPool, PerformanceConfig, PerformanceMetrics } from '../types/performance';

// Generic object pool implementation
export function createObjectPool<T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  initialSize: number = 10
): ObjectPool<T> {
  const available: T[] = [];
  const inUse: T[] = [];
  
  // Pre-populate pool
  for (let i = 0; i < initialSize; i++) {
    available.push(createFn());
  }
  
  return {
    available,
    inUse,
    create: createFn,
    reset: resetFn,
    
    get(): T {
      let obj = available.pop();
      if (!obj) {
        obj = createFn();
      }
      inUse.push(obj);
      return obj;
    },
    
    release(obj: T): void {
      const index = inUse.indexOf(obj);
      if (index !== -1) {
        inUse.splice(index, 1);
        resetFn(obj);
        available.push(obj);
      }
    }
  };
}

// Game object types for pooling
export interface PooledGameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: { x: number; y: number };
  active: boolean;
  lane: number;
  time: number;
  intensity: number;
}

export interface PooledParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  active: boolean;
}

// Object pool factories
export const createGameObjectPool = (size: number = 50): ObjectPool<PooledGameObject> => {
  return createObjectPool<PooledGameObject>(
    () => ({
      x: 0,
      y: 0,
      width: 60,
      height: 20,
      velocity: { x: 0, y: 0 },
      active: false,
      lane: 0,
      time: 0,
      intensity: 0
    }),
    (obj) => {
      obj.active = false;
      obj.x = 0;
      obj.y = 0;
      obj.velocity.x = 0;
      obj.velocity.y = 0;
      obj.lane = 0;
      obj.time = 0;
      obj.intensity = 0;
    },
    size
  );
};

export const createParticlePool = (size: number = 100): ObjectPool<PooledParticle> => {
  return createObjectPool<PooledParticle>(
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      color: '#ffffff',
      active: false
    }),
    (particle) => {
      particle.active = false;
      particle.life = 0;
      particle.x = 0;
      particle.y = 0;
      particle.vx = 0;
      particle.vy = 0;
      particle.size = 1;
      particle.color = '#ffffff';
    },
    size
  );
};

// Performance optimization utilities
export class PerformanceOptimizer {
  private frameHistory: number[] = [];
  private lastOptimization: number = 0;
  private optimizationInterval: number = 5000; // 5 seconds
  
  constructor(private config: PerformanceConfig) {}
  
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  recordFrame(frameTime: number): void {
    this.frameHistory.push(frameTime);
    
    // Keep only last 60 frames for analysis
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }
  }
  
  shouldOptimize(): boolean {
    const now = Date.now();
    if (now - this.lastOptimization < this.optimizationInterval) {
      return false;
    }
    
    if (this.frameHistory.length < 30) {
      return false;
    }
    
    const avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length;
    const targetFrameTime = 1000 / this.config.targetFPS;
    
    return avgFrameTime > targetFrameTime * 1.2; // 20% tolerance
  }
  
  optimize(): Partial<PerformanceConfig> {
    this.lastOptimization = Date.now();
    
    const avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length;
    const fps = 1000 / avgFrameTime;
    
    const optimizations: Partial<PerformanceConfig> = {};
    
    if (fps < 30) {
      // Critical performance - aggressive optimizations
      optimizations.qualityLevel = 'low';
      optimizations.maxParticles = Math.max(10, Math.floor(this.config.maxParticles * 0.25));
      optimizations.maxGameObjects = Math.max(10, Math.floor(this.config.maxGameObjects * 0.5));
    } else if (fps < 45) {
      // Poor performance - moderate optimizations
      optimizations.qualityLevel = 'medium';
      optimizations.maxParticles = Math.max(25, Math.floor(this.config.maxParticles * 0.5));
      optimizations.maxGameObjects = Math.max(20, Math.floor(this.config.maxGameObjects * 0.75));
    } else if (fps > 55 && this.config.qualityLevel !== 'high') {
      // Good performance - can increase quality
      optimizations.qualityLevel = 'high';
      optimizations.maxParticles = Math.min(150, Math.floor(this.config.maxParticles * 1.5));
      optimizations.maxGameObjects = Math.min(100, Math.floor(this.config.maxGameObjects * 1.25));
    }
    
    return optimizations;
  }
  
  getRecommendedSettings(): PerformanceConfig {
    // Detect device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const memoryInfo = (performance as any).memory;
    const hasLowMemory = memoryInfo ? memoryInfo.jsHeapSizeLimit < 100 * 1024 * 1024 : false;
    
    if (isMobile || hasLowMemory || !hasWebGL) {
      return {
        targetFPS: 30,
        maxParticles: 25,
        maxGameObjects: 25,
        qualityLevel: 'low',
        adaptiveQuality: true
      };
    } else {
      return {
        targetFPS: 60,
        maxParticles: 100,
        maxGameObjects: 50,
        qualityLevel: 'high',
        adaptiveQuality: true
      };
    }
  }
}

// Canvas optimization utilities
export const optimizeCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Enable hardware acceleration hints
  ctx.imageSmoothingEnabled = false;
  
  // Set high-DPI scaling
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
};

// Efficient collision detection
export const checkCollision = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
};

// Batch DOM updates
export class DOMBatcher {
  private updates: (() => void)[] = [];
  private scheduled = false;
  
  add(updateFn: () => void): void {
    this.updates.push(updateFn);
    this.schedule();
  }
  
  private schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.updates.forEach(update => update());
      this.updates = [];
      this.scheduled = false;
    });
  }
}
