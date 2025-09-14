import { EnhancedBeatData, PatternTemplate, SongSection, SongStructure } from './beatmapGenerator';
import { AdaptivePatternMorpher } from './adaptivePatternMorphing';

/**
 * Enhanced methods for beatmap generation that can be mixed into BeatmapGenerator
 */
export class EnhancedBeatmapMethods {
  
  /**
   * Apply adaptive morphing to a bar of beats
   */
  static applyAdaptiveMorphing(
    beats: EnhancedBeatData[],
    section: SongSection,
    sectionEnergy: number,
    harmonicContour: number[],
    patternMorpher: AdaptivePatternMorpher
  ): EnhancedBeatData[] {
    let morphedBeats = [...beats];

    // Apply rhythmic variance for humanization
    if (Math.random() < 0.6) {
      morphedBeats = patternMorpher.applyRhythmicVariance(morphedBeats);
    }

    // Apply spatial variations based on section energy
    if (sectionEnergy > 0.7 && Math.random() < 0.4) {
      const variations = ['mirror', 'rotate', 'invert'] as const;
      const variation = variations[Math.floor(Math.random() * variations.length)];
      morphedBeats = patternMorpher.applySpatialRotation(morphedBeats, variation);
    }

    // Apply density bursts for high-energy sections
    if (section === 'chorus' && sectionEnergy > 0.6 && Math.random() < 0.3) {
      morphedBeats = patternMorpher.addDensityBurst(morphedBeats, 0.2);
    }

    // Apply hold variations
    if (Math.random() < 0.5) {
      morphedBeats = patternMorpher.applyHoldVariations(morphedBeats);
    }

    // Apply lane choreography based on harmonic contour
    if (harmonicContour.length > 0) {
      morphedBeats = patternMorpher.applyLaneChoreography(morphedBeats, sectionEnergy, harmonicContour);
    }

    return morphedBeats;
  }

  /**
   * Apply anti-repetition variations to avoid pattern staleness
   */
  static applyAntiRepetitionVariations(
    beats: EnhancedBeatData[],
    section: SongSection
  ): EnhancedBeatData[] {
    const variations = [...beats];

    // Apply different variation strategies based on section
    const variationStrategies = {
      intro: ['rhythmic', 'spatial'],
      verse: ['spatial', 'density'],
      chorus: ['spatial', 'density', 'execution'],
      bridge: ['rhythmic', 'spatial', 'execution'],
      outro: ['rhythmic']
    };

    const availableStrategies = variationStrategies[section] || ['spatial'];
    const selectedStrategy = availableStrategies[Math.floor(Math.random() * availableStrategies.length)];

    switch (selectedStrategy) {
      case 'rhythmic':
        // Offset timing slightly
        variations.forEach(beat => {
          beat.time += (Math.random() - 0.5) * 0.05; // ±25ms
        });
        break;

      case 'spatial':
        // Mirror or rotate lanes
        variations.forEach(beat => {
          if (Math.random() < 0.5) {
            beat.lane = 3 - beat.lane; // Mirror
          } else {
            beat.lane = (beat.lane + 1) % 4; // Rotate
          }
        });
        break;

      case 'density':
        // Add or remove beats
        if (Math.random() < 0.5 && variations.length > 2) {
          // Remove a beat
          variations.splice(Math.floor(Math.random() * variations.length), 1);
        } else if (variations.length > 0) {
          // Add a beat
          const baseIndex = Math.floor(Math.random() * variations.length);
          const baseBeat = variations[baseIndex];
          const newBeat: EnhancedBeatData = {
            ...baseBeat,
            time: baseBeat.time + 0.1,
            lane: (baseBeat.lane + 2) % 4,
            intensity: baseBeat.intensity * 0.7
          };
          variations.push(newBeat);
        }
        break;

      case 'execution':
        // Switch hold/tap patterns
        variations.forEach(beat => {
          if (Math.random() < 0.3) {
            beat.isHold = !beat.isHold;
            beat.holdDuration = beat.isHold ? 0.3 : 0;
          }
        });
        break;
    }

    return variations.sort((a, b) => a.time - b.time);
  }

  /**
   * Calculate harmonic contour for lane assignment
   */
  static calculateHarmonicContour(bar: any): number[] {
    const contour: number[] = [];
    
    if (bar.onsets && bar.onsets.length > 0) {
      // Normalize frequencies to 0-1 range for lane mapping
      const frequencies = bar.onsets.map((onset: any) => onset.frequency || 200);
      const minFreq = Math.min(...frequencies);
      const maxFreq = Math.max(...frequencies);
      const freqRange = maxFreq - minFreq;

      frequencies.forEach(freq => {
        const normalized = freqRange > 0 ? (freq - minFreq) / freqRange : 0.5;
        contour.push(normalized);
      });
    }

    return contour;
  }

