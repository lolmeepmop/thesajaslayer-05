import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Search, Filter, Home, Clock, Zap, Lock } from 'lucide-react';
import { Input } from './ui/input';
import { Song } from '../types/song';
import { DifficultyLevel } from '../types/difficulty';
import { useSongConfiguration } from '@/hooks/useSongConfiguration';
import { LoadingProgress } from './LoadingProgress';

interface SongBankProps {
  onSongSelected: (song: Song, difficulty: DifficultyLevel) => void;
  onBack: () => void;
  difficulty: DifficultyLevel;
  completedStages?: string[];
}

export const SongBank: React.FC<SongBankProps> = ({ 
  onSongSelected, 
  onBack, 
  difficulty, 
  completedStages = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stage' | 'bonus'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { songs, loading, error } = useSongConfiguration(completedStages);

  // Filter songs based on search and category
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.genre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSongSelect = (song: Song) => {
    // Don't allow selection of locked songs
    if (isSongLocked(song)) return;
    
    // Stop any preview audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onSongSelected(song, difficulty);
  };

  const isSongLocked = (song: Song): boolean => {
    if (song.category === 'bonus') return false;
    if (song.stageNumber === 1) return false;
    if (song.unlockRequirement) {
      return !completedStages.includes(song.unlockRequirement);
    }
    return false;
  };

  const getDifficultyColor = (songDifficulty?: string) => {
    switch (songDifficulty) {
      case 'Easy': return 'text-neon-cyan';
      case 'Medium': return 'text-neon-orange';
      case 'Hard': return 'text-neon-coral';
      default: return 'text-electric-lavender';
    }
  };

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neon-purple via-electric-blue to-cosmic-purple flex items-center justify-center">
        <LoadingProgress 
          visible={true}
          stage="loading"
          progress={0}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neon-purple via-electric-blue to-cosmic-purple flex items-center justify-center">
        <div className="cosmic-card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Songs</h2>
          <p className="text-electric-lavender mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            ← Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-auto"
      style={{
        backgroundImage: `url('/lovable-uploads/b5e657df-0271-4657-b1eb-3998fe0409b6.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-electric-lavender hover:bg-white/10 border border-white/20"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          <div className="text-center">
            <h1 className="synthwave-title text-4xl md:text-6xl mb-2">
              SONG BANK
            </h1>
            <p className="synthwave-tagline text-lg">
              Choose your rhythm. Select your challenge.
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer for center alignment */}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs, artists, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 border-border/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'stage', 'bonus'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category as any)}
                className={selectedCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card/50 border-border/50 text-foreground hover:bg-accent"
                }
              >
                <Filter className="h-3 w-3 mr-1" />
                {category === 'all' ? 'All' : category === 'stage' ? 'Main' : 'Bonus'}
              </Button>
            ))}
          </div>
        </div>

        {/* Songs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredSongs.map((song) => {
            const isLocked = isSongLocked(song);
            
            return (
              <div
                key={song.id}
                className={`cosmic-card p-4 transition-all duration-300 group ${
                  isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 cursor-pointer'
                }`}
                onClick={() => handleSongSelect(song)}
              >
                {/* Song Artwork */}
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <img
                    src={song.imagePath}
                    alt={song.name}
                    className={`w-full h-48 object-cover transition-transform duration-300 ${
                      isLocked ? 'grayscale' : 'group-hover:scale-110'
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
                  
                  {/* Lock overlay for locked songs */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Lock className="h-12 w-12 text-white" />
                    </div>
                  )}
                  
                  {/* Play button overlay */}
                  {!isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-primary/90 backdrop-blur-sm rounded-full p-3">
                        <Play className="h-6 w-6 text-primary-foreground fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Stage number badge */}
                  {song.stageNumber && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-black/60 text-white">
                        Stage {song.stageNumber}
                      </span>
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      song.category === 'bonus' 
                        ? 'bg-neon-coral/80 text-white' 
                        : 'bg-neon-blue/80 text-white'
                    }`}>
                      {song.category === 'bonus' ? 'BONUS' : 'MAIN'}
                    </span>
                  </div>
                </div>

                {/* Song Info */}
                <div className="space-y-2">
                  <h3 className={`font-bold text-lg transition-colors ${
                    isLocked 
                      ? 'text-muted-foreground' 
                      : 'text-foreground group-hover:text-primary'
                  }`}>
                    {song.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{song.artist}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {song.estimatedDuration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-accent">{song.genre}</span>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className={`text-sm font-medium ${getDifficultyColor(song.difficulty)}`}>
                        {song.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Unlock requirement message */}
                  {isLocked && song.unlockRequirement && (
                    <p className="text-xs text-red-400 mt-2">
                      Complete Stage {song.unlockRequirement.replace('stage', '')} to unlock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {filteredSongs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No songs found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};