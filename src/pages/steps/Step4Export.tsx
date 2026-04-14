import { useState } from "react";
import { ExportPanel } from "@/components/ExportPanel";
import { PremiumGate } from "@/components/auth/PremiumGate";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, LayoutGrid, Crown, User } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import type { PlayerData, JerseyImages } from "@/pages/Index";

// Feature Images
import dualPreviewImg from "@/assets/images/features/dual-preview.png";
import liveCountImg from "@/assets/images/features/live-count.png";
import hqOutputImg from "@/assets/images/features/hq-output.png";
import designsImg from "@/assets/images/features/designs.png";

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
    onPlayerSelect,
}: Step4ExportProps) => {
    // Allow local selection in case onPlayerSelect is not provided
    const [localSelected, setLocalSelected] = useState<PlayerData | null>(null);

    const currentPlayer =
        localSelected || selectedPlayer || (playerData.length > 0 ? playerData[0] : null);

    const handleSelectPlayer = (player: PlayerData) => {
        setLocalSelected(player);
        if (onPlayerSelect) onPlayerSelect(player);
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            <div className="space-y-12 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header Section */}
                <div className="flex flex-col items-center justify-center space-y-8 border-b-4 border-black pb-12">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
                        <div className="relative w-24 h-24 bg-white border-4 border-black flex items-center justify-center">
                            <Check className="w-12 h-12 stroke-[3]" />
                        </div>
                    </div>

                    <div className="text-center space-y-4 max-w-3xl">
                        <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
                            Ready to<br />Export
                        </h2>
                        <p className="text-xl font-medium text-gray-600 max-w-lg mx-auto leading-relaxed border-l-4 border-black pl-6 text-left">
                            Select a player from the roster, then use the Export Panel to download individual or bulk production files.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-black text-white border-2 border-black font-bold text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">
                            <LayoutGrid className="w-4 h-4" />
                            <span>{playerData.length} Items</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-white text-black border-2 border-black font-bold text-sm tracking-widest uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-default">
                            <Crown className="w-4 h-4" />
                            <span>Premium Batch</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    {/* Left Column - Main Content */}
                    <div className="xl:col-span-8 space-y-10">

                        {/* Player Selector — Now Interactive */}
                        <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                            <div className="p-6 border-b-4 border-black bg-black text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <User className="w-8 h-8" />
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-wider">Player Roster</h3>
                                        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Click a player to select for export</p>
                                    </div>
                                </div>
                                <div className="font-mono text-2xl font-bold">
                                    {String(playerData.length).padStart(2, '0')}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50">
                                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {playerData.map((player, index) => {
                                        const isSelected = currentPlayer === player;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleSelectPlayer(player)}
                                                className={`group relative p-6 cursor-pointer transition-all duration-200 border-2 flex items-center justify-between w-full text-left ${isSelected
                                                        ? 'border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                                                        : 'border-transparent bg-white hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`text-4xl font-black font-mono transition-colors ${isSelected ? 'text-black' : 'text-gray-200 group-hover:text-gray-500'}`}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xl uppercase tracking-tight">
                                                            {player.playerName}
                                                        </div>
                                                        <div className="text-sm font-mono text-gray-500 mt-1">
                                                            NO. {player.jerseyNumber} <span className="mx-2">/</span> SIZE {player.size}
                                                            {player.position && <><span className="mx-2">/</span>{player.position}</>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="bg-black text-white p-2 flex-shrink-0">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Export Panel Integration */}
                        <PremiumGate
                            feature="Export & Download"
                            description="Unlock full resolution export capabilities"
                        >
                            <div className="border-4 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                                <ExportPanel
                                    canvasRef={canvasRef}
                                    selectedPlayer={currentPlayer}
                                    playerData={playerData}
                                    jerseyImages={jerseyImages}
                                />
                            </div>
                        </PremiumGate>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* Specs Card */}
                        <div className="border-4 border-black bg-black text-white p-8">
                            <h3 className="text-3xl font-black uppercase mb-8 border-b-2 border-white pb-4">
                                Specs
                            </h3>
                            <div className="space-y-6 font-mono text-sm">
                                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">STATUS</span>
                                    <span className="font-bold text-green-400">READY</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">FORMAT</span>
                                    <span className="font-bold">PNG (RASTER)</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">QUALITY</span>
                                    <span className="font-bold">UP TO 600 DPI</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">LICENSE</span>
                                    <span className="font-bold">COMMERCIAL</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">SELECTED</span>
                                    <span className="font-bold text-yellow-400 truncate max-w-[120px]">
                                        {currentPlayer?.playerName || 'NONE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Feature Capabilities Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { img: dualPreviewImg, title: 'Dual Preview', desc: 'Front & Back views' },
                                { img: liveCountImg, title: 'Live Tracking', desc: 'Real-time processing' },
                                { img: hqOutputImg, title: 'HQ Output', desc: 'Print-ready export' },
                                { img: designsImg, title: 'Asset Library', desc: 'Vector collection' },
                            ].map((feat, i) => (
                                <div key={i} className="border-2 border-black p-3 bg-white hover:bg-black hover:text-white transition-all group cursor-default">
                                    <div className="aspect-[4/3] mb-3 overflow-hidden border border-gray-200 group-hover:border-gray-700 bg-gray-50 flex items-center justify-center">
                                        <img
                                            src={feat.img}
                                            alt={feat.title}
                                            className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:mix-blend-normal transition-all"
                                        />
                                    </div>
                                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">{feat.title}</h4>
                                    <p className="text-[10px] font-mono leading-tight opacity-70">{feat.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Note Card */}
                        <div className="border-2 border-black bg-yellow-50 p-6 relative">
                            <div className="absolute -top-3 left-6 bg-white border-2 border-black px-2 py-0.5 text-xs font-bold uppercase">
                                Important
                            </div>
                            <p className="font-medium text-sm leading-relaxed">
                                Switch views on the canvas before exporting individual components (sleeves/collar). For bulk export, all 5 views are auto-generated from the saved template. Ensure names and numbers are correct before initiating.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4 pt-8">
                            <Button
                                onClick={onComplete}
                                className="w-full h-20 text-xl font-black uppercase tracking-widest bg-black text-white hover:bg-gray-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] transition-all"
                            >
                                <span className="flex flex-col items-center">
                                    <span>New Project</span>
                                    <span className="text-xs font-normal opacity-50 tracking-normal normal-case">Start over from scratch</span>
                                </span>
                            </Button>

                            <Button
                                onClick={onPrev}
                                variant="outline"
                                className="w-full h-14 text-sm font-bold uppercase tracking-widest border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Return to Editor
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};