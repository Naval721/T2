import { DesignCanvas } from "@/components/DesignCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Settings2, Users } from "lucide-react";
import { Canvas as FabricCanvas, Text as FabricText, Image as FabricImage } from "fabric";
import type { JerseyImages, PlayerData } from "@/pages/Index";
import { CustomizationTools } from "@/components/CustomizationTools";

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

  const handleAddText = (text: string, fontFamily: string, fontSize: number, fill: string, stroke: string, strokeWidth: number) => {
    if (!canvasRef) return;
    const textObj = new FabricText(text, {
      left: canvasRef.width! / 2,
      top: canvasRef.height! / 2,
      fontSize,
      fontFamily,
      fill,
      stroke: strokeWidth > 0 ? stroke : undefined,
      strokeWidth,
      originX: 'center',
      originY: 'center',
      textAlign: 'center'
    });
    (textObj as any).name = 'customText';
    canvasRef.add(textObj);
    canvasRef.setActiveObject(textObj);
    canvasRef.requestRenderAll();
  };

  const handleAddLogo = async (logoUrl: string) => {
    if (!canvasRef) return;
    try {
      const logoImg = await FabricImage.fromURL(logoUrl);
      logoImg.set({
        left: canvasRef.width! / 2,
        top: canvasRef.height! / 2,
        originX: 'center',
        originY: 'center',
      });
      if (logoImg.width && logoImg.width > 300) {
        logoImg.scaleToWidth(300);
      }
      (logoImg as any).name = 'customLogo';
      (logoImg as any).src = logoUrl;
      canvasRef.add(logoImg);
      canvasRef.setActiveObject(logoImg);
      canvasRef.requestRenderAll();
    } catch (error) {
      console.error('Failed to add logo:', error);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-10 border-b-4 border-black pb-8">
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Customize</h2>
        <p className="text-gray-600 text-xl font-medium max-w-2xl mx-auto border-l-4 border-black pl-4 text-left">
          Add logos, text, and customize each jersey design with professional tools.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white p-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Select Player</h3>
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {playerData.map((player, index) => (
                <button
                  key={index}
                  onClick={() => onPlayerSelect(player)}
                  className={`w-full p-3 text-left transition-all border-2 border-transparent uppercase font-bold text-sm leading-tight flex justify-between items-center ${selectedPlayer === player
                    ? 'bg-black text-white translate-x-1 shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]'
                    : 'bg-gray-100 text-black hover:border-black'
                    }`}
                >
                  <span className="truncate pr-2">{player.playerName}</span>
                  <span className="font-mono text-xs opacity-70 whitespace-nowrap">
                    #{player.jerseyNumber} / {player.size}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedPlayer && (
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
              <div className="bg-white border-b-2 border-black p-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-black" />
                <h3 className="font-bold uppercase tracking-widest text-sm text-black">Design Tools</h3>
              </div>
              <div className="p-5">
                <CustomizationTools
                  onAddText={handleAddText}
                  onAddLogo={handleAddLogo}
                />
              </div>
            </div>
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
      <div className="flex justify-between pt-10 pb-6 border-t-2 border-black mt-8">
        <Button
          onClick={onPrev}
          variant="outline"
          className="h-14 px-8 text-sm font-bold uppercase tracking-widest border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <ArrowLeft className="w-5 h-5 mr-3" />
          Back to Canvas
        </Button>

        <Button
          onClick={onNext}
          className="h-14 px-8 text-sm font-bold uppercase tracking-widest bg-black text-white border-2 border-black hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          Continue to Export
          <ArrowRight className="w-5 h-5 ml-3" />
        </Button>
      </div>
    </div>
  );
};