// Utility to generate proper GitHub URLs for audio files
export function createAudioUrl(filename: string): string {
  const baseUrl = import.meta.env.VITE_SONG_ASSETS_BASE;
  
  if (!baseUrl || baseUrl.includes('YOUR_USERNAME/YOUR_REPO')) {
    // Fallback to local files if GitHub not configured
    return filename.startsWith('/') ? filename : `/${filename}`;
  }
  
  // Properly encode the filename for URL
  const encodedFilename = encodeURIComponent(filename.replace(/^\//, ''));
  return `${baseUrl}/${encodedFilename}`;
}

export function createLocalAudioUrl(filename: string): string {
  // Always return local URL as fallback
  return filename.startsWith('/') ? filename : `/${filename}`;
}