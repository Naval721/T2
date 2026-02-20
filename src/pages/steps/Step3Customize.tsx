import { DesignCanvas } from "@/components/DesignCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import type { JerseyImages, PlayerData } from "@/pages/Index";

interface Step3CustomizeProps {
  jerseyImages: JerseyImages;
  playerData: PlayerData[];
  selectedPlayer: PlayerData | null;
  onPlayerSelect: (player: PlayerData) => void;
  canvasRef: FabricCanvas | null;
  onCanvasReady: (ref: FabricCanvas | null) => void;
  defaultFont?: string;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Customize = ({
  jerseyImages,
  playerData,
  selectedPlayer,
  onPlayerSelect,
  canvasRef,
  onCanvasReady,
  defaultFont,
  onNext,
  onPrev
}: Step3CustomizeProps) => {

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Customize Designs</h2>
        <p className="text-muted-foreground text-lg">
          Add logos, text, and customize each jersey design with professional tools
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Player Selection */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Select Player</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playerData.map((player, index) => (
                <button
                  key={index}
                  onClick={() => onPlayerSelect(player)}
                  className={`w-full p-3 text-left rounded-lg transition-all ${selectedPlayer === player
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary hover:bg-muted'
                    }`}
                >
                  <div className="font-medium">{player.playerName}</div>
                  <div className="text-sm opacity-70">#{player.jerseyNumber} - {player.size}</div>
                </button>
              ))}
            </div>
          </Card>

          {selectedPlayer && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Customization Tools</h3>
              <p className="text-sm text-muted-foreground">
                Use the canvas controls to add text, logos, and customize your design.
              </p>
            </Card>
          )}
        </div>

        {/* Canvas Area */}
        <div className="xl:col-span-3">
          <DesignCanvas
            jerseyImages={jerseyImages}
            selectedPlayer={selectedPlayer}
            onCanvasReady={onCanvasReady}
            defaultFont={defaultFont}
            showTools={true}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Canvas
        </Button>

        <Button
          onClick={onNext}
          size="lg"
        >
          Continue to Export
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};