  /**
   * Enhanced post-processing with better hold notes and musical flow
   */
  static postProcessWithEnhancedHolds(
    beatmap: EnhancedBeatData[],
    songStructure: SongStructure
  ): EnhancedBeatData[] {
    const processedBeatmap = [...beatmap];

    // Apply section-aware hold enhancements
    songStructure.sections.forEach(section => {
      const sectionBeats = processedBeatmap.filter(
        beat => beat.time >= section.start && beat.time <= section.end
      );

      if (sectionBeats.length === 0) return;

      // Adjust hold frequencies based on section type
      const targetHoldRatio = {
        intro: 0.2,
        verse: 0.3,
        chorus: 0.4,
        bridge: 0.5,
        outro: 0.3
      }[section.type] || 0.3;

      const currentHoldRatio = sectionBeats.filter(b => b.isHold).length / sectionBeats.length;
      
      if (currentHoldRatio < targetHoldRatio) {
        // Add more holds
        const beatsToConvert = Math.floor((targetHoldRatio - currentHoldRatio) * sectionBeats.length);
        const candidates = sectionBeats
          .filter(b => !b.isHold && b.intensity > 0.5)
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, beatsToConvert);

        candidates.forEach(beat => {
          beat.isHold = true;
          beat.holdDuration = 0.3 + (beat.intensity * 0.4); // 0.3-0.7s holds
          beat.type = 'hold';
        });
      }
    });

    return processedBeatmap;
  }

  /**
   * Enhance section transitions with smoother flow
   */
  static enhanceSectionTransitions(
    beatmap: EnhancedBeatData[],
    songStructure: SongStructure
  ): EnhancedBeatData[] {
    const enhancedBeatmap = [...beatmap];

    for (let i = 0; i < songStructure.sections.length - 1; i++) {
      const currentSection = songStructure.sections[i];
      const nextSection = songStructure.sections[i + 1];
      const transitionTime = nextSection.start;

      // Find beats around the transition
      const preTransitionBeats = enhancedBeatmap.filter(
        beat => beat.time >= transitionTime - 1.0 && beat.time < transitionTime
      );
      const postTransitionBeats = enhancedBeatmap.filter(
        beat => beat.time >= transitionTime && beat.time <= transitionTime + 1.0
      );

      // Add anticipation notes if there's a gap
      if (preTransitionBeats.length > 0 && postTransitionBeats.length > 0) {
        const lastPreBeat = preTransitionBeats[preTransitionBeats.length - 1];
        const firstPostBeat = postTransitionBeats[0];

        if (firstPostBeat.time - lastPreBeat.time > 0.8) {
          // Add anticipation beat
          const anticipationTime = transitionTime - 0.3;
          const anticipationLane = (lastPreBeat.lane + 2) % 4; // Opposite lane

          const anticipationBeat: EnhancedBeatData = {
            time: anticipationTime,
            type: 'bass',
            frequency: 150,
            intensity: 0.4,
            lane: anticipationLane,
            pattern: 'sparse',
            section: currentSection.type,
            isHold: false,
            holdDuration: 0,
            templateName: 'transition-anticipation'
          };

          enhancedBeatmap.push(anticipationBeat);
        }
      }

      // Smooth intensity transitions
      const transitionWindow = 0.5; // 500ms window
      const affectedBeats = enhancedBeatmap.filter(
        beat => Math.abs(beat.time - transitionTime) <= transitionWindow
      );

      affectedBeats.forEach(beat => {
        const distanceFromTransition = Math.abs(beat.time - transitionTime);
        const transitionFactor = 1 - (distanceFromTransition / transitionWindow);
        
        // Blend intensities across the transition
        if (beat.time < transitionTime) {
          beat.intensity = beat.intensity * (1 - transitionFactor * 0.3);
        } else {
          beat.intensity = beat.intensity * (1 + transitionFactor * 0.2);
        }
      });
    }

    return enhancedBeatmap.sort((a, b) => a.time - b.time);
  }

  /**
   * Check if template should change to avoid repetition
   */
  static shouldChangeTemplate(
    currentSection: SongSection,
    barIndex: number,
    lastSectionType: SongSection | null,
    sectionTemplateHistory: Map<SongSection, PatternTemplate[]>
  ): boolean {
    // Always change for new sections
    if (currentSection !== lastSectionType) return true;

    // Change every 4-8 bars within a section to maintain variety
    const templateHistory = sectionTemplateHistory.get(currentSection) || [];
    if (templateHistory.length > 0 && barIndex % (4 + Math.floor(Math.random() * 4)) === 0) {
      return true;
    }

    return false;
  }

  /**
   * Get section energy for adaptive processing
   */
  static getSectionEnergy(time: number, audioAnalysis: any): number {
    if (!audioAnalysis.energy || audioAnalysis.energy.length === 0) return 0.5;

    // Find energy value at the given time
    const energyIndex = Math.floor((time / audioAnalysis.duration) * audioAnalysis.energy.length);
    const safeIndex = Math.max(0, Math.min(energyIndex, audioAnalysis.energy.length - 1));
    
    return audioAnalysis.energy[safeIndex] || 0.5;
  }
}