import { ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

export const SurveyPrompt = () => {
  const handleSurveyClick = () => {
    window.open('https://forms.fillout.com/t/qTs47x4oJrus', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-card/50 rounded-lg p-4 border border-border/50 backdrop-blur-sm mb-6">
      <p className="text-sm text-muted-foreground mb-3 text-center">
        Help us improve your rhythm experience!
      </p>
      <Button 
        onClick={handleSurveyClick}
        variant="outline" 
        size="sm"
        className="w-full text-xs"
      >
        <ExternalLink className="w-3 h-3 mr-2" />
        Take Quick Survey
      </Button>
    </div>
  );
};