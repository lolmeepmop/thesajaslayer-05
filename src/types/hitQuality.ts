export type HitQuality = 'perfect' | 'great' | 'good' | 'miss';

export interface HitQualityData {
  quality: HitQuality;
  accuracy: number;
  points: number;
  multiplier: number;
}

export interface HitQualityConfig {
  minAccuracy: number;
  maxAccuracy: number;
  basePoints: number;
  multiplier: number;
  label: string;
  color: string;
}

export const HIT_QUALITY_CONFIGS: Record<HitQuality, HitQualityConfig> = {
  perfect: {
    minAccuracy: 0.9,
    maxAccuracy: 1.0,
    basePoints: 300,
    multiplier: 1.5,
    label: 'PERFECT!',
    color: 'hsl(var(--neon-cyan))'
  },
  great: {
    minAccuracy: 0.75,
    maxAccuracy: 0.9,
    basePoints: 200,
    multiplier: 1.2,
    label: 'GREAT!',
    color: 'hsl(var(--neon-purple))'
  },
  good: {
    minAccuracy: 0.6,
    maxAccuracy: 0.75,
    basePoints: 100,
    multiplier: 1.0,
    label: 'GOOD',
    color: 'hsl(var(--secondary))'
  },
  miss: {
    minAccuracy: 0,
    maxAccuracy: 0.6,
    basePoints: 0,
    multiplier: 0,
    label: 'MISS',
    color: 'hsl(var(--destructive))'
  }
};

export const getHitQuality = (accuracy: number): HitQuality => {
  for (const [quality, config] of Object.entries(HIT_QUALITY_CONFIGS)) {
    if (accuracy >= config.minAccuracy && accuracy < config.maxAccuracy) {
      return quality as HitQuality;
    }
  }
  return 'miss';
};

export const calculateScore = (quality: HitQuality, combo: number): number => {
  const config = HIT_QUALITY_CONFIGS[quality];
  const comboMultiplier = 1 + (combo * 0.1);
  return Math.floor(config.basePoints * config.multiplier * comboMultiplier);
};