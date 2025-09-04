import React, { useEffect, useState } from 'react';
import { HitQualityData, HIT_QUALITY_CONFIGS } from '@/types/hitQuality';

interface HitQualityIndicatorProps {
  hitData: HitQualityData | null;
  x: number;
  y: number;
}

export const HitQualityIndicator: React.FC<HitQualityIndicatorProps> = ({ 
  hitData, 
  x, 
  y 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (hitData) {
      setIsVisible(true);
      setAnimationClass('animate-fade-in');
      
      const timer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
        setTimeout(() => setIsVisible(false), 300);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [hitData]);

  if (!isVisible || !hitData) return null;

  const config = HIT_QUALITY_CONFIGS[hitData.quality];

  return (
    <div
      className={`absolute z-50 pointer-events-none ${animationClass}`}
      style={{
        left: `${x}px`,
        top: `${y - 50}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex flex-col items-center space-y-1">
        <div
          className="text-lg font-orbitron font-bold drop-shadow-lg"
          style={{ 
            color: config.color,
            textShadow: `0 0 10px ${config.color}, 0 0 20px ${config.color}40`
          }}
        >
          {config.label}
        </div>
        <div
          className="text-sm font-exo font-semibold"
          style={{ color: config.color }}
        >
          +{hitData.points}
        </div>
      </div>
    </div>
  );
};