import { useState, useEffect } from 'react';
import { Song } from '@/types/song';
import { assetManager, SongConfiguration } from '@/utils/assetManager';

export interface UseSongConfigurationReturn {
  songs: Song[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  unlockedSongs: Song[];
}

export const useSongConfiguration = (completedStages: string[] = []): UseSongConfigurationReturn => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config: SongConfiguration = await assetManager.loadSongConfiguration();
      setSongs(config.songs);
      
      // Preload audio assets in the background
      assetManager.preloadAudioAssets(config.songs).catch(console.warn);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
      console.error('Song configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const unlockedSongs = assetManager.getUnlockedStages(completedStages);

  return {
    songs,
    loading,
    error,
    refetch: loadConfiguration,
    unlockedSongs
  };
};