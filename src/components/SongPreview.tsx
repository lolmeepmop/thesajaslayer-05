import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface SongPreviewProps {
  musicUrl: string;
  isPlaying: boolean;
  onPlayToggle: () => void;
  className?: string;
}

export const SongPreview: React.FC<SongPreviewProps> = ({ 
  musicUrl, 
  isPlaying, 
  onPlayToggle, 
  className = "" 
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
      audioRef.current.preload = 'metadata';
      
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
        setHasError(false);
      });
      audioRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setHasError(true);
      });
      audioRef.current.addEventListener('ended', () => {
        // Reset to beginning when preview ends
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      });
    }

    // Update audio source
    if (audioRef.current.src !== musicUrl) {
      audioRef.current.src = musicUrl;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [musicUrl]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && !hasError) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setHasError(true);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, hasError]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasError) {
      onPlayToggle();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${className} ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={isLoading || hasError}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : hasError ? (
        <Volume2 className="h-4 w-4 opacity-50" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
};