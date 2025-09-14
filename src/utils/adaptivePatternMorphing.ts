import { EnhancedBeatData, PatternTemplate, PatternType } from './beatmapGenerator';

export interface MorphingConfig {
  rhythmicVariance: number; // ±ms for micro-timing
  spatialRotation: boolean;
  densityBursts: boolean;
  holdVariations: boolean;
  laneChoreography: boolean;
}

export class AdaptivePatternMorpher {
  private config: MorphingConfig;
  private lastMorphTime: number = 0;

  constructor(config: Partial<MorphingConfig> = {}) {
    this.config = {
      rhythmicVariance: 20, // ±20ms
      spatialRotation: true,
      densityBursts: true,
      holdVariations: true,
      laneChoreography: true,
      ...config
    };
  }

  /**
   * Apply rhythmic micro-timing humanization
   */
  applyRhythmicVariance(beats: EnhancedBeatData[]): EnhancedBeatData[] {
    if (!this.config.rhythmicVariance) return beats;

    return beats.map(beat => ({
      ...beat,
      time: beat.time + (Math.random() - 0.5) * (this.config.rhythmicVariance / 1000)
    }));
  }

  /**
   * Create spatial pattern variations (mirroring, rotation)
   */
  applySpatialRotation(beats: EnhancedBeatData[], variant: 'mirror' | 'rotate' | 'invert'): EnhancedBeatData[] {
    if (!this.config.spatialRotation) return beats;

    return beats.map(beat => {
      let newLane = beat.lane;
      
      switch (variant) {
        case 'mirror':
          newLane = 3 - beat.lane; // Mirror lanes: 0↔3, 1↔2
          break;
        case 'rotate':
          newLane = (beat.lane + 1) % 4; // Shift lanes right
          break;
        case 'invert':
          newLane = (beat.lane + 2) % 4; // Opposite lanes
          break;
      }

      return { ...beat, lane: newLane };
    });
  }

  /**
   * Add density bursts for variety
   */
  addDensityBurst(
    beats: EnhancedBeatData[],
    burstIntensity: number = 0.3
  ): EnhancedBeatData[] {
    if (!this.config.densityBursts || beats.length < 2) return beats;

    const burstBeats: EnhancedBeatData[] = [...beats];
    const burstCount = Math.floor(beats.length * burstIntensity);

    for (let i = 0; i < burstCount; i++) {
      const baseIndex = Math.floor(Math.random() * (beats.length - 1));
      const baseBeat = beats[baseIndex];
      const nextBeat = beats[baseIndex + 1];
      
      if (nextBeat.time - baseBeat.time > 0.2) { // Enough space for burst
        const burstBeat: EnhancedBeatData = {
          ...baseBeat,
          time: baseBeat.time + 0.1,
          lane: (baseBeat.lane + 1) % 4, // Adjacent lane
          pattern: 'dense',
          intensity: Math.min(baseBeat.intensity * 0.8, 1.0)
        };
        
        burstBeats.push(burstBeat);
      }
    }

    return burstBeats.sort((a, b) => a.time - b.time);
  }

  /**
   * Apply hold note variations
   */
  applyHoldVariations(beats: EnhancedBeatData[]): EnhancedBeatData[] {
    if (!this.config.holdVariations) return beats;

    return beats.map((beat, index) => {
      if (beat.isHold) {
        // Vary hold durations based on musical context
        const baseHoldDuration = beat.holdDuration || 0.5;
        let newHoldDuration = baseHoldDuration;

        // Extend holds in sustained sections
        if (beat.section === 'chorus' || beat.section === 'bridge') {
          newHoldDuration *= 1.2;
        }

        // Add release timing variety
        const hasReleasePattern = index < beats.length - 1 && 
          beats[index + 1].time - beat.time < newHoldDuration + 0.1;

        return {
          ...beat,
          holdDuration: Math.min(newHoldDuration, 2.0), // Cap at 2 seconds
          templateName: hasReleasePattern ? 'complex-hold' : beat.templateName
        };
      }
      return beat;
    });
  }

