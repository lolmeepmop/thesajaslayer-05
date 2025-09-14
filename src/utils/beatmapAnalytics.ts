import { EnhancedBeatData } from './beatmapGenerator';

export interface BeatmapAnalytics {
  diversityMetrics: DiversityMetrics;
  ergonomicsMetrics: ErgonomicsMetrics;
  musicalityMetrics: MusicalityMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface DiversityMetrics {
  patternEntropy: number; // Higher = more diverse
  ngramDiversity: number; // Unique n-gram ratio
  repetitionDistance: number; // Average distance between repeats
  laneBalance: number; // 0-1, closer to 1 = more balanced
  holdVariety: number; // Hold pattern diversity
}

export interface ErgonomicsMetrics {
  handAlternation: number; // 0-1, ergonomic alternation score
  jumpDistance: number; // Average lane jump distance
  restFrequency: number; // Ratio of rest periods
  staminaLoad: number; // Cumulative difficulty over time
  readabilityScore: number; // Pattern readability rating
}

export interface MusicalityMetrics {
  beatAlignment: number; // How well beats align with musical structure
  accentEmphasis: number; // How well accents are represented
  phraseCoherence: number; // Musical phrase boundary respect
  dynamicRange: number; // Intensity variation range
}

export interface PerformanceMetrics {
  complexity: number; // Overall difficulty rating
  peakIntensity: number; // Maximum sustained intensity
  learningCurve: number; // How gradually difficulty increases
  replayability: number; // Pattern variation richness
}

export class BeatmapAnalyzer {
  
  /**
   * Analyze a beatmap for comprehensive metrics
   */
  analyze(beats: EnhancedBeatData[]): BeatmapAnalytics {
    return {
      diversityMetrics: this.analyzeDiversity(beats),
      ergonomicsMetrics: this.analyzeErgonomics(beats),
      musicalityMetrics: this.analyzeMusicality(beats),
      performanceMetrics: this.analyzePerformance(beats)
    };
  }

  /**
   * Calculate pattern diversity metrics
   */
  private analyzeDiversity(beats: EnhancedBeatData[]): DiversityMetrics {
    const ngramSize = 4;
    const ngrams = this.extractNGrams(beats, ngramSize);
    const uniqueNGrams = new Set(ngrams).size;
    
    // Pattern entropy calculation
    const patternCounts = new Map<string, number>();
    ngrams.forEach(ngram => {
      patternCounts.set(ngram, (patternCounts.get(ngram) || 0) + 1);
    });
    
    let entropy = 0;
    const totalPatterns = ngrams.length;
    patternCounts.forEach(count => {
      const probability = count / totalPatterns;
      entropy -= probability * Math.log2(probability);
    });
    
    // Repetition distance calculation
    const repetitionDistances: number[] = [];
    const patternIndices = new Map<string, number[]>();
    
    ngrams.forEach((ngram, index) => {
      if (!patternIndices.has(ngram)) {
        patternIndices.set(ngram, []);
      }
      patternIndices.get(ngram)!.push(index);
    });
    
    patternIndices.forEach(indices => {
      for (let i = 1; i < indices.length; i++) {
        repetitionDistances.push(indices[i] - indices[i-1]);
      }
    });
    
    const avgRepetitionDistance = repetitionDistances.length > 0 
      ? repetitionDistances.reduce((a, b) => a + b, 0) / repetitionDistances.length
      : Infinity;

    // Lane balance calculation
    const laneDistribution = [0, 0, 0, 0];
    beats.forEach(beat => laneDistribution[beat.lane]++);
    const idealRatio = beats.length / 4;
    const laneBalance = 1 - (laneDistribution.reduce((sum, count) => 
      sum + Math.abs(count - idealRatio), 0) / beats.length);

    // Hold variety calculation
    const holdPatterns = beats.filter(b => b.isHold).map(b => 
      `${b.lane}-${Math.floor((b.holdDuration || 0) * 10)}`
    );
    const uniqueHoldPatterns = new Set(holdPatterns).size;
    const holdVariety = holdPatterns.length > 0 ? uniqueHoldPatterns / holdPatterns.length : 0;

    return {
      patternEntropy: entropy / Math.log2(Math.min(totalPatterns, 16)), // Normalize
      ngramDiversity: uniqueNGrams / Math.max(ngrams.length, 1),
      repetitionDistance: Math.min(avgRepetitionDistance / 16, 1), // Normalize to 16-beat max
      laneBalance,
      holdVariety
    };
  }

