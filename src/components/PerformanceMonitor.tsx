import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { PerformanceMetrics, PerformanceConfig, PERFORMANCE_THRESHOLDS } from '../types/performance';

interface PerformanceMonitorProps {
  visible: boolean;
  onConfigChange: (config: Partial<PerformanceConfig>) => void;
  gameObjectCount?: number;
  particleCount?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible,
  onConfigChange,
  gameObjectCount = 0,
  particleCount = 0
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    audioLatency: 0,
    renderTime: 0,
    gameObjects: gameObjectCount,
    particles: particleCount
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!visible) return;

    const measurePerformance = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        const frameTime = deltaTime / frameCountRef.current;
        
        // Update FPS history for stability
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        const avgFps = fpsHistoryRef.current.reduce((sum, f) => sum + f, 0) / fpsHistoryRef.current.length;
        
        // Get memory usage if available
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        
        setMetrics(prev => ({
          ...prev,
          fps: Math.round(avgFps),
          frameTime: Number(frameTime.toFixed(2)),
          memoryUsage,
          gameObjects: gameObjectCount,
          particles: particleCount
        }));
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);
    
    return () => cancelAnimationFrame(animationId);
  }, [visible, gameObjectCount, particleCount]);

  const getFpsStatus = (fps: number): { color: string; label: string } => {
    if (fps >= 50) return { color: 'hsl(var(--neon-cyan))', label: 'Excellent' };
    if (fps >= PERFORMANCE_THRESHOLDS.lowFPS) return { color: 'hsl(var(--secondary))', label: 'Good' };
    if (fps >= PERFORMANCE_THRESHOLDS.criticalFPS) return { color: 'hsl(var(--neon-orange))', label: 'Poor' };
    return { color: 'hsl(var(--destructive))', label: 'Critical' };
  };

  const getMemoryStatus = (memory: number): { color: string; label: string } => {
    if (memory === 0) return { color: 'hsl(var(--muted-foreground))', label: 'Unknown' };
    if (memory < PERFORMANCE_THRESHOLDS.highMemory) return { color: 'hsl(var(--neon-cyan))', label: 'Normal' };
    if (memory < PERFORMANCE_THRESHOLDS.criticalMemory) return { color: 'hsl(var(--neon-orange))', label: 'High' };
    return { color: 'hsl(var(--destructive))', label: 'Critical' };
  };

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleOptimizePerformance = () => {
    const { fps } = metrics;
    
    if (fps < PERFORMANCE_THRESHOLDS.lowFPS) {
      onConfigChange({
        qualityLevel: 'low',
        maxParticles: 25,
        maxGameObjects: 25
      });
    } else if (fps < 50) {
      onConfigChange({
        qualityLevel: 'medium',
        maxParticles: 50,
        maxGameObjects: 35
      });
    }
  };

  if (!visible) return null;

  const fpsStatus = getFpsStatus(metrics.fps);
  const memoryStatus = getMemoryStatus(metrics.memoryUsage);

  return (
    <Card className="cosmic-card p-4 absolute top-4 right-4 w-64 z-50">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-cosmic-gradient">Performance Monitor</h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span>FPS:</span>
            <div className="flex items-center gap-2">
              <span style={{ color: fpsStatus.color }} className="font-mono">
                {metrics.fps}
              </span>
              <Badge 
                variant="outline" 
                style={{ borderColor: fpsStatus.color, color: fpsStatus.color }}
              >
                {fpsStatus.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span>Frame Time:</span>
            <span className="font-mono text-muted-foreground">{metrics.frameTime}ms</span>
          </div>
          
          <div className="flex justify-between">
            <span>Memory:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {formatMemory(metrics.memoryUsage)}
              </span>
              <Badge 
                variant="outline" 
                style={{ borderColor: memoryStatus.color, color: memoryStatus.color }}
              >
                {memoryStatus.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span>Objects:</span>
            <span className="font-mono text-muted-foreground">{metrics.gameObjects}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Particles:</span>
            <span className="font-mono text-muted-foreground">{metrics.particles}</span>
          </div>
        </div>
        
        {(metrics.fps < PERFORMANCE_THRESHOLDS.lowFPS || metrics.memoryUsage > PERFORMANCE_THRESHOLDS.highMemory) && (
          <Button 
            onClick={handleOptimizePerformance}
            size="sm"
            className="w-full bg-neon-orange/20 border border-neon-orange/50 text-neon-orange hover:bg-neon-orange/30"
          >
            Optimize Performance
          </Button>
        )}
      </div>
    </Card>
  );
};