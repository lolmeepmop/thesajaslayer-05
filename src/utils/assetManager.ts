import { Song } from '@/types/song';

export interface SongConfiguration {
  songs: Song[];
  version: string;
  lastUpdated: string;
}

// GitHub repository configuration
const GITHUB_ASSETS_CONFIG = {
  owner: 'your-username', // Replace with your GitHub username
  repo: 'rhythm-game-assets',
  branch: 'main',
  baseUrl: 'https://raw.githubusercontent.com'
};

export class AssetManager {
  private static instance: AssetManager;
  private configCache: SongConfiguration | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private getGitHubRawUrl(path: string): string {
    const { owner, repo, branch, baseUrl } = GITHUB_ASSETS_CONFIG;
    return `${baseUrl}/${owner}/${repo}/${branch}/${path}`;
  }

  async loadSongConfiguration(): Promise<SongConfiguration> {
    // Return cached data if still valid
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      const configUrl = this.getGitHubRawUrl('songs.json');
      const response = await fetch(configUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch song configuration: ${response.status}`);
      }

      const config: SongConfiguration = await response.json();
      
      // Process songs to add GitHub URLs
      config.songs = config.songs.map(song => ({
        ...song,
        musicUrl: song.githubUrl ? this.getGitHubRawUrl(song.githubUrl) : song.musicUrl,
        imagePath: song.imagePath.startsWith('/') ? song.imagePath : this.getGitHubRawUrl(song.imagePath)
      }));

      // Cache the configuration
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return config;
    } catch (error) {
      console.error('Failed to load song configuration from GitHub:', error);
      
      // Fallback to local configuration
      return this.getFallbackConfiguration();
    }
  }

  private getFallbackConfiguration(): SongConfiguration {
    // Import local song bank as fallback
    const { SONG_BANK } = require('@/types/song');
    return {
      songs: SONG_BANK,
      version: 'local-fallback',
      lastUpdated: new Date().toISOString()
    };
  }

  async preloadAudioAssets(songs: Song[]): Promise<void> {
    const preloadPromises = songs.map(song => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', () => resolve()); // Continue even if one fails
        audio.src = song.musicUrl;
        audio.load();
      });
    });

    await Promise.allSettled(preloadPromises);
  }

  getUnlockedStages(completedStages: string[]): Song[] {
    if (!this.configCache) {
      return [];
    }

    return this.configCache.songs.filter(song => {
      // Stage 1 is always unlocked
      if (song.stageNumber === 1) return true;
      
      // Bonus tracks are always unlocked
      if (song.category === 'bonus') return true;
      
      // Check if unlock requirement is met
      if (song.unlockRequirement) {
        return completedStages.includes(song.unlockRequirement);
      }
      
      return true;
    });
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();