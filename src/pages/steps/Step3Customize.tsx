import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Settings2, Users, Paintbrush } from "lucide-react";
import { Canvas as FabricCanvas, IText as FabricText, Image as FabricImage } from "fabric";
import type { JerseyImages, PlayerData } from "@/pages/Index";
import { CustomizationTools } from "@/components/CustomizationTools";
import { FontSelector } from "@/components/FontSelector";
interface Step3CustomizeProps {
  jerseyImages: JerseyImages;
  playerData: PlayerData[];
  selectedPlayer: PlayerData | null;
  onPlayerSelect: (player: PlayerData) => void;
  canvasRef: FabricCanvas | null;
  onCanvasReady: (ref: FabricCanvas | null) => void;
  defaultFont: string;
  onFontChange: (font: string) => void;
  defaultColor: string;
  onColorChange: (color: string) => void;
  defaultStrokeColor: string;
  onStrokeColorChange: (color: string) => void;
  defaultStrokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
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
  onFontChange,
  defaultColor,
  onColorChange,
  defaultStrokeColor,
  onStrokeColorChange,
  defaultStrokeWidth,
  onStrokeWidthChange,
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
      // BUG-A5 FIX: stroke renders behind fill, same as player name/number text
      paintFirst: 'stroke',
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      objectCaching: false
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (textObj as any).name = 'customText';
    canvasRef.add(textObj);
    canvasRef.setActiveObject(textObj);
    canvasRef.requestRenderAll();
  };

  const handleAddLogo = async (logoUrl: string, logoType: 'custom' | 'front1' | 'front2' | 'front3' = 'custom') => {
    if (!canvasRef) return;
    try {
      const logoImg = await FabricImage.fromURL(logoUrl);
      
      // Find current jersey image on canvas to compute relative positioning/scaling
      const shirtObj = canvasRef.getObjects().find(o => {
        const n = (o as { name?: string }).name;
        return n === 'jerseyFront' || n === 'jerseyBack' ||
            n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
      });
      const rect = shirtObj ? shirtObj.getBoundingRect() : null;

      // Default custom logo placement
      let targetLeft = canvasRef.width! / 2;
      let targetTop = canvasRef.height! / 2;
      
      // Baseline size 28 dimensions (width: 434px, height: 630px)
      const baselineWidth = 434;
      
      // Current scale relative to baseline jersey size
      const scaleFactor = rect ? (rect.width / baselineWidth) : 1;
      
      // Calculate sizes: Front 1 & 2 are 3.3in x 3.5in. Front 3 (Sponsor) is 7.5in x 3.0in
      let widthIn = 3.3;
      let heightIn = 3.5;
      if (logoType === 'front3') {
        widthIn = 7.5;
        heightIn = 3.0;
      }
      
      const fixedWidthPx = widthIn * 28 * scaleFactor; 
      const fixedHeightPx = heightIn * 28 * scaleFactor;

      if (rect) {
        if (logoType === 'front1') {
          // Left Chest (Viewer's Right) - relLeft = 0.684, relTop = 0.341
          targetLeft = rect.left + 0.684 * rect.width;
          targetTop = rect.top + 0.341 * rect.height;
        } else if (logoType === 'front2') {
          // Right Chest (Viewer's Left) - relLeft = 0.316, relTop = 0.341
          targetLeft = rect.left + 0.316 * rect.width;
          targetTop = rect.top + 0.341 * rect.height;
        } else if (logoType === 'front3') {
          // Center Bottom - relLeft = 0.5, relTop = 0.754
          targetLeft = rect.left + 0.5 * rect.width;
          targetTop = rect.top + 0.754 * rect.height;
        }
      } else {
        // Fallback to absolute positions if no jersey image is on canvas
        if (logoType === 'front1') {
          targetLeft = (canvasRef.width! / 2) + 80; // Left Chest (Viewer's Right)
          targetTop = 260;
        } else if (logoType === 'front2') {
          targetLeft = (canvasRef.width! / 2) - 80; // Right Chest (Viewer's Left)
          targetTop = 260;
        } else if (logoType === 'front3') {
          targetLeft = canvasRef.width! / 2;        // Center Bottom
          targetTop = 520;
        }
      }

      logoImg.set({
        left: targetLeft,
        top: targetTop,
        originX: 'center',
        originY: 'center',
      });

      if (logoType !== 'custom') {
        // Scale proportionally to fit within the scaled 3.3in x 3.5in box
        if (logoImg.width && logoImg.height) {
          const scaleX = fixedWidthPx / logoImg.width;
          const scaleY = fixedHeightPx / logoImg.height;
          const scale = Math.min(scaleX, scaleY);
          logoImg.scale(scale);
        }
      } else {
        if (logoImg.width && logoImg.width > 300) {
          logoImg.scaleToWidth(300);
        }
      }

      // BUG-C4/A1 FIX: Set .name and .src BEFORE adding to canvas so that
      // the object:added → persistState() handler captures them correctly.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (logoImg as any).name = 'customLogo';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              {playerData.map((player) => (
                <button
                  key={`${player.playerName}_${player.jerseyNumber}`}
                  onClick={() => onPlayerSelect(player)}
                  className={`w-full p-3 text-left transition-all border-2 border-transparent uppercase font-bold text-sm leading-tight flex justify-between items-center ${selectedPlayer?.playerName === player.playerName && selectedPlayer?.jerseyNumber === player.jerseyNumber
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

          <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white p-4 flex items-center gap-2">
              <Paintbrush className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Player Font</h3>
            </div>
            <div className="p-4">
              <FontSelector
                value={defaultFont}
                onChange={onFontChange}
                color={defaultColor}
                onColorChange={onColorChange}
                strokeColor={defaultStrokeColor}
                onStrokeColorChange={onStrokeColorChange}
                strokeWidth={defaultStrokeWidth}
                onStrokeWidthChange={onStrokeWidthChange}
                label="Name & Number Style"
                showPreview={true}
              />
              <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase">
                Applies to all player names and numbers
              </p>
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
                  canvasRef={canvasRef}
                />
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="xl:col-span-3">
          <div id="canvas-portal-target" className="w-full h-full min-h-[720px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative bg-gray-50 border-4 border-black overflow-hidden">
            {/* The persistent canvas from Index.tsx is portaled here */}
          </div>
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
          Continue to Preview
          <ArrowRight className="w-5 h-5 ml-3" />
        </Button>
      </div>
    </div>
  );
};