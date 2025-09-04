import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
  onSettings,
  onMainMenu
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <Card className="cosmic-card w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-orbitron text-neon-purple">
            Game Paused
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            onClick={onResume}
            className="w-full cosmic-button justify-start"
            size="lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Resume
          </Button>
          
          <Button
            onClick={onRestart}
            variant="outline"
            className="w-full justify-start border-secondary/50 text-secondary hover:bg-secondary/10"
            size="lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Restart Song
          </Button>
          
          <Button
            onClick={onSettings}
            variant="outline"
            className="w-full justify-start border-accent/50 text-accent hover:bg-accent/10"
            size="lg"
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
          
          <Button
            onClick={onMainMenu}
            variant="outline"
            className="w-full justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Main Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};