  /**
   * Calculate ergonomics and playability metrics
   */
  private analyzeErgonomics(beats: EnhancedBeatData[]): ErgonomicsMetrics {
    if (beats.length < 2) {
      return { handAlternation: 1, jumpDistance: 0, restFrequency: 1, staminaLoad: 0, readabilityScore: 1 };
    }

    // Hand alternation analysis (assuming lanes 0,1 = left hand, 2,3 = right hand)
    let alternationCount = 0;
    for (let i = 1; i < beats.length; i++) {
      const prevHand = beats[i-1].lane < 2 ? 'left' : 'right';
      const currentHand = beats[i].lane < 2 ? 'left' : 'right';
      if (prevHand !== currentHand) alternationCount++;
    }
    const handAlternation = alternationCount / (beats.length - 1);

    // Jump distance calculation
    const jumpDistances = [];
    for (let i = 1; i < beats.length; i++) {
      jumpDistances.push(Math.abs(beats[i].lane - beats[i-1].lane));
    }
    const avgJumpDistance = jumpDistances.reduce((a, b) => a + b, 0) / jumpDistances.length;

    // Rest frequency analysis
    const restPeriods = [];
    for (let i = 1; i < beats.length; i++) {
      const timeDiff = beats[i].time - beats[i-1].time;
      if (timeDiff > 0.5) restPeriods.push(timeDiff); // Rest = >0.5s gap
    }
    const restFrequency = restPeriods.length / beats.length;

    // Stamina load calculation (intensity over time)
    const windowSize = 10; // 10-beat windows
    let maxStaminaLoad = 0;
    for (let i = 0; i <= beats.length - windowSize; i++) {
      const window = beats.slice(i, i + windowSize);
      const windowDuration = window[window.length - 1].time - window[0].time;
      const staminaLoad = window.length / Math.max(windowDuration, 0.1); // NPS-based
      maxStaminaLoad = Math.max(maxStaminaLoad, staminaLoad);
    }

    // Readability score (based on pattern complexity and spacing)
    const readabilityFactors = [];
    for (let i = 1; i < beats.length; i++) {
      const timeDiff = beats[i].time - beats[i-1].time;
      const laneDiff = Math.abs(beats[i].lane - beats[i-1].lane);
      
      // Good readability: reasonable timing and lane changes
      const timingScore = Math.min(timeDiff / 0.2, 1); // Normalize to 200ms
      const laneScore = 1 - (laneDiff / 3); // Penalize large jumps
      readabilityFactors.push((timingScore + laneScore) / 2);
    }
    const readabilityScore = readabilityFactors.reduce((a, b) => a + b, 0) / readabilityFactors.length;

    return {
      handAlternation,
      jumpDistance: Math.min(avgJumpDistance / 3, 1), // Normalize to max 3-lane jump
      restFrequency: Math.min(restFrequency * 5, 1), // Scale appropriately
      staminaLoad: Math.min(maxStaminaLoad / 10, 1), // Normalize to 10 NPS max
      readabilityScore
    };
  }

  /**
   * Calculate musicality alignment metrics
   */
  private analyzeMusicality(beats: EnhancedBeatData[]): MusicalityMetrics {
    // Beat alignment with musical structure
    const sectionChanges = this.findSectionChanges(beats);
    const strongBeats = beats.filter(b => b.type === 'bass' || b.intensity > 0.7);
    const beatAlignment = strongBeats.length / Math.max(beats.length, 1);

    // Accent emphasis
    const accentBeats = beats.filter(b => b.isAccent || b.intensity > 0.8);
    const accentEmphasis = accentBeats.length / Math.max(beats.length, 1);

    // Phrase coherence (how well patterns respect musical phrases)
    const phraseBreaks = sectionChanges.length;
    const avgPhraseLength = beats.length / Math.max(phraseBreaks, 1);
    const phraseCoherence = Math.min(avgPhraseLength / 16, 1); // Ideal 16-beat phrases

    // Dynamic range
    const intensities = beats.map(b => b.intensity);
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);
    const dynamicRange = maxIntensity - minIntensity;

    return {
      beatAlignment,
      accentEmphasis,
      phraseCoherence,
      dynamicRange
    };
  }

  /**
   * Calculate performance and gameplay metrics
   */
  private analyzePerformance(beats: EnhancedBeatData[]): PerformanceMetrics {
    // Overall complexity
    const laneChanges = beats.slice(1).reduce((count, beat, i) => 
      count + (beat.lane !== beats[i].lane ? 1 : 0), 0);
    const holdComplexity = beats.filter(b => b.isHold).length / beats.length;
    const timingComplexity = this.calculateTimingComplexity(beats);
    const complexity = (laneChanges / beats.length + holdComplexity + timingComplexity) / 3;

    // Peak intensity analysis
    const windowSize = 20; // 20-beat windows
    let peakIntensity = 0;
    for (let i = 0; i <= beats.length - windowSize; i++) {
      const window = beats.slice(i, i + windowSize);
      const windowIntensity = window.reduce((sum, b) => sum + b.intensity, 0) / window.length;
      peakIntensity = Math.max(peakIntensity, windowIntensity);
    }

    // Learning curve (how gradually difficulty increases)
    const difficultyProgression = this.calculateDifficultyProgression(beats);
    const learningCurve = 1 - this.calculateVariance(difficultyProgression); // Lower variance = better curve

    // Replayability (pattern variation richness)
    const patternTypes = new Set(beats.map(b => b.pattern)).size;
    const templateVariety = new Set(beats.map(b => b.templateName).filter(Boolean)).size;
    const replayability = (patternTypes + templateVariety) / (beats.length * 0.1); // Normalize

    return {
      complexity: Math.min(complexity, 1),
      peakIntensity,
      learningCurve: Math.max(learningCurve, 0),
      replayability: Math.min(replayability, 1)
    };
  }

