import { BeatData, AudioAnalysisResult } from './audioAnalysis';
import { DifficultySettings } from '../types/difficulty';

export interface EnhancedBeatData extends BeatData {
  lane: number; // 0-3 for four lanes
  pattern: PatternType;
  section: SongSection;
  isAccent?: boolean;
  isHold?: boolean;
  holdDuration?: number;
  templateName?: string;
  barIndex?: number;
}

export type PatternType = 'euclidean' | 'zigzag' | 'syncopated' | 'triplet' | 'sparse' | 'dense' | 'template';
export type SongSection = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';

// Pattern Templates for musical coherence
export interface PatternTemplate {
  name: string;
  steps: number[]; // Lane sequence (0-3)
  duration: number; // Duration in beats
  holdSteps?: number[]; // Which steps should be hold notes
  complexity: number; // 1-5 complexity rating
}

export const PATTERN_TEMPLATES: PatternTemplate[] = [
  // INTRO PATTERNS - Simple, welcoming
  { name: 'IntroGentle', steps: [1, 2], duration: 4, complexity: 1 },
  { name: 'WarmUp', steps: [0, 3, 1], duration: 3, complexity: 1 },
  
  // VERSE PATTERNS - Steady, rhythmic foundation
  { name: 'LeftRightLeft', steps: [0, 3, 0, 3, 3, 0], duration: 3, complexity: 2 },
  { name: 'SteadyBeat', steps: [1, 2, 1, 2], duration: 2, complexity: 2 },
  { name: 'UpDownFlow', steps: [1, 2, 1, 2, 1], duration: 2.5, complexity: 2 },
  { name: 'CrossPattern', steps: [0, 2, 3, 1], duration: 2, complexity: 2 },
  
  // CHORUS PATTERNS - High energy, engaging
  { name: 'ChorusBlast', steps: [0, 3, 1, 2, 0, 3, 1, 2], duration: 2, complexity: 4 },
  { name: 'PowerFlow', steps: [0, 1, 3, 2, 3, 1, 0, 2], duration: 2, complexity: 4 },
  { name: 'EnergyWave', steps: [0, 1, 2, 3, 3, 2, 1, 0], duration: 2, complexity: 4 },
  { name: 'IntenseRush', steps: [0, 2, 1, 3, 0, 2, 1, 3], duration: 1.5, complexity: 5 },
  
  // BRIDGE PATTERNS - Unique, transitional
  { name: 'BridgeFlow', steps: [1, 0, 2, 3, 2, 0], duration: 3, complexity: 3 },
  { name: 'Transition', steps: [0, 1, 3, 2, 1], duration: 2.5, complexity: 3 },
  { name: 'Syncopated', steps: [0, 1, 3, 2, 1], duration: 2.5, complexity: 3 },
  
  // HOLD PATTERNS - Sustained, melodic with diverse lane usage
  { name: 'SustainedMelody', steps: [0, 1, 2, 3], duration: 4, holdSteps: [1], complexity: 2 },
  { name: 'MelodyHold', steps: [0, 1, 2], duration: 3, holdSteps: [2], complexity: 2 },
  { name: 'PowerHold', steps: [0, 1, 2, 3], duration: 4, holdSteps: [3], complexity: 3 },
  { name: 'FlowingHold', steps: [1, 3, 0, 2], duration: 3, holdSteps: [1, 3], complexity: 3 },
  { name: 'LeftMelody', steps: [0, 2, 3, 1], duration: 4, holdSteps: [0], complexity: 2 },
  { name: 'RightMelody', steps: [3, 1, 0, 2], duration: 4, holdSteps: [3], complexity: 2 },
  { name: 'AlternatingHolds', steps: [0, 3, 1, 2], duration: 3, holdSteps: [0, 2], complexity: 2 },
  { name: 'CrossHold', steps: [0, 2, 1, 3], duration: 3, holdSteps: [1, 3], complexity: 3 },
  { name: 'ZigzagHold', steps: [0, 3, 0, 3, 1, 2], duration: 3, holdSteps: [0, 3], complexity: 3 },
  { name: 'LeftRightCombo', steps: [0, 0, 3, 3, 1, 2], duration: 2.5, holdSteps: [1, 4], complexity: 4 },
  { name: 'UpDownFlow', steps: [1, 2, 1, 2, 0, 3], duration: 3, holdSteps: [0, 3], complexity: 3 },
  { name: 'DiagonalSweep', steps: [0, 1, 2, 3, 2, 1], duration: 3, holdSteps: [2, 5], complexity: 4 },
  { name: 'RepeatingLeft', steps: [0, 0, 0, 1, 2, 0], duration: 2, holdSteps: [0, 2], complexity: 3 },
  { name: 'RepeatingRight', steps: [3, 3, 3, 2, 1, 3], duration: 2, holdSteps: [0, 2], complexity: 3 },
  { name: 'MixedPattern', steps: [0, 3, 1, 2, 0, 3], duration: 2.5, holdSteps: [1, 4], complexity: 4 },
  
  // TRIPLET PATTERNS - Complex rhythmic
  { name: 'TripletFlow', steps: [0, 2, 1, 0, 2, 1], duration: 2, complexity: 3 },
  { name: 'TripletWave', steps: [1, 3, 0, 2, 1, 3], duration: 2, complexity: 3 },
  
  // OUTRO PATTERNS - Conclusive, calming
  { name: 'OutroFade', steps: [1, 0, 2], duration: 4, complexity: 1 },
  { name: 'Finale', steps: [0, 1, 2, 3], duration: 6, holdSteps: [3], complexity: 2 },
];

