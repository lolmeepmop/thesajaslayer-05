export interface CalibrationData {
  audioOffset: number; // milliseconds
  visualOffset: number; // milliseconds
  inputLatency: number; // milliseconds
  deviceType: 'desktop' | 'mobile' | 'tv' | 'unknown';
  audioOutput: 'speakers' | 'headphones' | 'bluetooth' | 'unknown';
  timestamp: number;
}

export interface CalibrationTest {
  id: string;
  timestamp: number;
  expectedTime: number;
  actualTime: number;
  accuracy: number;
}

export interface CalibrationPreset {
  name: string;
  description: string;
  audioOffset: number;
  visualOffset: number;
  deviceType: CalibrationData['deviceType'];
  audioOutput: CalibrationData['audioOutput'];
}

export const CALIBRATION_PRESETS: CalibrationPreset[] = [
  {
    name: 'Desktop - Speakers',
    description: 'Standard desktop setup with speakers',
    audioOffset: 0,
    visualOffset: 0,
    deviceType: 'desktop',
    audioOutput: 'speakers'
  },
  {
    name: 'Desktop - Headphones',
    description: 'Desktop with wired headphones',
    audioOffset: -10,
    visualOffset: 0,
    deviceType: 'desktop',
    audioOutput: 'headphones'
  },
  {
    name: 'Desktop - Bluetooth',
    description: 'Desktop with Bluetooth headphones',
    audioOffset: -150,
    visualOffset: 0,
    deviceType: 'desktop',
    audioOutput: 'bluetooth'
  },
  {
    name: 'Mobile - Speakers',
    description: 'Mobile device speakers',
    audioOffset: 50,
    visualOffset: 16,
    deviceType: 'mobile',
    audioOutput: 'speakers'
  },
  {
    name: 'TV/Console',
    description: 'TV or console gaming setup',
    audioOffset: 100,
    visualOffset: 33,
    deviceType: 'tv',
    audioOutput: 'speakers'
  }
];

export const DEFAULT_CALIBRATION: CalibrationData = {
  audioOffset: 0,
  visualOffset: 0,
  inputLatency: 0,
  deviceType: 'desktop',
  audioOutput: 'speakers',
  timestamp: Date.now(),
};