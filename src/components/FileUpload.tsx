import React, { useCallback, useState } from 'react';
import { Upload, Music, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  onBack?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, onBack }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav')
    );

    if (audioFile) {
      if (audioFile.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }
      onFileSelect(audioFile);
    } else {
      setError('Please upload an MP3 or WAV audio file');
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {onBack && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="cosmic-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>
      )}
      <div className="cosmic-card p-8 max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cosmic-gradient mb-4">
            Cosmic Rhythm
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your favorite song and let the cosmos dance to your rhythm
          </p>
        </div>

        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 transition-all duration-300
            ${isDragOver 
              ? 'border-primary bg-primary/10 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }
            ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && document.getElementById('audio-input')?.click()}
        >
          <input
            id="audio-input"
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center space-y-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="text-lg font-medium text-primary">
                  Analyzing your cosmic frequencies...
                </p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="energy-orb w-16 h-16 flex items-center justify-center">
                    {isDragOver ? (
                      <Music className="w-8 h-8 text-white" />
                    ) : (
                      <Upload className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragOver ? 'Release to upload' : 'Drop your audio file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • MP3, WAV • Max 50MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="cosmic-card p-4 bg-accent/10">
              <Music className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="font-medium">Beat Detection</p>
              <p className="text-muted-foreground text-xs">AI-powered rhythm analysis</p>
            </div>
            <div className="cosmic-card p-4 bg-secondary/10">
              <div className="w-6 h-6 bg-secondary rounded mx-auto mb-2" />
              <p className="font-medium">Dynamic Gameplay</p>
              <p className="text-muted-foreground text-xs">Adaptive difficulty scaling</p>
            </div>
            <div className="cosmic-card p-4 bg-primary/10">
              <div className="w-6 h-6 bg-primary rounded mx-auto mb-2" />
              <p className="font-medium">Cosmic Visuals</p>
              <p className="text-muted-foreground text-xs">Synchronized light shows</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};