  /**
   * Extract n-grams from beat sequence
   */
  private extractNGrams(beats: EnhancedBeatData[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= beats.length - n; i++) {
      const ngram = beats.slice(i, i + n)
        .map(b => `${b.lane}-${b.pattern}-${b.isHold ? 'H' : 'T'}`)
        .join('|');
      ngrams.push(ngram);
    }
    return ngrams;
  }

  /**
   * Find section changes in the beatmap
   */
  private findSectionChanges(beats: EnhancedBeatData[]): number[] {
    const changes: number[] = [];
    let currentSection = beats[0]?.section;
    
    beats.forEach((beat, index) => {
      if (beat.section !== currentSection) {
        changes.push(index);
        currentSection = beat.section;
      }
    });
    
    return changes;
  }

  /**
   * Calculate timing complexity based on rhythm patterns
   */
  private calculateTimingComplexity(beats: EnhancedBeatData[]): number {
    if (beats.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i-1].time);
    }
    
    // Complexity increases with timing variation
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = this.calculateVariance(intervals);
    
    return Math.min(variance / avgInterval, 1); // Normalize
  }

  /**
   * Calculate difficulty progression over time
   */
  private calculateDifficultyProgression(beats: EnhancedBeatData[]): number[] {
    const windowSize = 30;
    const progression: number[] = [];
    
    for (let i = 0; i <= beats.length - windowSize; i += windowSize / 2) {
      const window = beats.slice(i, i + windowSize);
      const difficulty = this.calculateWindowDifficulty(window);
      progression.push(difficulty);
    }
    
    return progression;
  }

  /**
   * Calculate difficulty for a window of beats
   */
  private calculateWindowDifficulty(window: EnhancedBeatData[]): number {
    if (window.length === 0) return 0;
    
    const avgIntensity = window.reduce((sum, b) => sum + b.intensity, 0) / window.length;
    const laneChanges = window.slice(1).reduce((count, beat, i) => 
      count + (beat.lane !== window[i].lane ? 1 : 0), 0);
    const holdRatio = window.filter(b => b.isHold).length / window.length;
    
    return (avgIntensity + (laneChanges / window.length) + holdRatio) / 3;
  }

  /**
   * Calculate variance of a number array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    
    return variance;
  }

  /**
   * Generate quality score (0-100)
   */
  generateQualityScore(analytics: BeatmapAnalytics): number {
    const weights = {
      diversity: 0.25,
      ergonomics: 0.25,
      musicality: 0.25,
      performance: 0.25
    };

    const diversityScore = (
      analytics.diversityMetrics.patternEntropy * 0.3 +
      analytics.diversityMetrics.ngramDiversity * 0.3 +
      analytics.diversityMetrics.repetitionDistance * 0.2 +
      analytics.diversityMetrics.laneBalance * 0.2
    );

    const ergonomicsScore = (
      analytics.ergonomicsMetrics.handAlternation * 0.3 +
      (1 - analytics.ergonomicsMetrics.jumpDistance) * 0.2 +
      analytics.ergonomicsMetrics.restFrequency * 0.2 +
      (1 - analytics.ergonomicsMetrics.staminaLoad) * 0.15 +
      analytics.ergonomicsMetrics.readabilityScore * 0.15
    );

    const musicalityScore = (
      analytics.musicalityMetrics.beatAlignment * 0.3 +
      analytics.musicalityMetrics.accentEmphasis * 0.25 +
      analytics.musicalityMetrics.phraseCoherence * 0.25 +
      analytics.musicalityMetrics.dynamicRange * 0.2
    );

    const performanceScore = (
      analytics.performanceMetrics.complexity * 0.25 +
      analytics.performanceMetrics.peakIntensity * 0.25 +
      analytics.performanceMetrics.learningCurve * 0.25 +
      analytics.performanceMetrics.replayability * 0.25
    );

    const totalScore = (
      diversityScore * weights.diversity +
      ergonomicsScore * weights.ergonomics +
      musicalityScore * weights.musicality +
      performanceScore * weights.performance
    );

    return Math.round(totalScore * 100);
  }
}