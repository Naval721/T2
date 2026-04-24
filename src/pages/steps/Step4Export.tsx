import { ExportPanel } from "@/components/ExportPanel";
import { PremiumGate } from "@/components/auth/PremiumGate";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import type { PlayerData, JerseyImages } from "@/pages/Index";

interface Step4ExportProps {
    canvasRef: FabricCanvas | null;
    selectedPlayer: PlayerData | null;
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
    onPrev: () => void;
    onComplete: () => void;
    onPlayerSelect?: (player: PlayerData) => void;
}

export const Step4Export = ({
    canvasRef,
    selectedPlayer,
    playerData,
    jerseyImages,
    onPrev,
    onComplete,
}: Step4ExportProps) => {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col items-center py-20 px-4">
            <div className="max-w-4xl w-full space-y-12 animate-fadeIn text-center">

                {/* Theme-Consistent Clean Header */}
                <div className="space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white mb-2">
                        <CheckSquare className="w-8 h-8" />
                    </div>
                    <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
                        Ready for Print
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed border-l-4 border-black pl-4 text-left">
                        Your jersey designs are complete. Choose your production package below to instantly generate high-resolution print files.
                    </p>
                </div>

                {/* The Simplified Export Panel */}
                <div className="mx-auto max-w-4xl text-left">
                    <PremiumGate
                        feature="Export & Download"
                        description="Unlock high-resolution production assets"
                    >
                        <ExportPanel
                            canvasRef={canvasRef}
                            selectedPlayer={selectedPlayer || (playerData.length > 0 ? playerData[0] : null)}
                            playerData={playerData}
                            jerseyImages={jerseyImages}
                        />
                    </PremiumGate>
                </div>

                {/* Theme-Consistent Navigation */}
                <div className="flex justify-center gap-4 pt-12 items-center">
                    <Button
                        onClick={onPrev}
                        variant="ghost"
                        className="h-12 px-6 uppercase tracking-widest font-black text-gray-500 hover:text-black hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Editor
                    </Button>
                    <div className="w-[2px] h-8 bg-gray-300"></div>
                    <button
                        onClick={onComplete}
                        className="h-12 px-8 uppercase tracking-widest font-black bg-black text-white border-2 border-black hover:bg-transparent hover:text-black transition-all"
                    >
                        Start New Project
                    </button>
                </div>
            </div>
        </div>
    );
};