export interface SongStructure {
  sections: Array<{
    start: number;
    end: number;
    type: SongSection;
    energy: number;
  }>;
}

import { PatternMemory } from './patternMemory';
import { AdaptivePatternMorpher } from './adaptivePatternMorphing';
import { BeatmapAnalyzer } from './beatmapAnalytics';

export class BeatmapGenerator {
  private bpm: number = 120;
  private beatsPerBar: number = 4;
  private audioAnalysis: AudioAnalysisResult;
  private currentTemplate: PatternTemplate | null = null;
  private templateRotationIndex: number = 0;
  private lastSectionType: SongSection | null = null;
  private speedMultiplier: number = 1.0; // Speed adjustment based on song pace
  private difficultySettings: DifficultySettings;
  
  // Enhanced systems
  private patternMemory: PatternMemory;
  private patternMorpher: AdaptivePatternMorpher;
  private analyzer: BeatmapAnalyzer;
  private noveltyBudget: Map<SongSection, number> = new Map();
  private sectionTemplateHistory: Map<SongSection, PatternTemplate[]> = new Map();

  constructor(audioAnalysis: AudioAnalysisResult, difficultySettings: DifficultySettings) {
    this.audioAnalysis = audioAnalysis;
    this.difficultySettings = difficultySettings;
    this.bpm = audioAnalysis.bpm;
    
    // Initialize enhanced systems
    this.patternMemory = new PatternMemory({
      minRepetitionDistance: 16,
      diversityThreshold: 0.75
    });
    this.patternMorpher = new AdaptivePatternMorpher({
      rhythmicVariance: 15,
      spatialRotation: true,
      densityBursts: difficultySettings.complexPatterns,
      holdVariations: true,
      laneChoreography: true
    });
    this.analyzer = new BeatmapAnalyzer();

    // Initialize novelty budgets per section
    this.noveltyBudget.set('intro', 0.3);
    this.noveltyBudget.set('verse', 0.5);
    this.noveltyBudget.set('chorus', 0.8);
    this.noveltyBudget.set('bridge', 0.9);
    this.noveltyBudget.set('outro', 0.4);
    
    // Calculate speed multiplier based on song pace and difficulty
    this.speedMultiplier = this.calculateSpeedMultiplier();
  }

  /**
   * Calculate speed multiplier based on song pace, energy, and difficulty
   */
  private calculateSpeedMultiplier(): number {
    const avgEnergy = this.audioAnalysis.energy.reduce((sum, e) => sum + e, 0) / this.audioAnalysis.energy.length;
    
    // Base speed multiplier from difficulty settings
    let multiplier = this.difficultySettings.speedMultiplier;
    
    // BPM-based adjustment
    if (this.bpm > 140) {
      multiplier += 0.15; // Fast songs get slightly faster notes
    } else if (this.bpm > 120) {
      multiplier += 0.1;  // Medium tempo gets moderate speed up
    } else if (this.bpm < 80) {
      multiplier += 0.05; // Slow songs get subtle speed increase to maintain engagement
    }
    
    // Energy-based adjustment
    if (avgEnergy > 0.8) {
      multiplier += 0.1; // High energy songs get faster patterns
    } else if (avgEnergy > 0.6) {
      multiplier += 0.05; // Medium energy songs get slight speed up
    }
    
    // Clamp between reasonable bounds
    return Math.max(0.8, Math.min(1.4, multiplier));
  }

  /**
   * Main function to generate enhanced beatmap with musical diversity
   */
  generateBeatmap(): EnhancedBeatData[] {
    console.log('🎵 Starting enhanced beatmap generation...');
    
    // Reset pattern memory for new generation
    this.patternMemory.reset();
    
    // 1. Detect onsets with better accuracy (enhanced for drums, accents, melody)
    const onsets = this.detectMusicalOnsets();
    console.log(`📊 Detected ${onsets.length} musical onsets`);
    
    // 2. Segment song into bars and sections
    const bars = this.segmentIntoBars(onsets);
    const songStructure = this.analyzeSongStructure();
    console.log(`🎼 Song structure:`, songStructure.sections.map(s => `${s.type}(${s.start.toFixed(1)}s-${s.end.toFixed(1)}s, energy:${s.energy.toFixed(2)})`));
    console.log(`📏 Segmented into ${bars.length} bars`);
    
    // 3. Generate patterns for each bar with enhanced diversity
    let beatmap: EnhancedBeatData[] = [];
    
    bars.forEach((bar, barIndex) => {
      const section = this.getSectionForTime(bar.startTime, songStructure);
      const sectionEnergy = this.getSectionEnergy(bar.startTime);
      const harmonicContour = this.calculateHarmonicContour(bar);
      
      // Check if we need to switch pattern template for new section
      if (section !== this.lastSectionType) {
        console.log(`🔄 Section change detected: ${this.lastSectionType} → ${section} at ${bar.startTime.toFixed(2)}s`);
        this.selectNewTemplateForSection(section, bar.energy);
        this.lastSectionType = section;
      }
      
      // Generate base pattern using current template
      let barBeats = this.generateTemplateBasedPattern(bar, section, barIndex);
      
      // Apply adaptive morphing based on novelty budget
      const noveltyRatio = this.noveltyBudget.get(section) || 0.5;
      if (Math.random() < noveltyRatio) {
        barBeats = this.applyAdaptiveMorphing(barBeats, section, sectionEnergy, harmonicContour);
      }
      
      // Check for repetition and apply variations if needed
      if (this.patternMemory.wouldBeRepetitive(barBeats)) {
        console.log(`🔄 Applying anti-repetition variations at bar ${barIndex}`);
        barBeats = this.applyAntiRepetitionVariations(barBeats, section);
      }
      
      // Record pattern for future anti-repetition tracking
      this.patternMemory.recordPattern(barBeats, section, sectionEnergy);
      
      console.log(`📍 Bar ${barIndex} (${bar.startTime.toFixed(1)}s): ${barBeats.length} beats, template: ${this.currentTemplate?.name}, energy: ${bar.energy.toFixed(2)}`);
      beatmap.push(...barBeats);
    });

    // 4. Post-process with enhanced holds and transitions
    beatmap = this.postProcessWithEnhancedHolds(beatmap, songStructure);
    
    // 5. Apply section transition enhancements
    beatmap = this.enhanceSectionTransitions(beatmap, songStructure);
    
    // 6. Final quality analysis and reporting
    const analytics = this.analyzer.analyze(beatmap);
    const qualityScore = this.analyzer.generateQualityScore(analytics);
    
    console.log('🎯 Enhanced Beatmap Analytics:', {
      totalBeats: beatmap.length,
      qualityScore: qualityScore,
      diversityScore: analytics.diversityMetrics.patternEntropy.toFixed(2),
      patternMemory: this.patternMemory.getAnalytics()
    });
    console.log(`✅ Generated enhanced beatmap with ${beatmap.length} total beats, ${beatmap.filter(b => b.isHold).length} hold notes`);
    
    return beatmap.sort((a, b) => a.time - b.time);
  }

