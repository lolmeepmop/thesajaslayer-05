import { EnhancedBeatData } from './beatmapGenerator';
import { DifficultyLevel } from '../types/difficulty';

/**
 * Stage 7 specific beatmap modifications for "BANG!" track
 * Adds variety and choreography without affecting other stages
 */
export function modifyBeatmapForStage7(
  originalBeatmap: EnhancedBeatData[],
  difficulty: DifficultyLevel
): EnhancedBeatData[] {
  if (!originalBeatmap.length) return originalBeatmap;

  const modifiedBeatmap = [...originalBeatmap];
  const difficultyMultiplier = difficulty === 'easy' ? 0.6 : difficulty === 'hard' ? 1.4 : 1.0;
  
  // Stage 7 specific parameters
  const MIN_SPACING = 0.12; // Minimum time between notes
  const MAX_ADDITIVE_NOTES = Math.floor(originalBeatmap.length * 0.15 * difficultyMultiplier);
  
  let addedNotes = 0;

  // 1. Chorus burst fills - Add quick echo hits on alternating lanes during chorus accents
  const chorusBeats = modifiedBeatmap.filter(beat => 
    beat.section === 'chorus' && (beat.type === 'bass' || beat.type === 'melody')
  );
  
  chorusBeats.forEach((chorusBeat, index) => {
    if (addedNotes >= MAX_ADDITIVE_NOTES) return;
    
    // Add echo hit 0.15 seconds after the main chorus accent
    const echoTime = chorusBeat.time + 0.15;
    const alternatingLane = (chorusBeat.lane + 2) % 4; // Opposite lane for variety
    
    // Check spacing
    const hasConflict = modifiedBeatmap.some(beat => 
      Math.abs(beat.time - echoTime) < MIN_SPACING
    );
    
    if (!hasConflict && index % 2 === 0) { // Every other chorus accent
      const echoBeat: EnhancedBeatData = {
        time: echoTime,
        type: chorusBeat.type,
        frequency: chorusBeat.frequency,
        intensity: chorusBeat.intensity,
        lane: alternatingLane,
        pattern: 'dense',
        section: 'chorus',
        isHold: false,
        holdDuration: 0,
        templateName: 'chorus-echo'
      };
      
      modifiedBeatmap.push(echoBeat);
      addedNotes++;
    }
  });

  // 2. Chorus signature holds - Convert every 4th chorus accent into a short hold
  chorusBeats.forEach((chorusBeat, index) => {
    if (index % 4 === 3) { // Every 4th chorus accent
      const beatIndex = modifiedBeatmap.findIndex(b => 
        b.time === chorusBeat.time && b.lane === chorusBeat.lane
      );
      
      if (beatIndex !== -1) {
        modifiedBeatmap[beatIndex] = {
          ...modifiedBeatmap[beatIndex],
          isHold: true,
          holdDuration: 0.3, // Short signature hold
          type: 'hold'
        };
      }
    }
  });

  // 3. Zigzag sweep opener - Add a 4-lane zigzag hold sweep at the start of first chorus
  const firstChorusBeat = modifiedBeatmap.find(beat => beat.section === 'chorus');
  if (firstChorusBeat && addedNotes < MAX_ADDITIVE_NOTES - 4) {
    const sweepStartTime = firstChorusBeat.time - 0.8;
    
    // Check if we have space for the sweep
    const hasSweepConflict = modifiedBeatmap.some(beat => 
      beat.time >= sweepStartTime && beat.time <= sweepStartTime + 0.6
    );
    
    if (!hasSweepConflict && sweepStartTime > 0) {
      // Create zigzag pattern: lanes 0→3→1→2
      const zigzagLanes = [0, 3, 1, 2];
      
      zigzagLanes.forEach((lane, i) => {
        const sweepBeat: EnhancedBeatData = {
          time: sweepStartTime + (i * 0.15),
          type: 'hold',
          frequency: firstChorusBeat.frequency || 200,
          intensity: firstChorusBeat.intensity || 0.5,
          lane,
          pattern: 'zigzag',
          section: 'chorus',
          isHold: true,
          holdDuration: 0.4,
          templateName: 'zigzag-sweep'
        };
        
        modifiedBeatmap.push(sweepBeat);
        addedNotes++;
      });
    }
  }

  // 4. Lane choreography polish - Rotate lanes in wave pattern for consecutive same-lane runs
  const sortedBeats = modifiedBeatmap.sort((a, b) => a.time - b.time);
  
  for (let i = 1; i < sortedBeats.length - 1; i++) {
    const current = sortedBeats[i];
    const prev = sortedBeats[i - 1];
    const next = sortedBeats[i + 1];
    
    // Detect 3+ consecutive beats in same lane
    if (current.lane === prev.lane && current.lane === next.lane) {
      const timeDiff1 = current.time - prev.time;
      const timeDiff2 = next.time - current.time;
      
      // If beats are closely spaced (within 0.5s), apply wave rotation
      if (timeDiff1 < 0.5 && timeDiff2 < 0.5) {
        // Create wave pattern: if in lane 0, rotate to 1, if in lane 3, rotate to 2
        if (current.lane === 0) {
          current.lane = 1;
        } else if (current.lane === 3) {
          current.lane = 2;
        } else if (current.lane === 1) {
          current.lane = 2;
        } else if (current.lane === 2) {
          current.lane = 3;
        }
      }
    }
  }

  // 5. Safety enforcement - Ensure minimum spacing and remove conflicts
  const finalBeatmap = sortedBeats.filter((beat, index, array) => {
    if (index === 0) return true;
    
    const prevBeat = array[index - 1];
    const timeDiff = beat.time - prevBeat.time;
    
    // If too close in time, keep the original beat over added ones
    if (timeDiff < MIN_SPACING) {
      return beat.templateName !== 'chorus-echo' && 
             beat.templateName !== 'zigzag-sweep';
    }
    
    return true;
  });

  console.log(`🎵 Stage 7 beatmap enhanced: ${originalBeatmap.length} → ${finalBeatmap.length} beats (+${finalBeatmap.length - originalBeatmap.length})`);
  
  return finalBeatmap;
}
