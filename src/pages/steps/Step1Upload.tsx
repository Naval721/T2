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
  const hasImages = Object.keys(jerseyImages).length > 0;
  const hasPlayers = playerData.length > 0;
  const canProceed = hasImages && hasPlayers;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 border-b-4 border-black pb-8">
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Upload Assets</h2>
        <p className="text-gray-600 text-lg font-medium max-w-xl mx-auto border-l-4 border-black pl-4 text-left">
          Add your jersey images and player data to begin the design process.
        </p>

        {/* Upload progress checklist */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${hasImages ? 'text-black' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 flex items-center justify-center text-xs border-2 ${hasImages ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-300'}`}>
              {hasImages ? '✓' : '1'}
            </span>
            Jersey Images
          </div>
          <div className={`w-8 h-0.5 ${hasImages ? 'bg-black' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${hasPlayers ? 'text-black' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 flex items-center justify-center text-xs border-2 ${hasPlayers ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-300'}`}>
              {hasPlayers ? '✓' : '2'}
            </span>
            Player Data
          </div>
        </div>
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

      {canProceed ? (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="h-14 px-10 text-sm font-black uppercase tracking-widest bg-black text-white border-2 border-black hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            Continue to Canvas Design
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 font-mono uppercase tracking-wider pt-4">
          {!hasImages && !hasPlayers
            ? 'Upload jersey images and player data to continue'
            : !hasImages
            ? 'Upload jersey images to continue'
            : 'Upload player data to continue'}
        </p>
      )}
    </div>
  );
};