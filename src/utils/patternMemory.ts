import { EnhancedBeatData, PatternType } from './beatmapGenerator';

export interface PatternNGram {
  sequence: string;
  frequency: number;
  lastUsed: number;
  context: {
    section: string;
    energy: number;
    timestamp: number;
  };
}

export interface PatternMemoryConfig {
  maxHistorySize: number;
  minRepetitionDistance: number; // Minimum beats between pattern repeats
  ngramSize: number;
  diversityThreshold: number; // 0-1, higher = more diverse required
}

export class PatternMemory {
  private patternHistory: PatternNGram[] = [];
  private beatCounter: number = 0;
  private config: PatternMemoryConfig;

  constructor(config: Partial<PatternMemoryConfig> = {}) {
    this.config = {
      maxHistorySize: 200,
      minRepetitionDistance: 16, // 4 bars minimum
      ngramSize: 4,
      diversityThreshold: 0.7,
      ...config
    };
  }

  /**
   * Record a pattern sequence for anti-repetition tracking
   */
  recordPattern(beats: EnhancedBeatData[], section: string, energy: number): void {
    if (beats.length < this.config.ngramSize) return;

    const sequence = this.createSequenceKey(beats);
    const existingPattern = this.patternHistory.find(p => p.sequence === sequence);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastUsed = this.beatCounter;
    } else {
      this.patternHistory.push({
        sequence,
        frequency: 1,
        lastUsed: this.beatCounter,
        context: { section, energy, timestamp: Date.now() }
      });
    }

    this.beatCounter += beats.length;
    this.pruneHistory();
  }

  /**
   * Check if a pattern would be too repetitive
   */
  wouldBeRepetitive(beats: EnhancedBeatData[]): boolean {
    if (beats.length < this.config.ngramSize) return false;

    const sequence = this.createSequenceKey(beats);
    const existingPattern = this.patternHistory.find(p => p.sequence === sequence);

    if (!existingPattern) return false;

    const distanceSinceLastUse = this.beatCounter - existingPattern.lastUsed;
    const isTooCIose = distanceSinceLastUse < this.config.minRepetitionDistance;
    const isTooFrequent = existingPattern.frequency > 3;

    return isTooCIose || isTooFrequent;
  }

  /**
   * Get diversity score (0-1, higher = more diverse)
   */
  getDiversityScore(): number {
    if (this.patternHistory.length < 5) return 1.0;

    const totalPatterns = this.patternHistory.length;
    const uniquePatterns = new Set(this.patternHistory.map(p => p.sequence)).size;
    const entropyScore = uniquePatterns / totalPatterns;

    // Factor in frequency distribution
    const frequencies = this.patternHistory.map(p => p.frequency);
    const maxFreq = Math.max(...frequencies);
    const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const balanceScore = 1 - (maxFreq - avgFreq) / maxFreq;

    return (entropyScore * 0.7) + (balanceScore * 0.3);
  }

  /**
   * Get cooldown patterns that should be avoided
   */
  getCooldownPatterns(): Set<string> {
    const cooldownPatterns = new Set<string>();
    
    this.patternHistory.forEach(pattern => {
      const distanceSinceLastUse = this.beatCounter - pattern.lastUsed;
      if (distanceSinceLastUse < this.config.minRepetitionDistance) {
        cooldownPatterns.add(pattern.sequence);
      }
    });

    return cooldownPatterns;
  }

  /**
   * Create a unique key for a beat sequence
   */
  private createSequenceKey(beats: EnhancedBeatData[]): string {
    return beats
      .slice(0, this.config.ngramSize)
      .map(beat => `${beat.lane}-${beat.pattern}-${beat.isHold ? 'H' : 'T'}`)
      .join('|');
  }

  /**
   * Remove old patterns to prevent memory bloat
   */
  private pruneHistory(): void {
    if (this.patternHistory.length > this.config.maxHistorySize) {
      // Remove patterns not used recently, preferring less frequent ones
      this.patternHistory.sort((a, b) => {
        const aScore = a.frequency + (this.beatCounter - a.lastUsed) * 0.1;
        const bScore = b.frequency + (this.beatCounter - b.lastUsed) * 0.1;
        return aScore - bScore;
      });

      this.patternHistory = this.patternHistory.slice(-this.config.maxHistorySize * 0.8);
    }
  }

  /**
   * Reset memory (for new songs)
   */
  reset(): void {
    this.patternHistory = [];
    this.beatCounter = 0;
  }

  /**
   * Get analytics data for debugging
   */
  getAnalytics() {
    return {
      totalPatterns: this.patternHistory.length,
      uniquePatterns: new Set(this.patternHistory.map(p => p.sequence)).size,
      diversityScore: this.getDiversityScore(),
      avgFrequency: this.patternHistory.reduce((sum, p) => sum + p.frequency, 0) / this.patternHistory.length,
      cooldownCount: this.getCooldownPatterns().size
    };
  }
}