  /**
   * Apply intelligent lane choreography
   */
  applyLaneChoreography(
    beats: EnhancedBeatData[],
    energyLevel: number,
    harmonicContour: number[]
  ): EnhancedBeatData[] {
    if (!this.config.laneChoreography) return beats;

    return beats.map((beat, index) => {
      let newLane = beat.lane;

      // Map harmonic contour to lane assignment
      if (harmonicContour && index < harmonicContour.length) {
        const contourValue = harmonicContour[index];
        // Map frequency/pitch to lanes (lower = left lanes, higher = right lanes)
        if (contourValue < 0.3) {
          newLane = Math.random() < 0.7 ? 0 : 1; // Favor left lanes
        } else if (contourValue > 0.7) {
          newLane = Math.random() < 0.7 ? 3 : 2; // Favor right lanes
        } else {
          newLane = Math.random() < 0.5 ? 1 : 2; // Center lanes
        }
      }

      // Energy-based lane spreading
      if (energyLevel > 0.7) {
        // High energy: prefer outer lanes for dramatic effect
        if (Math.random() < 0.6) {
          newLane = Math.random() < 0.5 ? 0 : 3;
        }
      } else if (energyLevel < 0.3) {
        // Low energy: prefer center lanes for subtlety
        newLane = Math.random() < 0.8 ? (Math.random() < 0.5 ? 1 : 2) : newLane;
      }

      return { ...beat, lane: newLane };
    });
  }

  /**
   * Create crossfade between pattern templates
   */
  crossfadeTemplates(
    fromBeats: EnhancedBeatData[],
    toBeats: EnhancedBeatData[],
    crossfadeRatio: number = 0.5
  ): EnhancedBeatData[] {
    const midPoint = Math.floor(fromBeats.length * crossfadeRatio);
    
    const crossfadedBeats = [
      ...fromBeats.slice(0, midPoint),
      ...toBeats.slice(midPoint)
    ];

    // Smooth the transition by adjusting timing
    for (let i = midPoint - 1; i <= midPoint + 1; i++) {
      if (i >= 0 && i < crossfadedBeats.length && i < fromBeats.length) {
        const transitionWeight = Math.abs(i - midPoint) / 2;
        crossfadedBeats[i] = {
          ...crossfadedBeats[i],
          intensity: (fromBeats[i]?.intensity || 0.5) * transitionWeight + 
                    (toBeats[i]?.intensity || 0.5) * (1 - transitionWeight)
        };
      }
    }

    return crossfadedBeats;
  }

  /**
   * Add anticipation notes before section changes
   */
  addAnticipationNotes(
    beats: EnhancedBeatData[],
    sectionChangeTime: number
  ): EnhancedBeatData[] {
    const anticipationBeats = [...beats];
    
    // Add subtle preparation notes 0.5 seconds before section change
    const anticipationTime = sectionChangeTime - 0.5;
    
    // Find a good lane for anticipation (opposite of nearby beats)
    const nearbyBeats = beats.filter(b => 
      Math.abs(b.time - anticipationTime) < 0.3
    );
    
    let anticipationLane = 1; // Default to center-left
    if (nearbyBeats.length > 0) {
      const usedLanes = new Set(nearbyBeats.map(b => b.lane));
      anticipationLane = [0, 1, 2, 3].find(lane => !usedLanes.has(lane)) || 1;
    }

    const anticipationBeat: EnhancedBeatData = {
      time: anticipationTime,
      type: 'bass',
      frequency: 150,
      intensity: 0.3,
      lane: anticipationLane,
      pattern: 'sparse',
      section: 'bridge', // Neutral section
      isHold: false,
      holdDuration: 0,
      templateName: 'anticipation'
    };

    anticipationBeats.push(anticipationBeat);
    return anticipationBeats.sort((a, b) => a.time - b.time);
  }

  /**
   * Generate pattern morphing metrics
   */
  getMorphingMetrics(originalBeats: EnhancedBeatData[], morphedBeats: EnhancedBeatData[]) {
    return {
      originalLength: originalBeats.length,
      morphedLength: morphedBeats.length,
      densityChange: (morphedBeats.length - originalBeats.length) / originalBeats.length,
      laneDistribution: this.calculateLaneDistribution(morphedBeats),
      holdRatio: morphedBeats.filter(b => b.isHold).length / morphedBeats.length,
      timingVariance: this.calculateTimingVariance(morphedBeats)
    };
  }

  private calculateLaneDistribution(beats: EnhancedBeatData[]): number[] {
    const distribution = [0, 0, 0, 0];
    beats.forEach(beat => distribution[beat.lane]++);
    const total = beats.length;
    return distribution.map(count => count / total);
  }

  private calculateTimingVariance(beats: EnhancedBeatData[]): number {
    if (beats.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i-1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return Math.sqrt(variance);
  }
}