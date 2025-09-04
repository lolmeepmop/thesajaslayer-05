import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Volume2, VolumeX, Gauge, Eye, Target } from 'lucide-react';
import { GameSettings, DEFAULT_SETTINGS, SETTINGS_RANGES } from '@/types/gameSettings';

interface GameSettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const GameSettingsPanel: React.FC<GameSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  const handleSliderChange = (key: keyof GameSettings, value: number[]) => {
    onSettingsChange({ ...settings, [key]: value[0] });
  };

  const handleSwitchChange = (key: keyof GameSettings, checked: boolean) => {
    onSettingsChange({ ...settings, [key]: checked });
  };

  const resetToDefaults = () => {
    onSettingsChange(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="cosmic-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-orbitron text-neon-purple">
              Game Settings
            </CardTitle>
            <CardDescription className="text-electric-lavender">
              Customize your rhythm game experience
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-neon-cyan" />
              <Label className="text-sm font-semibold text-foreground">Audio Settings</Label>
            </div>
            
            <div className="grid gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Audio Offset: {settings.audioOffset}ms
                </Label>
                <Slider
                  value={[settings.audioOffset]}
                  onValueChange={(value) => handleSliderChange('audioOffset', value)}
                  min={SETTINGS_RANGES.audioOffset.min}
                  max={SETTINGS_RANGES.audioOffset.max}
                  step={SETTINGS_RANGES.audioOffset.step}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Master Volume: {settings.masterVolume}%
                </Label>
                <Slider
                  value={[settings.masterVolume]}
                  onValueChange={(value) => handleSliderChange('masterVolume', value)}
                  min={SETTINGS_RANGES.masterVolume.min}
                  max={SETTINGS_RANGES.masterVolume.max}
                  step={SETTINGS_RANGES.masterVolume.step}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  SFX Volume: {settings.sfxVolume}%
                </Label>
                <Slider
                  value={[settings.sfxVolume]}
                  onValueChange={(value) => handleSliderChange('sfxVolume', value)}
                  min={SETTINGS_RANGES.sfxVolume.min}
                  max={SETTINGS_RANGES.sfxVolume.max}
                  step={SETTINGS_RANGES.sfxVolume.step}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Gameplay Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-neon-purple" />
              <Label className="text-sm font-semibold text-foreground">Gameplay Settings</Label>
            </div>
            
            <div className="grid gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Note Speed: {settings.noteSpeed}x
                </Label>
                <Slider
                  value={[settings.noteSpeed]}
                  onValueChange={(value) => handleSliderChange('noteSpeed', value)}
                  min={SETTINGS_RANGES.noteSpeed.min}
                  max={SETTINGS_RANGES.noteSpeed.max}
                  step={SETTINGS_RANGES.noteSpeed.step}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Input Sensitivity: {settings.inputSensitivity}x
                </Label>
                <Slider
                  value={[settings.inputSensitivity]}
                  onValueChange={(value) => handleSliderChange('inputSensitivity', value)}
                  min={SETTINGS_RANGES.inputSensitivity.min}
                  max={SETTINGS_RANGES.inputSensitivity.max}
                  step={SETTINGS_RANGES.inputSensitivity.step}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Background Brightness: {settings.backgroundBrightness}%
                </Label>
                <Slider
                  value={[settings.backgroundBrightness]}
                  onValueChange={(value) => handleSliderChange('backgroundBrightness', value)}
                  min={SETTINGS_RANGES.backgroundBrightness.min}
                  max={SETTINGS_RANGES.backgroundBrightness.max}
                  step={SETTINGS_RANGES.backgroundBrightness.step}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Visual Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-neon-cyan" />
              <Label className="text-sm font-semibold text-foreground">Visual Settings</Label>
            </div>
            
            <div className="grid gap-3 pl-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Show Hit Indicators</Label>
                <Switch
                  checked={settings.showHitIndicators}
                  onCheckedChange={(checked) => handleSwitchChange('showHitIndicators', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Show Combo Counter</Label>
                <Switch
                  checked={settings.showComboCounter}
                  onCheckedChange={(checked) => handleSwitchChange('showComboCounter', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Show Accuracy Percentage</Label>
                <Switch
                  checked={settings.showAccuracyPercentage}
                  onCheckedChange={(checked) => handleSwitchChange('showAccuracyPercentage', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Reset to Defaults
            </Button>
            <Button onClick={onClose} className="cosmic-button">
              Save & Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};