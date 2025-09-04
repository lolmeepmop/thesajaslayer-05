import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalibrationData, CalibrationTest, CalibrationPreset, CALIBRATION_PRESETS, DEFAULT_CALIBRATION } from '../types/calibration';
import { Volume2, Headphones, Smartphone, Tv, Monitor, Play, RotateCcw, Check } from 'lucide-react';

interface CalibrationToolProps {
  visible: boolean;
  onComplete: (calibration: CalibrationData) => void;
  onClose: () => void;
}

export const CalibrationTool: React.FC<CalibrationToolProps> = ({
  visible,
  onComplete,
  onClose
}) => {
  const [calibration, setCalibration] = useState<CalibrationData>(DEFAULT_CALIBRATION);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentTest, setCurrentTest] = useState<CalibrationTest | null>(null);
  const [testResults, setTestResults] = useState<CalibrationTest[]>([]);
  const [step, setStep] = useState<'setup' | 'test' | 'results'>('setup');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const testStartTimeRef = useRef<number>(0);
  const expectedClickTimeRef = useRef<number>(0);

  useEffect(() => {
    if (visible) {
      // Detect device type automatically
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceType: CalibrationData['deviceType'] = 'desktop';
      
      if (/mobile|android|iphone|ipad/.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/smart.*tv|tv/.test(userAgent)) {
        deviceType = 'tv';
      }
      
      setCalibration(prev => ({ ...prev, deviceType }));
    }
  }, [visible]);

  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const playTestBeep = useCallback(async (delay: number = 0) => {
    const audioContext = await initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    const startTime = audioContext.currentTime + delay;
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
    
    return startTime * 1000; // Convert to milliseconds
  }, [initAudioContext]);

  const startCalibrationTest = useCallback(async () => {
    setIsCalibrating(true);
    setStep('test');
    setTestResults([]);
    
    const testCount = 5;
    const testInterval = 2000; // 2 seconds between beeps
    
    for (let i = 0; i < testCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Initial delay
      
      const beepTime = await playTestBeep();
      testStartTimeRef.current = performance.now();
      expectedClickTimeRef.current = beepTime;
      
      setCurrentTest({
        id: `test-${i}`,
        timestamp: Date.now(),
        expectedTime: beepTime,
        actualTime: 0,
        accuracy: 0
      });
      
      await new Promise(resolve => setTimeout(resolve, testInterval));
    }
    
    setIsCalibrating(false);
    setStep('results');
    calculateResults();
  }, [playTestBeep]);

  const handleTestClick = useCallback(() => {
    if (!currentTest) return;
    
    const clickTime = performance.now();
    const timeDiff = clickTime - testStartTimeRef.current;
    const accuracy = Math.max(0, 1 - Math.abs(timeDiff - 1000) / 1000); // Expect click ~1s after beep
    
    const completedTest: CalibrationTest = {
      ...currentTest,
      actualTime: clickTime,
      accuracy
    };
    
    setTestResults(prev => [...prev, completedTest]);
    setCurrentTest(null);
  }, [currentTest]);

  const calculateResults = useCallback(() => {
    if (testResults.length === 0) return;
    
    const avgAccuracy = testResults.reduce((sum, test) => sum + test.accuracy, 0) / testResults.length;
    const timeDiffs = testResults.map(test => test.actualTime - test.expectedTime);
    const avgOffset = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    
    setCalibration(prev => ({
      ...prev,
      audioOffset: Math.round(avgOffset),
      timestamp: Date.now()
    }));
  }, [testResults]);

  const applyPreset = useCallback((preset: CalibrationPreset) => {
    setCalibration(prev => ({
      ...prev,
      audioOffset: preset.audioOffset,
      visualOffset: preset.visualOffset,
      deviceType: preset.deviceType,
      audioOutput: preset.audioOutput,
      timestamp: Date.now()
    }));
  }, []);

  const getDeviceIcon = (deviceType: CalibrationData['deviceType']) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getAudioIcon = (audioOutput: CalibrationData['audioOutput']) => {
    switch (audioOutput) {
      case 'headphones': return <Headphones className="w-4 h-4" />;
      case 'bluetooth': return <Headphones className="w-4 h-4" />;
      default: return <Volume2 className="w-4 h-4" />;
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="cosmic-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-cosmic-gradient">Audio Sync Calibration</h2>
            <p className="text-muted-foreground">
              Optimize timing for your audio setup to get perfect hit accuracy
            </p>
          </div>

          {step === 'setup' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={calibration.deviceType}
                    onValueChange={(value: CalibrationData['deviceType']) =>
                      setCalibration(prev => ({ ...prev, deviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Desktop
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Mobile
                        </div>
                      </SelectItem>
                      <SelectItem value="tv">
                        <div className="flex items-center gap-2">
                          <Tv className="w-4 h-4" />
                          TV/Console
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Audio Output</Label>
                  <Select
                    value={calibration.audioOutput}
                    onValueChange={(value: CalibrationData['audioOutput']) =>
                      setCalibration(prev => ({ ...prev, audioOutput: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speakers">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          Speakers
                        </div>
                      </SelectItem>
                      <SelectItem value="headphones">
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4" />
                          Headphones
                        </div>
                      </SelectItem>
                      <SelectItem value="bluetooth">
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4" />
                          Bluetooth
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CALIBRATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex gap-1">
                          {getDeviceIcon(preset.deviceType)}
                          {getAudioIcon(preset.audioOutput)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{preset.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {preset.description}
                          </div>
                          <div className="text-xs text-accent mt-1">
                            {preset.audioOffset}ms offset
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Manual Audio Offset: {calibration.audioOffset}ms</Label>
                  <Slider
                    value={[calibration.audioOffset]}
                    onValueChange={([value]) =>
                      setCalibration(prev => ({ ...prev, audioOffset: value }))
                    }
                    min={-500}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Audio Early (-500ms)</span>
                    <span>Audio Late (+500ms)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={startCalibrationTest} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Automatic Test
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === 'test' && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Calibration Test</h3>
                <p className="text-muted-foreground">
                  Click the button exactly when you hear each beep
                </p>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full border-4 border-primary/50 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="w-24 h-24 rounded-full"
                    onClick={handleTestClick}
                    disabled={!currentTest}
                  >
                    <Volume2 className="w-8 h-8" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Test {testResults.length + 1} of 5
                  </p>
                  {currentTest && (
                    <Badge variant="outline" className="animate-pulse">
                      Listening for click...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-neon-cyan">
                  <Check className="w-5 h-5 inline mr-2" />
                  Calibration Complete
                </h3>
                <p className="text-muted-foreground">
                  Your audio sync has been optimized
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {calibration.audioOffset}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Audio Offset
                  </div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-neon-cyan">
                    {Math.round((testResults.reduce((sum, test) => sum + test.accuracy, 0) / testResults.length) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Accuracy
                  </div>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => onComplete(calibration)}
                  className="flex-1"
                >
                  Apply Calibration
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('setup')}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};