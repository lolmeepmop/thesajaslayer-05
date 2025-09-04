export interface AudioFileStatus {
  url: string;
  exists: boolean;
  error?: string;
  isPreviewMode?: boolean;
  retryCount?: number;
}

export class AudioFileValidator {
  private cache = new Map<string, AudioFileStatus>();
  private maxRetries = 3;
  private retryDelay = 1000;

  private isPreviewMode(): boolean {
    const host = window.location.hostname || '';
    // Detect Lovable preview hosts only (avoid relying on process.env in browser)
    return host.includes('lovableproject.com') || host.includes('preview');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateFile(url: string, retryCount = 0): Promise<AudioFileStatus> {
    const cacheKey = `${url}-${retryCount}`;
    
    // Check cache first (but allow retries to bypass cache)
    if (this.cache.has(cacheKey) && retryCount === 0) {
      return this.cache.get(cacheKey)!;
    }

    const tryRangeCheck = async (): Promise<AudioFileStatus> => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-1023' },
          mode: 'cors',
          cache: 'no-cache'
        });
        const ok = response.ok || response.status === 206; // 206 = Partial Content
        return {
          url,
          exists: ok,
          error: ok ? undefined : `Range check error: ${response.status} ${response.statusText}`,
          isPreviewMode: this.isPreviewMode(),
          retryCount
        };
      } catch (e) {
        return {
          url,
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error during range check',
          isPreviewMode: this.isPreviewMode(),
          retryCount
        };
      }
    };

    try {
      // In Lovable preview mode, use special validation flow
      if (this.isPreviewMode()) {
        const status = await this.validateFilePreviewMode(url, retryCount);
        this.cache.set(cacheKey, status);
        return status;
      }

      // Standard HEAD check first
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (response.ok) {
        const status: AudioFileStatus = {
          url,
          exists: true,
          isPreviewMode: this.isPreviewMode(),
          retryCount
        };
        this.cache.set(cacheKey, status);
        return status;
      }

      // Fallback to GET with Range in non-preview environments too
      const rangeStatus = await tryRangeCheck();
      this.cache.set(cacheKey, rangeStatus);
      return rangeStatus;
    } catch (error) {
      // Fallback to range check on errors
      const rangeStatus = await tryRangeCheck();
      if (rangeStatus.exists) {
        this.cache.set(cacheKey, rangeStatus);
        return rangeStatus;
      }

      // Retry logic for transient errors
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.validateFile(url, retryCount + 1);
      }

      this.cache.set(cacheKey, rangeStatus);
      return rangeStatus;
    }
  }

  private async validateFilePreviewMode(url: string, retryCount: number): Promise<AudioFileStatus> {
    // Try HEAD request first
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (response.ok) {
        return {
          url,
          exists: true,
          isPreviewMode: true,
          retryCount
        };
      }
    } catch {
      // HEAD might fail in preview mode, try GET with range
    }

    // Fallback to GET request with minimal range
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-1023' },
        mode: 'cors',
        cache: 'no-cache'
      });

      const ok = response.ok || response.status === 206; // 206 = Partial Content
      return {
        url,
        exists: ok,
        error: ok ? undefined : `Preview mode error: ${response.status}`,
        isPreviewMode: true,
        retryCount
      };
    } catch (error) {
      // Final fallback - retry with backoff
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.validateFilePreviewMode(url, retryCount + 1);
      }

      return {
        url,
        exists: false,
        error: `Preview mode network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isPreviewMode: true,
        retryCount
      };
    }
  }

  async validateFiles(urls: string[]): Promise<AudioFileStatus[]> {
    return Promise.all(urls.map(url => this.validateFile(url)));
  }

  clearCache(): void {
    this.cache.clear();
  }
}
