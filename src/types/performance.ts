export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  audioLatency: number;
  renderTime: number;
  gameObjects: number;
  particles: number;
}

export interface PerformanceConfig {
  targetFPS: number;
  maxParticles: number;
  maxGameObjects: number;
  qualityLevel: 'low' | 'medium' | 'high';
  adaptiveQuality: boolean;
}

export interface ObjectPool<T> {
  available: T[];
  inUse: T[];
  create: () => T;
  reset: (obj: T) => void;
  get: () => T;
  release: (obj: T) => void;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  maxParticles: 100,
  maxGameObjects: 50,
  qualityLevel: 'high',
  adaptiveQuality: true,
};

export const PERFORMANCE_THRESHOLDS = {
  lowFPS: 30,
  criticalFPS: 20,
  highMemory: 100 * 1024 * 1024, // 100MB
  criticalMemory: 200 * 1024 * 1024, // 200MB
};