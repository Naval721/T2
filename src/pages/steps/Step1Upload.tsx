import { JerseyUpload } from "@/components/JerseyUpload";
import { PlayerDataUpload } from "@/components/PlayerDataUpload";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { JerseyImages, PlayerData } from "@/pages/Index";

interface Step1UploadProps {
  jerseyImages: JerseyImages;
  playerData: PlayerData[];
  onImagesChange: (images: JerseyImages) => void;
  onDataChange: (data: PlayerData[]) => void;
  onNext: () => void;
}

export const Step1Upload = ({
  jerseyImages,
  playerData,
  onImagesChange,
  onDataChange,
  onNext
}: Step1UploadProps) => {
  const canProceed = Object.keys(jerseyImages).length > 0 && playerData.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Upload Your Assets</h2>
        <p className="text-muted-foreground text-lg">
          Start by uploading your jersey images and player data to begin the design process
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JerseyUpload
          jerseyImages={jerseyImages}
          onImagesChange={onImagesChange}
        />
        <PlayerDataUpload
          playerData={playerData}
          onDataChange={onDataChange}
        />
      </div>

      {canProceed && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
          >
            Continue to Canvas Design
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};