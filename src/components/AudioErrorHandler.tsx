import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, FileAudio, Lightbulb } from 'lucide-react';

interface AudioErrorHandlerProps {
  visible: boolean;
  error: string;
  fileName?: string;
  onRetry: () => void;
  onNewFile: () => void;
  onClose: () => void;
}

export const AudioErrorHandler: React.FC<AudioErrorHandlerProps> = ({
  visible,
  error,
  fileName,
  onRetry,
  onNewFile,
  onClose
}) => {
  if (!visible) return null;

  const getErrorType = (errorMessage: string): string => {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('decode') || lower.includes('format')) return 'Format Error';
    if (lower.includes('timeout')) return 'Loading Timeout';
    if (lower.includes('network') || lower.includes('fetch')) return 'Network Error';
    if (lower.includes('memory')) return 'Memory Error';
    if (lower.includes('permission') || lower.includes('access')) return 'Permission Error';
    return 'Audio Error';
  };

  const getSolution = (errorMessage: string): string => {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('decode') || lower.includes('format')) {
      return 'Try converting your file to MP3 or WAV format. Some browsers have limited codec support.';
    }
    if (lower.includes('timeout')) {
      return 'The file may be too large or your connection is slow. Try a smaller file or check your internet connection.';
    }
    if (lower.includes('memory')) {
      return 'Close other browser tabs and try again. Large audio files require more memory to process.';
    }
    if (lower.includes('permission')) {
      return 'Check your browser permissions for audio playback and microphone access.';
    }
    return 'Try using a different audio file in MP3 or WAV format under 50MB.';
  };

  const getRecommendations = (): string[] => {
    return [
      'Use MP3 or WAV files for best compatibility',
      'Keep files under 50MB for optimal performance',
      'Ensure stable internet connection for large files',
      'Try clearing your browser cache if issues persist',
      'Use songs with clear beats for better pattern generation'
    ];
  };

  const errorType = getErrorType(error);
  const solution = getSolution(error);
  const recommendations = getRecommendations();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="cosmic-card w-full max-w-lg">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive/50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-destructive">{errorType}</h2>
            <p className="text-sm text-muted-foreground">
              {fileName ? `Problem with "${fileName}"` : 'Audio processing failed'}
            </p>
          </div>

          {/* Error Details */}
          <div className="space-y-4">
            <div className="bg-muted/20 border border-border/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-foreground mb-2">What happened?</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                <h3 className="font-semibold text-sm text-accent">How to fix it:</h3>
              </div>
              <p className="text-sm text-muted-foreground">{solution}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-neon-cyan mb-3 flex items-center gap-2">
              <FileAudio className="w-4 h-4" />
              Audio File Tips
            </h3>
            <ul className="space-y-1">
              {recommendations.map((tip, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-neon-cyan mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              className="flex-1 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={onNewFile}
              variant="outline"
              className="flex-1"
            >
              <FileAudio className="w-4 h-4 mr-2" />
              New File
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Continue Anyway
          </Button>
        </div>
      </Card>
    </div>
  );
};