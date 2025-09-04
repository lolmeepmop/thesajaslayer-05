// Web Worker for audio analysis to prevent UI blocking
import { BeatData, AudioAnalysisResult } from './audioAnalysis';

self.onmessage = function(e) {
  const { audioData, sampleRate, duration } = e.data;
  
  try {
    const result = analyzeAudioInWorker(audioData, sampleRate, duration);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

function analyzeAudioInWorker(channelData: Float32Array, sampleRate: number, duration: number): AudioAnalysisResult {
  console.log('Worker: Starting audio analysis...', { sampleRate, duration, samples: channelData.length });

  // Simplified BPM detection
  const bpm = calculateSimpleBPM(channelData, sampleRate);
  console.log('Worker: BPM calculated:', bpm);
  
  // Generate beats based on BPM instead of complex detection
  const beats = generateBeatsFromBPM(bpm, duration);
  console.log('Worker: Beats generated:', beats.length);
  
  // Simplified energy calculation
  const energy = calculateSimpleEnergy(channelData, sampleRate);
  const spectralCentroid = Array.from({ length: Math.floor(duration * 10) }, (_, i) => 1000 + Math.sin(i * 0.1) * 500);

  console.log('Worker: Audio analysis complete');

  return {
    bpm,
    beats,
    duration,
    energy,
    spectralCentroid
  };
}

function calculateSimpleBPM(channelData: Float32Array, sampleRate: number): number {
  // Simplified BPM detection - analyze only a small portion
  const analyzeLength = Math.min(channelData.length, sampleRate * 30); // Max 30 seconds
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
  const energyWindows: number[] = [];

  // Calculate energy in windows
  for (let i = 0; i < analyzeLength - windowSize; i += windowSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += Math.abs(channelData[i + j]);
    }
    energyWindows.push(energy);
  }

  // Find peaks
  const peaks = findPeaks(energyWindows);
  
  if (peaks.length < 2) return 120; // Default BPM

  // Calculate intervals between peaks
  const intervals = [];
  for (let i = 1; i < Math.min(peaks.length, 20); i++) { // Limit to first 20 peaks
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  // Find most common interval
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const secondsPerBeat = (avgInterval * windowSize) / sampleRate;
  const bpm = 60 / secondsPerBeat;

  return Math.round(Math.max(60, Math.min(200, bpm)));
}

function findPeaks(data: number[]): number[] {
  const peaks: number[] = [];
  const threshold = Math.max(...data) * 0.3; // 30% of max

  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
      peaks.push(i);
    }
  }

  return peaks;
}

function generateBeatsFromBPM(bpm: number, duration: number): BeatData[] {
  const beats: BeatData[] = [];
  const beatInterval = 60 / bpm; // Seconds per beat
  const types: BeatData['type'][] = ['kick', 'snare', 'hi-hat', 'bass'];

  for (let time = 0; time < duration; time += beatInterval) {
    // Add some variation
    if (Math.random() > 0.2) { // 80% chance of beat
      beats.push({
        time,
        intensity: 0.5 + Math.random() * 0.5,
        frequency: 100 + Math.random() * 1000,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
  }

  return beats;
}

function calculateSimpleEnergy(channelData: Float32Array, sampleRate: number): number[] {
  const windowSize = Math.floor(sampleRate * 0.5); // 500ms windows for faster processing
  const energy: number[] = [];
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < end; j++) {
      sum += channelData[j] ** 2;
    }
    energy.push(sum / (end - i));
  }
  
  return energy;
}