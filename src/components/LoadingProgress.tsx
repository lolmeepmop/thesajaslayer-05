import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Loader2, Music, Activity, Sparkles } from 'lucide-react';

interface LoadingProgressProps {
  visible: boolean;
  progress: number;
  stage: 'loading' | 'analyzing' | 'generating' | 'optimizing';
  fileName?: string;
  error?: string | null;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  visible,
  progress,
  stage,
  fileName,
  error
}) => {
  if (!visible) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'loading':
        return {
          icon: <Music className="w-6 h-6 text-primary animate-pulse" />,
          title: 'Loading Audio File',
          description: fileName ? `Loading ${fileName}...` : 'Preparing audio file...',
          color: 'hsl(var(--primary))'
        };
      case 'analyzing':
        return {
          icon: <Activity className="w-6 h-6 text-neon-cyan animate-bounce" />,
          title: 'Analyzing Audio',
          description: 'Detecting beats, tempo, and musical structure...',
          color: 'hsl(var(--neon-cyan))'
        };
      case 'generating':
        return {
          icon: <Sparkles className="w-6 h-6 text-secondary animate-spin" />,
          title: 'Generating Beatmap',
          description: 'Creating gameplay patterns based on the music...',
          color: 'hsl(var(--secondary))'
        };
      case 'optimizing':
        return {
          icon: <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />,
          title: 'Optimizing Performance',
          description: 'Preparing the game for smooth gameplay...',
          color: 'hsl(var(--neon-purple))'
        };
    }
  };

  const stageInfo = getStageInfo();
  const progressPercentage = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="cosmic-card w-full max-w-md">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              {stageInfo.icon}
            </div>
            <h2 className="text-xl font-bold text-cosmic-gradient">
              {stageInfo.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {stageInfo.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono" style={{ color: stageInfo.color }}>
                {progressPercentage}%
              </span>
            </div>
            
            <Progress 
              value={progress * 100}
              className="h-2"
            />
            
            <div className="flex justify-center">
              <div 
                className="text-xs font-medium px-3 py-1 rounded-full border"
                style={{ 
                  borderColor: stageInfo.color,
                  color: stageInfo.color,
                  backgroundColor: `${stageInfo.color}10`
                }}
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}...
              </div>
            </div>
          </div>

          {/* Stage Details */}
          <div className="space-y-2 text-xs text-muted-foreground">
            {stage === 'loading' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Decoding audio...</span>
                  <span>{progress < 0.5 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validating format...</span>
                  <span>{progress < 0.8 ? '⏳' : '✓'}</span>
                </div>
              </div>
            )}
            
            {stage === 'analyzing' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>BPM detection...</span>
                  <span>{progress < 0.3 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beat tracking...</span>
                  <span>{progress < 0.7 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy analysis...</span>
                  <span>{progress < 0.9 ? '⏳' : '✓'}</span>
                </div>
              </div>
            )}
            
            {stage === 'generating' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Pattern generation...</span>
                  <span>{progress < 0.4 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty scaling...</span>
                  <span>{progress < 0.7 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality assurance...</span>
                  <span>{progress < 0.9 ? '⏳' : '✓'}</span>
                </div>
              </div>
            )}
            
            {stage === 'optimizing' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Memory optimization...</span>
                  <span>{progress < 0.5 ? '⏳' : '✓'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance tuning...</span>
                  <span>{progress < 0.8 ? '⏳' : '✓'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">Error:</p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
            <p className="text-xs text-accent font-medium mb-1">💡 Tip:</p>
            <p className="text-xs text-muted-foreground">
              {stage === 'loading' && 'MP3 and WAV files work best for optimal analysis.'}
              {stage === 'analyzing' && 'Complex songs with clear beats will create better patterns.'}
              {stage === 'generating' && 'The algorithm adapts patterns to match your selected difficulty.'}
              {stage === 'optimizing' && 'This ensures smooth 60fps gameplay on your device.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};