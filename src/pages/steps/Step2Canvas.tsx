import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontSelector } from "@/components/FontSelector";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import type { JerseyImages, PlayerData } from "@/pages/Index";

interface Step2CanvasProps {
  jerseyImages: JerseyImages;
  playerData: PlayerData[];
  selectedPlayer: PlayerData | null;
  onPlayerSelect: (player: PlayerData) => void;
  defaultFont: string;
  onFontChange: (font: string) => void;
  defaultColor: string;
  onColorChange: (color: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2Canvas = ({
  jerseyImages,
  playerData,
  selectedPlayer,
  onPlayerSelect,
  defaultFont,
  onFontChange,
  defaultColor,
  onColorChange,
  onNext,
  onPrev
}: Step2CanvasProps) => {

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Canvas Preview</h2>
        <p className="text-muted-foreground text-lg">
          Review your imported data and jersey designs. Select a player to preview their jersey.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Player Selection Panel */}
        <div className="xl:col-span-1">
          <Card className="p-4 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase tracking-widest text-sm mb-3 border-b-2 border-black pb-2">Imported Players ({playerData.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playerData.map((player) => (
                <button
                  key={`${player.playerName}_${player.jerseyNumber}`}
                  onClick={() => onPlayerSelect(player)}
                  title={player.playerName}
                  className={`w-full p-3 text-left transition-all border-2 text-sm font-bold uppercase leading-tight flex justify-between items-center ${
                    selectedPlayer?.playerName === player.playerName && selectedPlayer?.jerseyNumber === player.jerseyNumber
                      ? 'bg-black text-white border-black'
                      : 'bg-gray-100 text-black border-transparent hover:border-black'
                  }`}
                >
                  <div className="font-medium truncate pr-2">{player.playerName}</div>
                  <div className="text-xs opacity-70 whitespace-nowrap">#{player.jerseyNumber} · {player.size}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Font Selection */}
          <Card className="p-4 mt-4 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-black uppercase tracking-widest text-sm mb-3 border-b-2 border-black pb-2">Default Font for All Players</h4>
            <p className="text-xs text-gray-500 font-mono mb-4">
              This font will be applied to all player names and numbers
            </p>
            <FontSelector
              value={defaultFont}
              onChange={onFontChange}
              color={defaultColor}
              onColorChange={onColorChange}
              label="Player Name & Number Font"
              showPreview={true}
            />
          </Card>

          {/* Data Summary */}
          <Card className="p-4 mt-4 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-black uppercase tracking-widest text-sm mb-3 border-b-2 border-black pb-2">Import Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-xs">Jersey Images:</span>
                <span className="font-bold">{Object.keys(jerseyImages).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-xs">Players:</span>
                <span className="font-bold">{playerData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-xs">Sizes:</span>
                <span className="font-bold">
                  {[...new Set(playerData.map(p => p.size))].join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase text-xs">Font:</span>
                <span className="font-bold truncate max-w-[100px]" title={defaultFont} style={{ fontFamily: defaultFont }}>
                  {defaultFont}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Canvas Area */}
        <div className="xl:col-span-3">
          <div id="canvas-portal-target" className="w-full h-full min-h-[720px] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative bg-gray-50 overflow-hidden">
            {/* The persistent canvas from Index.tsx is portaled here */}
          </div>
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
          Back to Upload
        </Button>

        <Button
          onClick={onNext}
          size="lg"
        >
          Continue to Customization
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};