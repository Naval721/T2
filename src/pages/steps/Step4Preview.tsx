import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Image as ImageIcon } from "lucide-react";
import { Canvas as FabricCanvas, Image as FabricImage, Text as FabricText } from "fabric";
import type { PlayerData, JerseyImages } from "@/pages/Index";
import { logger } from "@/lib/logger";
import { getSizeDim, getSizeDisplayBox } from "@/lib/sizes";
import localforage from 'localforage';

interface Step4PreviewProps {
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
    onNext: () => void;
    onPrev: () => void;
    defaultFont?: string;
    defaultColor?: string;
    defaultStrokeColor?: string;
    defaultStrokeWidth?: number;
}

type ViewType = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar';

export const Step4Preview = ({ playerData, jerseyImages, onNext, onPrev, defaultFont = 'Anton', defaultColor = '#000000', defaultStrokeColor = '#FFFFFF', defaultStrokeWidth = 0 }: Step4PreviewProps) => {
    const [currentView, setCurrentView] = useState<ViewType>('front');
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);

    const views = [
        { id: 'front', label: 'Front', key: 'front' },
        { id: 'back', label: 'Back', key: 'back' },
        { id: 'leftSleeve', label: 'Left Sleeve', key: 'leftSleeve' },
        { id: 'rightSleeve', label: 'Right Sleeve', key: 'rightSleeve' },
        { id: 'collar', label: 'Collar', key: 'collar' },
    ] as const;

    useEffect(() => {
        if (!canvasElRef.current) return;

        const canvas = new FabricCanvas(canvasElRef.current, {
            width: 960,
            height: 720,
            renderOnAddRemove: false,
        });
        fabricCanvasRef.current = canvas;

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    // Generate thumbnails whenever the view changes
    useEffect(() => {
        let isCancelled = false;

        const generateThumbnails = async () => {
            if (!fabricCanvasRef.current || playerData.length === 0) return;

            // Wait 400ms to allow any pending debounced saves from Step 3 to hit localStorage
            await new Promise(resolve => setTimeout(resolve, 400));
            // Ensure any dynamic fonts (like Google Fonts) are fully loaded before rendering
            await document.fonts.ready;
            if (isCancelled) return;

            const canvas = fabricCanvasRef.current;

            setIsGenerating(true);
            setProgress(0);

            const newThumbnails: Record<string, string> = {};
            const viewUrl = (jerseyImages as Record<string, string | undefined>)[currentView];

            if (!viewUrl) {
                // No image for this view — don't wipe other views' thumbnails
                setIsGenerating(false);
                return;
            }

            try {
                // 1. Load Global Template
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const globalTemplate: any = await localforage.getItem('jerseyDesigner:globalTemplate') || {};
                const viewTemplate = globalTemplate[currentView] || {};

                // 2. Setup Base Image
                canvas.clear();
                canvas.backgroundColor = 'white'; // always white — matches print reality

                const bgImg = await FabricImage.fromURL(viewUrl, { crossOrigin: 'anonymous' }).catch(
                    () => FabricImage.fromURL(viewUrl)
                );

                // 3. Create persistent Text objects (Name & Number) with proper fallbacks
                // Note: bgImg scale will be set per-player inside the loop (size-aware).
                const np = viewTemplate.name;
                const nump = viewTemplate.number;

                const nameText = new FabricText('', {
                    ...(np || {}),
                    fontSize: np?.fontSize ?? 38,
                    fontFamily: np?.fontFamily ?? defaultFont,
                    fill: np?.fill ?? defaultColor,
                    stroke: np?.stroke ?? (defaultStrokeWidth > 0 ? defaultStrokeColor : ''),
                    strokeWidth: np?.strokeWidth ?? defaultStrokeWidth,
                    paintFirst: 'stroke',
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    objectCaching: false
                });

                const numberText = new FabricText('', {
                    ...(nump || {}),
                    fontSize: nump?.fontSize ?? 115,
                    fontFamily: nump?.fontFamily ?? defaultFont,
                    fill: nump?.fill ?? defaultColor,
                    stroke: nump?.stroke ?? (defaultStrokeWidth > 0 ? defaultStrokeColor : ''),
                    strokeWidth: nump?.strokeWidth ?? defaultStrokeWidth,
                    paintFirst: 'stroke',
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    objectCaching: false
                });

                for (let i = 0; i < playerData.length; i++) {
                    if (isCancelled) break;

                    const player = playerData[i];
                    canvas.clear();
                    canvas.backgroundColor = 'white';

                    // Size-aware scaling: compute bounding box for this player's size
                    let viewType: 'body' | 'sleeve' | 'collar' = 'body';
                    if (currentView.includes('Sleeve')) viewType = 'sleeve';
                    else if (currentView === 'collar') viewType = 'collar';

                    const { maxW, maxH } = getSizeDisplayBox(
                        player.size,
                        960,
                        720,
                        viewType,
                        (bgImg.width ?? 1) / (bgImg.height ?? 1)
                    );

                    const scaleX = maxW / (bgImg.width ?? 1);
                    const scaleY = maxH / (bgImg.height ?? 1);
                    bgImg.set({
                        scaleX: scaleX,
                        scaleY: scaleY,
                        originX: 'center',
                        originY: 'center',
                        left: 480,
                        top: currentView === 'collar' ? 154 : 360,
                        selectable: false
                    });
                    canvas.add(bgImg);

                    // Compute bounds for text positioning
                    const br = bgImg.getBoundingRect();
                    const backCX = br.left + br.width / 2;

                    // Apply Name & Number
                    if (currentView === 'back') {
                        nameText.set({ text: player.playerName, left: np?.left ?? backCX, top: np?.top ?? (br.top + br.height * 0.26) });
                        canvas.add(nameText);

                        numberText.set({ text: player.jerseyNumber, left: nump?.left ?? backCX, top: nump?.top ?? (br.top + br.height * 0.52) });
                        canvas.add(numberText);
                    } else {
                        if (viewTemplate.name) {
                            nameText.set({ text: player.playerName, left: np?.left ?? backCX, top: np?.top ?? (br.top + br.height * 0.26) });
                            canvas.add(nameText);
                        }
                        if (viewTemplate.number) {
                            numberText.set({ text: player.jerseyNumber, left: nump?.left ?? backCX, top: nump?.top ?? (br.top + br.height * 0.52) });
                            canvas.add(numberText);
                        }
                    }

                    // Apply Custom Elements for this player
                    // Fall back to globalTemplate logos/texts if the player has no per-player data
                    const playerKey = `jerseyDesigner:playerElements_${player.playerName}_${player.jerseyNumber}`;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const playerElements: any = await localforage.getItem(playerKey) || {};
                    const rawViewElements = playerElements[currentView] || {};
                    const viewElements = {
                        customTexts: (rawViewElements.customTexts !== undefined)
                            ? rawViewElements.customTexts
                            : (viewTemplate.customTexts || []),
                        customLogos: (rawViewElements.customLogos !== undefined)
                            ? rawViewElements.customLogos
                            : (viewTemplate.customLogos || []),
                    };

                    for (const ct of (viewElements.customTexts || [])) {
                        const t = new FabricText(ct.text ?? '', { ...ct, paintFirst: 'stroke', selectable: false, objectCaching: false });
                        canvas.add(t);
                    }

                    // For logos, load sequentially (this is fast if they are data URLs)
                    for (const cl of (viewElements.customLogos || [])) {
                        try {
                            const logoImg = await FabricImage.fromURL(cl.src);
                            logoImg.set({ ...cl, selectable: false });
                            canvas.add(logoImg);
                        } catch (e) {
                            logger.warn('Preview: Logo load failed', e);
                        }
                    }

                    canvas.renderAll();

                    // Generate tight cropped thumbnail around the jersey
                    const bgWidth = bgImg.getScaledWidth();
                    const bgHeight = bgImg.getScaledHeight();

                    const dataUrl = canvas.toDataURL({
                        format: 'jpeg',
                        quality: 0.85,
                        multiplier: 0.8, // Higher quality
                        left: Math.max(0, bgImg.left! - (bgWidth / 2) - 10),
                        top: Math.max(0, bgImg.top! - (bgHeight / 2) - 10),
                        width: bgWidth + 20,
                        height: bgHeight + 20
                    });

                    // Key includes view so each view has its own cached thumbnails
                    newThumbnails[`${currentView}__${player.playerName}_${player.jerseyNumber}`] = dataUrl;

                    // Update progress UI every few players to avoid freezing
                    if (i % 3 === 0) {
                        setThumbnails({ ...newThumbnails });
                        setProgress(Math.round(((i + 1) / playerData.length) * 100));
                        // Yield to main thread
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                if (!isCancelled) {
                    // Merge into existing cache so other views stay intact
                    setThumbnails(prev => ({ ...prev, ...newThumbnails }));
                    setProgress(100);
                }
            } catch (err) {
                logger.error("Failed to generate previews", err);
            } finally {
                if (!isCancelled) {
                    setIsGenerating(false);
                }
            }
        };

        generateThumbnails();

        return () => {
            isCancelled = true;
        };
    }, [currentView, playerData, jerseyImages, defaultFont, defaultColor, defaultStrokeColor, defaultStrokeWidth]);

    return (
        <Card className="flex flex-col h-[calc(100vh-140px)] border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#0f0f0f] text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-zinc-800 bg-[#1a1a1a]">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white">Preview Output</h2>
                    <p className="text-zinc-400 font-mono text-sm mt-1">
                        Verify all {playerData.length} players before exporting
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={onPrev} className="border-2 border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white rounded-none uppercase font-bold tracking-wider">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="border-2 border-white bg-white text-black hover:bg-zinc-200 rounded-none uppercase font-bold tracking-wider shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        Continue to Export
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* View Selector */}
            <div className="p-4 bg-[#111] border-b-2 border-zinc-800 flex justify-center gap-2 overflow-x-auto">
                {views.map(view => {
                    const hasImage = !!(jerseyImages as Record<string, string | undefined>)[view.key];
                    return (
                        <Button
                            key={view.id}
                            variant={currentView === view.key ? "default" : "outline"}
                            className={`rounded-none border-2 uppercase tracking-wider font-bold transition-all ${currentView === view.key
                                    ? "bg-white text-black border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                                    : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-white"
                                }`}
                            onClick={() => setCurrentView(view.key)}
                            disabled={!hasImage}
                        >
                            {view.label}
                        </Button>
                    );
                })}
            </div>

            {/* Grid Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0f0f]">
                {/* Off-screen container for thumbnail generation (Fabric wraps the canvas, so the wrapper must be off-screen) */}
                <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none opacity-0">
                    <canvas ref={canvasElRef} />
                </div>

                {isGenerating && progress < 100 && (
                    <div className="flex items-center justify-center p-4 mb-6 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-sm">
                        <Loader2 className="w-4 h-4 mr-3 animate-spin text-white" />
                        Generating accurate previews... {progress}%
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-8">
                    {playerData.map((player) => {
                        // Look up thumbnail by view + player key
                        const thumb = thumbnails[`${currentView}__${player.playerName}_${player.jerseyNumber}`];
                        return (
                            <div key={`${player.playerName}_${player.jerseyNumber}`} className="flex flex-col bg-[#1a1a1a] border-2 border-zinc-800 hover:border-zinc-500 transition-colors group">
                                <div className="aspect-[4/5] bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                                    {thumb ? (
                                        <img src={thumb} alt={`${player.playerName} preview`} className="w-full h-full object-contain scale-100 group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-zinc-700 flex flex-col items-center gap-2">
                                            <ImageIcon className="w-8 h-8 opacity-50" />
                                            <p className="text-xs text-zinc-600 font-mono uppercase tracking-wider">Rendering...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t-2 border-zinc-800 bg-[#141414]">
                                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">
                                        {player.teamName || "Team"}
                                    </div>
                                    <div className="font-bold text-white uppercase truncate flex justify-between items-center">
                                        <span className="truncate pr-2">{player.playerName}</span>
                                        <span className="text-zinc-400">#{player.jerseyNumber}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};