  /**
   * Enhanced onset detection specifically for drums, accents, and melody
   */
  private detectMusicalOnsets(): Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }> {
    const onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }> = [];
    
    // Use existing beats but categorize by musical function
    const rawBeats = this.audioAnalysis.beats;
    
    // Enhanced frequency band analysis for musical onset detection
    const frequencyBands = {
      drums: rawBeats.filter(b => b.frequency < 250),    // Kick/Bass drums
      snare: rawBeats.filter(b => b.frequency >= 150 && b.frequency < 500), // Snare/Percussion
      melody: rawBeats.filter(b => b.frequency >= 300 && b.frequency < 3000), // Vocals/Lead
      accents: rawBeats.filter(b => b.frequency >= 2000)  // Hi-hats/Cymbals/Accents
    };

    // Categorize and merge onsets by musical function
    frequencyBands.drums.forEach(beat => {
      onsets.push({ ...beat, type: 'drum' });
    });
    
    frequencyBands.snare.forEach(beat => {
      onsets.push({ ...beat, type: 'drum' });
    });
    
    frequencyBands.melody.forEach(beat => {
      onsets.push({ ...beat, type: 'melody' });
    });
    
    frequencyBands.accents.forEach(beat => {
      onsets.push({ ...beat, type: 'accent' });
    });

    return onsets;
  }

  /**
   * Segment song into musical bars (4 beats each) for pattern application
   */
  private segmentIntoBars(onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>) {
    const barDuration = (60 / this.bpm) * this.beatsPerBar; // Duration of one bar in seconds
    const totalDuration = this.audioAnalysis.duration;
    const bars: Array<{ startTime: number; endTime: number; onsets: typeof onsets; energy: number }> = [];

    for (let time = 0; time < totalDuration; time += barDuration) {
      const barOnsets = onsets.filter(onset => 
        onset.time >= time && onset.time < time + barDuration
      );
      
      const energy = barOnsets.reduce((sum, onset) => sum + onset.intensity, 0) / Math.max(1, barOnsets.length);
      
      bars.push({
        startTime: time,
        endTime: Math.min(time + barDuration, totalDuration),
        onsets: barOnsets,
        energy
      });
    }

    return bars;
  }

  /**
   * Analyze song structure to identify intro, verse, chorus, etc.
   */
  private analyzeSongStructure(): SongStructure {
    const duration = this.audioAnalysis.duration;
    const energy = this.audioAnalysis.energy;
    const bpm = this.audioAnalysis.bpm;
    
    console.log(`🔍 Analyzing song structure for ${duration.toFixed(1)}s song at ${bpm} BPM`);
    
    // More sophisticated section detection based on energy changes and musical timing
    const sections: SongStructure['sections'] = [];
    const energyWindowSize = Math.max(10, Math.floor(energy.length / 20)); // Adaptive window size
    const energyThreshold = 0.15; // Minimum energy change to detect section boundary
    
    let currentSectionStart = 0;
    let currentSectionType: SongSection = 'intro';
    let lastSectionEnergy = energy.slice(0, energyWindowSize).reduce((sum, e) => sum + e, 0) / energyWindowSize;
    
    // Detect sections based on significant energy changes
    for (let i = energyWindowSize; i < energy.length - energyWindowSize; i += energyWindowSize) {
      const currentEnergy = energy.slice(i, i + energyWindowSize).reduce((sum, e) => sum + e, 0) / energyWindowSize;
      const energyChange = Math.abs(currentEnergy - lastSectionEnergy);
      const timePosition = (i / energy.length) * duration;
      
      // Detect section boundary if energy change is significant
      if (energyChange > energyThreshold) {
        // Save previous section
        sections.push({
          start: currentSectionStart,
          end: timePosition,
          type: currentSectionType,
          energy: lastSectionEnergy
        });
        
        // Determine new section type based on energy level and position
        currentSectionType = this.determineSectionType(currentEnergy, timePosition, duration, sections.length);
        currentSectionStart = timePosition;
        lastSectionEnergy = currentEnergy;
        
        console.log(`🎶 Section boundary detected at ${timePosition.toFixed(1)}s: ${currentSectionType} (energy: ${currentEnergy.toFixed(2)})`);
      }
    }
    
    // Add final section
    sections.push({
      start: currentSectionStart,
      end: duration,
      type: duration - currentSectionStart < 20 ? 'outro' : currentSectionType,
      energy: lastSectionEnergy
    });

    return { sections };
  }

  /**
   * Determine section type based on energy and song position
   */
  private determineSectionType(energy: number, timePosition: number, totalDuration: number, sectionIndex: number): SongSection {
    const progressRatio = timePosition / totalDuration;
    
    // Intro detection (first 15% of song)
    if (progressRatio < 0.15) {
      return 'intro';
    }
    
    // Outro detection (last 15% of song)
    if (progressRatio > 0.85) {
      return 'outro';
    }
    
    // High energy sections are likely choruses
    if (energy > 0.75) {
      return 'chorus';
    }
    
    // Low energy sections might be bridges
    if (energy < 0.35) {
      return 'bridge';
    }
    
    // Medium energy sections are typically verses
    return 'verse';
  }

  /**
   * Select new pattern template when transitioning to different song section
   */
  private selectNewTemplateForSection(section: SongSection, energy: number): void {
    // Filter templates by section type and energy
    const sectionTemplates = PATTERN_TEMPLATES.filter(t => {
      const namePrefix = t.name.toLowerCase();
      
      switch (section) {
        case 'intro':
          return namePrefix.includes('intro') || namePrefix.includes('warmup') || t.complexity <= 2;
        case 'outro':
          return namePrefix.includes('outro') || namePrefix.includes('finale') || namePrefix.includes('fade') || t.complexity <= 2;
        case 'chorus':
          return namePrefix.includes('chorus') || namePrefix.includes('power') || namePrefix.includes('energy') || namePrefix.includes('intense') || t.complexity >= 3;
        case 'bridge':
          return namePrefix.includes('bridge') || namePrefix.includes('transition') || namePrefix.includes('syncopated') || (t.complexity >= 2 && t.complexity <= 4);
        case 'verse':
        default:
          return namePrefix.includes('steady') || namePrefix.includes('flow') || namePrefix.includes('cross') || namePrefix.includes('leftright') || (t.complexity >= 2 && t.complexity <= 3);
      }
    });

    // If energy is high, prefer patterns with holds for sustained impact
    const energyFilteredTemplates = energy > 0.6 
      ? sectionTemplates.filter(t => t.holdSteps && t.holdSteps.length > 0).length > 0
        ? sectionTemplates.filter(t => t.holdSteps && t.holdSteps.length > 0)
        : sectionTemplates
      : sectionTemplates;

    // Select template with rotation to avoid immediate repetition
    const availableTemplates = energyFilteredTemplates.length > 0 ? energyFilteredTemplates : PATTERN_TEMPLATES.filter(t => t.complexity <= 3);
    this.currentTemplate = availableTemplates[this.templateRotationIndex % availableTemplates.length];
    this.templateRotationIndex++;

    console.log(`🎨 Selected pattern "${this.currentTemplate.name}" for ${section} section (energy: ${energy.toFixed(2)}, available templates: ${availableTemplates.map(t => t.name).join(', ')})`);
  }

  /**
   * Generate template-based pattern for musical coherence
   */
  private generateTemplateBasedPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>; energy: number },
    section: SongSection,
    barIndex: number
  ): EnhancedBeatData[] {
    if (!this.currentTemplate) {
      this.selectNewTemplateForSection(section, bar.energy);
    }

    const template = this.currentTemplate!;
    const beats: EnhancedBeatData[] = [];
    const barDuration = bar.endTime - bar.startTime;
    
    // **MUSICAL ALIGNMENT**: Sync pattern timing to actual audio onsets
    const drumonsets = bar.onsets.filter(o => o.type === 'drum');
    const accentOnsets = bar.onsets.filter(o => o.type === 'accent');
    const melodyOnsets = bar.onsets.filter(o => o.type === 'melody');

    // Calculate pattern timing based on template duration and actual beat spacing
    const beatDuration = (60 / this.bpm) / this.speedMultiplier; // Apply speed multiplier
    const patternBeats = template.duration;
    const stepsPerPattern = template.steps.length;
    
    // How many times should we repeat the pattern in this bar?
    const repeatCount = Math.max(1, Math.floor(this.beatsPerBar / patternBeats));
    
    console.log(`Using speed multiplier: ${this.speedMultiplier.toFixed(2)} (BPM: ${this.bpm})`);
    
    for (let repeat = 0; repeat < repeatCount; repeat++) {
      template.steps.forEach((lane, stepIndex) => {
        // **PRECISE MUSICAL TIMING**: Align to beat grid
        const patternProgress = stepIndex / stepsPerPattern;
        const repeatProgress = repeat / repeatCount;
        const totalProgress = repeatProgress + (patternProgress / repeatCount);
        
        let time = bar.startTime + (totalProgress * barDuration);
        
        // **ONSET SNAPPING**: Snap to nearest actual onset for tighter musical feel
        const nearestOnset = this.findNearestOnset(bar.onsets, time, 0.15); // 150ms tolerance
        if (nearestOnset) {
          time = nearestOnset.time;
        }
        
        if (time < bar.endTime) {
          const isHoldStep = template.holdSteps?.includes(stepIndex) || false;
          const nextStepTime = stepIndex + 1 < stepsPerPattern 
            ? bar.startTime + ((repeatProgress + ((stepIndex + 1) / stepsPerPattern / repeatCount)) * barDuration)
            : bar.endTime;
          
          // **DYNAMIC HOLD DURATION**: Base on musical content, not just template
          let holdDuration: number | undefined;
          if (isHoldStep) {
            // Check for sustained musical elements around this time
            const sustainedOnsets = this.findSustainedOnsets(bar.onsets, time, 0.3);
            if (sustainedOnsets.length > 0) {
              // Use actual sustained duration from audio analysis
              holdDuration = Math.min(
                sustainedOnsets.reduce((max, onset) => Math.max(max, onset.intensity * 2), 0.5),
                barDuration - (time - bar.startTime),
                3.0 // Max 3 seconds
              );
            } else {
              // Fallback to template-based duration with variation
              const baseHoldDuration = (nextStepTime - time) * 1.2;
              const energyMultiplier = 0.8 + (bar.energy * 0.6); // 0.8-1.4x based on energy
              holdDuration = Math.min(baseHoldDuration * energyMultiplier, barDuration - (time - bar.startTime));
            }
          }
          
          // **VARIED HOLD LANES**: Rotate hold lanes for diversity
          let finalLane = lane;
          if (isHoldStep && repeat > 0) {
            // Vary hold lane based on repeat number and section type
            const laneRotation = section === 'chorus' ? [0, 2, 1, 3] : [1, 3, 0, 2];
            finalLane = laneRotation[repeat % laneRotation.length];
          }
          
          // **INTENSITY MATCHING**: Use actual onset intensity for dynamic feel
          const intensity = nearestOnset ? nearestOnset.intensity : this.getIntensityForOnset(bar.onsets, time);
          
          beats.push({
            time,
            intensity,
            frequency: this.getFrequencyForOnset(bar.onsets, time),
            type: this.getBeatTypeForSection(section),
            lane: finalLane,
            pattern: 'template',
            section,
            isAccent: stepIndex === 0 || intensity > 0.8, // First step OR high intensity = accent
            isHold: isHoldStep,
            holdDuration,
            templateName: template.name,
            barIndex
          });
        }
      });
    }

    return beats;
  }

  /**
   * Find the nearest onset within tolerance for precise timing
   */
  private findNearestOnset(onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>, targetTime: number, tolerance: number) {
    let nearest = null;
    let minDistance = tolerance;
    
    for (const onset of onsets) {
      const distance = Math.abs(onset.time - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = onset;
      }
    }
    
    return nearest;
  }

  /**
   * Find sustained musical onsets around a specific time
   */
  private findSustainedOnsets(onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>, targetTime: number, tolerance: number) {
    return onsets.filter(onset => {
      const distance = Math.abs(onset.time - targetTime);
      return distance <= tolerance && onset.type === 'melody' && onset.intensity > 0.6;
    });
  }

  /**
   * Get appropriate frequency for musical context
   */
  private getFrequencyForOnset(onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>, targetTime: number): number {
    const nearestOnset = onsets.reduce((closest, onset) => {
      return Math.abs(onset.time - targetTime) < Math.abs(closest.time - targetTime) ? onset : closest;
    }, onsets[0] || { time: targetTime, intensity: 0.5, frequency: 440, type: 'drum' as const });
    
    return nearestOnset.frequency;
  }

  /**
   * Find nearest onset intensity for better musical alignment
   */
  private getIntensityForOnset(onsets: Array<{ time: number; intensity: number; frequency: number; type: 'drum' | 'accent' | 'melody' }>, targetTime: number): number {
    const nearestOnset = onsets.reduce((closest, onset) => {
      return Math.abs(onset.time - targetTime) < Math.abs(closest.time - targetTime) ? onset : closest;
    }, onsets[0] || { time: targetTime, intensity: 0.5, frequency: 440, type: 'drum' as const });
    
    return nearestOnset.intensity;
  }

  /**
   * Generate specific pattern for a bar
   */
  private generateBarPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    patternType: PatternType,
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const barDuration = bar.endTime - bar.startTime;
    
    switch (patternType) {
      case 'euclidean':
        return this.createEuclideanPattern(bar, section);
      
      case 'zigzag':
        return this.createZigzagPattern(bar, section);
      
      case 'syncopated':
        return this.createSyncopatedPattern(bar, section);
      
      case 'triplet':
        return this.createTripletPattern(bar, section);
      
      case 'sparse':
        return this.createSparsePattern(bar, section);
      
      case 'dense':
        return this.createDensePattern(bar, section);
      
      default:
        return this.createEuclideanPattern(bar, section);
    }
  }

  /**
   * Create Euclidean rhythm pattern - evenly distributed hits
   */
  private createEuclideanPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    
    // Determine number of hits based on energy, section, and difficulty
    let hits: number;
    let steps = 16; // 16th note subdivisions
    
    // Apply difficulty settings to note density
    const maxNotes = Math.min(this.difficultySettings.noteCapacity, 8);
    
    if (section === 'chorus' && bar.energy > 0.7) {
      hits = Math.min(maxNotes, 7); // Dense pattern, capped by difficulty
    } else if (section === 'intro' || section === 'outro') {
      hits = Math.min(maxNotes, 3); // Sparse pattern
    } else {
      hits = Math.min(maxNotes, 5); // Medium density
    }

    // Generate Euclidean rhythm
    const pattern = this.generateEuclideanRhythm(hits, steps);
    const stepDuration = (bar.endTime - bar.startTime) / steps;

    pattern.forEach((isHit, step) => {
      if (isHit) {
        const time = bar.startTime + step * stepDuration;
        const lane = this.selectLaneForEuclidean(step, hits, steps);
        
        beats.push({
          time,
          intensity: 0.8,
          frequency: 440, // Default frequency
          type: this.getBeatTypeForSection(section),
          lane,
          pattern: 'euclidean',
          section
        });
      }
    });

    return beats;
  }

  /**
   * Generate mathematical Euclidean rhythm distribution
   */
  private generateEuclideanRhythm(hits: number, steps: number): boolean[] {
    const pattern = new Array(steps).fill(false);
    
    if (hits >= steps) {
      return pattern.fill(true);
    }

    // Euclidean algorithm for even distribution
    let bucket = 0;
    for (let i = 0; i < steps; i++) {
      bucket += hits;
      if (bucket >= steps) {
        bucket -= steps;
        pattern[i] = true;
      }
    }

    return pattern;
  }

  /**
   * Create zig-zag alternating pattern (L-R-L-R or similar)
   */
  private createZigzagPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const numBeats = Math.min(6, Math.max(2, Math.floor(bar.energy * 8)));
    const beatInterval = (bar.endTime - bar.startTime) / numBeats;

    // Alternating lane pattern: 0 → 3 → 1 → 2 → 0 → 3...
    const lanePattern = [0, 3, 1, 2];

    for (let i = 0; i < numBeats; i++) {
      const time = bar.startTime + i * beatInterval;
      const lane = lanePattern[i % lanePattern.length];

      beats.push({
        time,
        intensity: 0.7,
        frequency: 440,
        type: this.getBeatTypeForSection(section),
        lane,
        pattern: 'zigzag',
        section
      });
    }

    return beats;
  }

  /**
   * Create syncopated off-beat pattern
   */
  private createSyncopatedPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const beatDuration = (60 / this.bpm) / this.speedMultiplier; // Apply speed multiplier
    const barDuration = bar.endTime - bar.startTime;

    // Place beats on off-beats (between main beats)
    const offBeatTimes = [0.25, 0.75, 1.5, 2.25, 3.0]; // Syncopated positions within bar
    
    offBeatTimes.forEach((offset, index) => {
      const time = bar.startTime + (offset * beatDuration);
      if (time < bar.endTime) {
        // Use lanes that create interesting hand movements
        const lane = [1, 2, 0, 3, 1][index % 5];
        
        beats.push({
          time,
          intensity: 0.6,
          frequency: 440,
          type: this.getBeatTypeForSection(section),
          lane,
          pattern: 'syncopated',
          section,
          isAccent: index % 2 === 0 // Every other beat is an accent
        });
      }
    });

    return beats;
  }

  /**
   * Create triplet pattern (3 notes in space of 2)
   */
  private createTripletPattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const beatDuration = (60 / this.bpm) / this.speedMultiplier; // Apply speed multiplier
    const tripletDuration = beatDuration * 2 / 3; // Three notes in space of two beats

    // Create triplet groups within the bar
    for (let i = 0; i < 4; i += 2) { // Every 2 beats, place a triplet
      for (let j = 0; j < 3; j++) {
        const time = bar.startTime + i * beatDuration + j * tripletDuration;
        if (time < bar.endTime) {
          // Triplet lane pattern creates flowing movement
          const lane = (i + j) % 4;
          
          beats.push({
            time,
            intensity: j === 0 ? 0.8 : 0.6, // First note of triplet is accented
            frequency: 440,
            type: this.getBeatTypeForSection(section),
            lane,
            pattern: 'triplet',
            section,
            isAccent: j === 0
          });
        }
      }
    }

    return beats;
  }

  /**
   * Create sparse pattern for calm sections
   */
  private createSparsePattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const beatDuration = (60 / this.bpm) / this.speedMultiplier; // Apply speed multiplier

    // Only place beats on strong beats (1 and 3)
    [0, 2].forEach((beatIndex, arrayIndex) => {
      const time = bar.startTime + beatIndex * beatDuration;
      if (time < bar.endTime) {
        const lane = arrayIndex * 2; // Use lanes 0 and 2 for simple left-right pattern
        
        beats.push({
          time,
          intensity: 0.7,
          frequency: 440,
          type: this.getBeatTypeForSection(section),
          lane,
          pattern: 'sparse',
          section
        });
      }
    });

    return beats;
  }

  /**
   * Create dense pattern for intense sections
   */
  private createDensePattern(
    bar: { startTime: number; endTime: number; onsets: Array<{ time: number; intensity: number; frequency: number }>; energy: number },
    section: SongSection
  ): EnhancedBeatData[] {
    const beats: EnhancedBeatData[] = [];
    const beatDuration = (60 / this.bpm) / this.speedMultiplier; // Apply speed multiplier
    const subdivisions = 8; // 8th note subdivisions

    for (let i = 0; i < subdivisions; i++) {
      const time = bar.startTime + (i * beatDuration / 2);
      if (time < bar.endTime) {
        // Create flowing patterns that use all lanes
        const lane = this.getDenseLanePattern(i);
        
        beats.push({
          time,
          intensity: i % 2 === 0 ? 0.8 : 0.6, // Alternate strong/weak beats
          frequency: 440,
          type: this.getBeatTypeForSection(section),
          lane,
          pattern: 'dense',
          section,
          isAccent: i % 4 === 0 // Every 4th beat is accented
        });
      }
    }

    return beats;
  }

  /**
   * Helper methods
   */
  private selectLaneForEuclidean(step: number, hits: number, steps: number): number {
    // Distribute lanes evenly across the pattern
    return Math.floor((step * 4) / steps) % 4;
  }

  private getDenseLanePattern(index: number): number {
    // Creates flowing patterns: 0,1,2,3,2,1,0,3... etc
    const patterns = [
      [0, 1, 2, 3, 2, 1, 0, 3], // Wave pattern
      [0, 2, 1, 3, 0, 2, 1, 3], // Alternating pairs
      [0, 3, 1, 2, 3, 0, 2, 1]  // Cross pattern
    ];
    const patternIndex = Math.floor(index / 8) % patterns.length;
    return patterns[patternIndex][index % 8];
  }

  private getBeatTypeForSection(section: SongSection): BeatData['type'] {
    switch (section) {
      case 'chorus':
        return 'kick';
      case 'bridge':
        return 'snare';
      default:
        return 'kick';
    }
  }

  private getSectionForTime(time: number, structure: SongStructure): SongSection {
    for (const section of structure.sections) {
      if (time >= section.start && time < section.end) {
        return section.type;
      }
    }
    return 'verse'; // Default
  }

  /**
   * Post-process beatmap with hold notes and musical flow
   */
  private postProcessWithHolds(beatmap: EnhancedBeatData[]): EnhancedBeatData[] {
    // Sort by time
    beatmap.sort((a, b) => a.time - b.time);

    // Ensure minimum spacing between beats (except for holds)
    const minSpacing = 0.1; // 100ms minimum
    const filtered = beatmap.filter((beat, index) => {
      if (index === 0) return true;
      const prevBeat = beatmap[index - 1];
      
      // Allow holds to overlap timing
      if (beat.isHold || prevBeat.isHold) return true;
      
      return beat.time - prevBeat.time >= minSpacing;
    });

    // Add sustained hold notes during melody sections
    this.addSustainedHolds(filtered);

    // Add variety to consecutive same-lane patterns
    for (let i = 1; i < filtered.length - 1; i++) {
      const prev = filtered[i - 1];
      const curr = filtered[i];
      const next = filtered[i + 1];

      // If we have 3+ consecutive beats in same lane, modify the middle ones
      if (prev.lane === curr.lane && curr.lane === next.lane) {
        curr.lane = (curr.lane + 1) % 4; // Shift to adjacent lane
      }
    }

    return filtered;
  }

  /**
   * Add sustained hold notes during melody transitions and sustained sections with improved variety
   */
  private addSustainedHolds(beatmap: EnhancedBeatData[]): void {
    const melodyOnsets = this.audioAnalysis.beats.filter(b => b.frequency >= 300 && b.frequency < 3000);
    
    // Track recent lanes used for hold notes to avoid repetition
    const recentHoldLanes: number[] = [];
    const maxRecentLanes = 3;
    
    // Look for sustained melody sections (gaps > 1 second)
    for (let i = 0; i < melodyOnsets.length - 1; i++) {
      const current = melodyOnsets[i];
      const next = melodyOnsets[i + 1];
      const gap = next.time - current.time;
      
      // If there's a sustained section, add hold notes with more variety
      if (gap > 1.0 && gap < 4.0) {
        // Find multiple beats in this sustained section for more complex holds
        const sustainedBeats = beatmap.filter(b => 
          b.time >= current.time && 
          b.time <= next.time && 
          Math.abs(b.time - current.time) < gap * 0.7
        );
        
        // Apply hold notes based on difficulty settings
        const shouldAddHold = Math.random() < this.difficultySettings.holdNoteFrequency;
        
        if (shouldAddHold && sustainedBeats.length > 0) {
          // For complex patterns (hard difficulty), create sequences of holds
          if (this.difficultySettings.complexPatterns && sustainedBeats.length >= 3) {
            this.createComplexHoldPattern(sustainedBeats, gap, recentHoldLanes);
          } else {
            // Simple sustained hold
            const holdBeat = sustainedBeats[0];
            if (!holdBeat.isHold) {
              // Choose lane that differs from recent holds
              const availableLanes = [0, 1, 2, 3].filter(lane => !recentHoldLanes.includes(lane));
              if (availableLanes.length > 0) {
                holdBeat.lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
              }
              
              holdBeat.isHold = true;
              holdBeat.holdDuration = Math.min(gap * 0.8, 2.0);
              
              // Track this lane
              recentHoldLanes.push(holdBeat.lane);
              if (recentHoldLanes.length > maxRecentLanes) {
                recentHoldLanes.shift();
              }
            }
          }
        }
      }
    }
    
    // Add repeating hold patterns for repetitive beats (for drums/bass)
    this.addRepeatingHoldPatterns(beatmap, recentHoldLanes);
  }
  
  /**
   * Create complex hold patterns for hard difficulty
   */
  private createComplexHoldPattern(beats: EnhancedBeatData[], duration: number, recentLanes: number[]): void {
    const patterns = [
      // Left-Right alternating holds
      { lanes: [0, 3, 0, 3], name: 'LeftRightHolds' },
      // Diagonal sweep holds
      { lanes: [0, 1, 2, 3], name: 'DiagonalSweep' },
      // Cross pattern holds
      { lanes: [0, 2, 1, 3], name: 'CrossPattern' },
      // Up-Down flow holds
      { lanes: [1, 2, 1, 2], name: 'UpDownFlow' },
      // Mixed complex pattern
      { lanes: [0, 3, 1, 2, 0, 3], name: 'MixedComplex' }
    ];
    
    // Choose pattern that doesn't repeat recent lanes too much
    const availablePatterns = patterns.filter(pattern => 
      !pattern.lanes.every(lane => recentLanes.includes(lane))
    );
    
    if (availablePatterns.length === 0) return;
    
    const selectedPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const beatsToModify = beats.slice(0, Math.min(beats.length, selectedPattern.lanes.length));
    
    beatsToModify.forEach((beat, index) => {
      if (index < selectedPattern.lanes.length) {
        beat.lane = selectedPattern.lanes[index];
        beat.isHold = true;
        beat.holdDuration = Math.min(duration * 0.6, 1.5);
        beat.templateName = selectedPattern.name;
        
        // Track lanes used
        if (!recentLanes.includes(beat.lane)) {
          recentLanes.push(beat.lane);
        }
      }
    });
  }
  
  /**
   * Add repeating hold patterns for repetitive sections
   */
  private addRepeatingHoldPatterns(beatmap: EnhancedBeatData[], recentLanes: number[]): void {
    // Find repetitive sections (similar frequency/intensity patterns)
    const repeatingBeatGroups: EnhancedBeatData[][] = [];
    let currentGroup: EnhancedBeatData[] = [];
    
    for (let i = 0; i < beatmap.length - 1; i++) {
      const current = beatmap[i];
      const next = beatmap[i + 1];
      
      // Check if beats have similar characteristics (repetitive)
      const timeDiff = next.time - current.time;
      const isSimilarTiming = timeDiff > 0.4 && timeDiff < 0.8; // Regular beat interval
      
      if (isSimilarTiming) {
        if (currentGroup.length === 0) {
          currentGroup.push(current);
        }
        currentGroup.push(next);
      } else {
        if (currentGroup.length >= 4) { // At least 4 beats to be considered repetitive
          repeatingBeatGroups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    }
    
    // Add final group if it's long enough
    if (currentGroup.length >= 4) {
      repeatingBeatGroups.push(currentGroup);
    }
    
    // Apply distinct repeating patterns to these groups
    const repeatingPatterns = [
      { lanes: [0, 0, 0, 1], name: 'RepeatingLeft' },
      { lanes: [3, 3, 3, 2], name: 'RepeatingRight' },
      { lanes: [1, 1, 2, 2], name: 'RepeatingUpDown' },
      { lanes: [0, 3, 0, 3], name: 'RepeatingLeftRight' },
      { lanes: [1, 2, 1, 2, 0, 3], name: 'RepeatingMixed' }
    ];
    
    repeatingBeatGroups.forEach((group, groupIndex) => {
      const shouldAddPattern = Math.random() < this.difficultySettings.holdNoteFrequency * 0.8;
      
      if (shouldAddPattern) {
        const pattern = repeatingPatterns[groupIndex % repeatingPatterns.length];
        
        group.forEach((beat, beatIndex) => {
          const patternIndex = beatIndex % pattern.lanes.length;
          
          if (patternIndex < pattern.lanes.length) {
            beat.lane = pattern.lanes[patternIndex];
            
            // Make some beats in the pattern hold notes
            if (patternIndex === 0 || (this.difficultySettings.complexPatterns && patternIndex % 2 === 0)) {
              beat.isHold = true;
              beat.holdDuration = Math.min(1.2, (group[Math.min(beatIndex + 1, group.length - 1)].time - beat.time) * 0.8);
              beat.templateName = pattern.name;
            }
          }
        });
      }
    });
  }

  // Enhanced methods for the new system
  private getSectionEnergy(time: number): number {
    if (!this.audioAnalysis.energy || this.audioAnalysis.energy.length === 0) return 0.5;
    const energyIndex = Math.floor((time / this.audioAnalysis.duration) * this.audioAnalysis.energy.length);
    const safeIndex = Math.max(0, Math.min(energyIndex, this.audioAnalysis.energy.length - 1));
    return this.audioAnalysis.energy[safeIndex] || 0.5;
  }

  private calculateHarmonicContour(bar: any): number[] {
    const contour: number[] = [];
    if (bar.onsets && bar.onsets.length > 0) {
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

  private applyAdaptiveMorphing(beats: EnhancedBeatData[], section: SongSection, sectionEnergy: number, harmonicContour: number[]): EnhancedBeatData[] {
    return this.patternMorpher.applyRhythmicVariance(beats);
  }

  private applyAntiRepetitionVariations(beats: EnhancedBeatData[], section: SongSection): EnhancedBeatData[] {
    return beats.map(beat => ({ ...beat, lane: (beat.lane + 1) % 4 }));
  }

  private postProcessWithEnhancedHolds(beatmap: EnhancedBeatData[], songStructure: SongStructure): EnhancedBeatData[] {
    return this.postProcessWithHolds(beatmap);
  }

  private enhanceSectionTransitions(beatmap: EnhancedBeatData[], songStructure: SongStructure): EnhancedBeatData[] {
    return beatmap;
  }
}