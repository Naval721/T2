import { useState, useEffect, useRef } from "react";
import { Coins, Download, User, Users, FileOutput, Loader2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Canvas as FabricCanvas, Text as FabricText, Image as FabricImage } from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerData, JerseyImages } from "@/pages/Index";
import localforage from "localforage";
import { getSizeScaleFactorFromDim, computeExportMultiplier } from "@/lib/sizes";
import { logger } from "@/lib/logger";

// Export quality constants
const EXPORT_TARGET_DPI = 450;
const EXPORT_QUALITY_MULTIPLIER = 10.42;

interface ExportPanelProps {
    canvasRef: FabricCanvas | null;
    selectedPlayer: PlayerData | null;
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
    defaultFont?: string;
    defaultColor?: string;
}

const nativeCanvasToBlobAsync = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
        }, 'image/png');
    });
};

export const ExportPanel = ({
    canvasRef,
    selectedPlayer,
    playerData,
    jerseyImages,
    defaultFont = 'Anton',
    defaultColor = '#000000',
}: ExportPanelProps) => {
    const { deductPoints, currentPoints } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [exportPlayerIndex, setExportPlayerIndex] = useState<number>(0);

    // Monitoring & Tracking States
    const [progress, setProgress] = useState(0);
    const [exportingPlayerName, setExportingPlayerName] = useState("");
    const [exportingPlayerIndexState, setExportingPlayerIndexState] = useState(0);
    const [exportingTotalPlayers, setExportingTotalPlayers] = useState(0);
    const [exportingView, setExportingView] = useState("");
    const [exportEta, setExportEta] = useState("");
    const [exportSpeed, setExportSpeed] = useState("");
    const [downloadKeys, setDownloadKeys] = useState<{key: string, fileName: string}[]>([]);
    const [isDownloadReady, setIsDownloadReady] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const isCancelRequestedRef = useRef<boolean>(false);

    // Guard tab navigation/closes
    useEffect(() => {
        if (!isExporting) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Export is in progress. Are you sure you want to leave?";
            return e.returnValue;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isExporting]);

    useEffect(() => {
        if (selectedPlayer && playerData.length > 0) {
            const idx = playerData.findIndex(p => p.playerName === selectedPlayer.playerName && p.jerseyNumber === selectedPlayer.jerseyNumber);
            setExportPlayerIndex(Math.max(0, idx));
        }
    }, [selectedPlayer, playerData]);

    const activeExportPlayer = playerData[exportPlayerIndex] || selectedPlayer || null;

    const viewKeys = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'] as const;
    const viewsAvailable = viewKeys.filter(view => !!(jerseyImages as any)[view]).length;

    const getQualityMultiplier = () => EXPORT_QUALITY_MULTIPLIER;
    const getTargetDpi = () => EXPORT_TARGET_DPI;

    const generateFileName = (player: PlayerData, suffix: string, format: string, seqIndex?: number) => {
        const pad = (n: number, total: number) => String(n).padStart(String(total).length, '0');
        const seq = seqIndex !== undefined ? `${pad(seqIndex, playerData.length)}_` : '';
        const sanitize = (s: string) => s.replace(/[^a-z0-9]/gi, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
        const parts = [sanitize(player.playerName), `NO.${player.jerseyNumber}`, `SZ.${player.size}`];
        if (suffix) parts.push(suffix);
        return `${seq}${parts.join('_')}.${format}`;
    };

    const getDesignBounds = (canvas: FabricCanvas, nameFilter?: string[]) => {
        const designObjects = canvas.getObjects().filter(obj => {
            if (!obj.visible) return false;
            const name = (obj as any).name as string | undefined;
            if (nameFilter) return name && nameFilter.includes(name);
            return name === 'jerseyFront' || name === 'jerseyBack' || name === 'leftSleeve' || name === 'rightSleeve' || name === 'collar' || name === 'playerName' || name === 'jerseyNumber' || name === 'customText' || name === 'customLogo' || (!name && (obj as any).src);
        });

        if (designObjects.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        designObjects.forEach(obj => {
            const rect = obj.getBoundingRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.left + rect.width);
            maxY = Math.max(maxY, rect.top + rect.height);
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    };

    const runExportSequence = async (type: 'playerPack' | 'teamPack') => {
        if (!canvasRef || !selectedPlayer || playerData.length === 0) {
            toast.error("Required data is missing.");
            return;
        }

        const views = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'] as const;
        const viewsPerPlayer = views.filter(view => !!(jerseyImages as any)[view]).length;
        if (viewsPerPlayer === 0) {
            toast.error("No jersey images uploaded to export.");
            return;
        }

        const playersToExport = type === 'teamPack' ? playerData : (activeExportPlayer ? [activeExportPlayer] : []);
        if (playersToExport.length === 0) {
            toast.error("No player selected.");
            return;
        }

        const totalPlayers = playersToExport.length;
        const totalCost = type === 'playerPack' ? viewsPerPlayer : totalPlayers * viewsPerPlayer;

        if (currentPoints < totalCost) {
            toast.error("Insufficient points! Please buy more points.");
            return;
        }

        // Initialize state for progress tracking overlay
        setProgress(0);
        setExportingPlayerName("");
        setExportingPlayerIndexState(0);
        setExportingTotalPlayers(totalPlayers);
        setExportingView("");
        setExportEta("Estimating...");
        setExportSpeed("Calculating...");
        setDownloadKeys([]);
        setIsDownloadReady(false);
        setIsDownloadingAll(false);
        isCancelRequestedRef.current = false;
        setIsExporting(true);
        (canvasRef as any).__isExporting = true;
        let pointsDeducted = false;

        const startTime = Date.now();
        const totalSteps = totalPlayers * viewsPerPlayer;

        let originalVT: any;

        try {
            // === DEDUCT POINTS UPFRONT ===
            const result = await deductPoints(totalCost, `Export: ${type}`);
            if (!result.success) throw new Error(`Payment failed: ${result.error || 'insufficient balance'}`);
            pointsDeducted = true;

            let exportedCount = 0;

            originalVT = canvasRef.viewportTransform?.slice();
            canvasRef.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const globalTemplate: any = await localforage.getItem('jerseyDesigner:globalTemplate') || {};

            // Cache background images and logos to massively reduce network/parsing load
            const bgCache = new Map<string, FabricImage>();
            const logoCache = new Map<string, FabricImage>();

            // === CHUNKED ZIP STRATEGY ===
            // For team packs with many players, we split into batches of 10 players per zip
            // to prevent the browser from running out of memory when compiling one massive zip.
            const BATCH_SIZE = 10;
            const isTeamPack = type === 'teamPack' && playersToExport.length > 1;
            const totalBatches = isTeamPack ? Math.ceil(playersToExport.length / BATCH_SIZE) : 1;

            let currentZip = new JSZip();
            let batchNumber = 1;
            const tempDownloadKeys: {key: string, fileName: string}[] = [];

            for (let i = 0; i < playersToExport.length; i++) {
                if (isCancelRequestedRef.current) throw new Error("Export cancelled by user");

                const player = playersToExport[i];
                setExportingPlayerName(player.playerName);
                setExportingPlayerIndexState(i);

                const safeName = player.playerName.replace(/[^a-z0-9]/gi, '_');
                const folderName = `${String(i + 1).padStart(3, '0')}_${safeName}_#${player.jerseyNumber}`;
                const playerFolder = isTeamPack ? currentZip.folder(folderName)! : currentZip;

                for (let j = 0; j < views.length; j++) {
                    if (isCancelRequestedRef.current) throw new Error("Export cancelled by user");

                    const view = views[j];
                    const imgUrl = (jerseyImages as any)[view];
                    if (!imgUrl) continue;

                    setExportingView(view);

                    // Update dynamic metrics
                    const processedViewsCount = i * viewsPerPlayer + j;
                    const currentProgressPercent = Math.min(99, Math.round((processedViewsCount / totalSteps) * 100));
                    setProgress(currentProgressPercent);

                    const elapsedTime = Date.now() - startTime;
                    if (processedViewsCount > 0) {
                        const avgTimePerView = elapsedTime / processedViewsCount;
                        const remainingViews = totalSteps - processedViewsCount;
                        const estRemainingMs = avgTimePerView * remainingViews;
                        
                        const speedSec = (avgTimePerView / 1000).toFixed(1);
                        setExportSpeed(`${speedSec}s / view`);

                        if (estRemainingMs > 0) {
                            const totalSec = Math.round(estRemainingMs / 1000);
                            const mins = Math.floor(totalSec / 60);
                            const secs = totalSec % 60;
                            setExportEta(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
                        } else {
                            setExportEta("Finishing...");
                        }
                    }

                    try {
                        const viewData = globalTemplate[view] || {};
                        const playerKey = `jerseyDesigner:playerElements_${player.playerName}_${player.jerseyNumber}`;
                        const playerElementsData: any = await localforage.getItem(playerKey) || {};
                        const rawPlayerView = playerElementsData[view] || {};

                        const viewPlayerElements = {
                            customTexts: (rawPlayerView.customTexts !== undefined)
                                ? rawPlayerView.customTexts
                                : (viewData.customTexts || []),
                            customLogos: (rawPlayerView.customLogos !== undefined)
                                ? rawPlayerView.customLogos
                                : (viewData.customLogos || []),
                        };

                        canvasRef.clear();
                        canvasRef.backgroundColor = 'transparent';

                        let bgImg = bgCache.get(view);
                        if (!bgImg) {
                            bgImg = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' }).catch(
                                () => FabricImage.fromURL(imgUrl)
                            );
                            bgCache.set(view, bgImg as FabricImage);
                        }

                        const imgW = bgImg.width ?? 0;
                        const imgH = bgImg.height ?? 0;
                        if (imgW <= 0 || imgH <= 0) {
                            logger.warn(`Export: image dimensions are 0 for view "${view}", skipping`);
                            continue;
                        }

                        const isCollar = view === 'collar';
                        const isSleeve = view === 'leftSleeve' || view === 'rightSleeve';
                        const maxW = isCollar ? 560 : isSleeve ? 400 : 640;
                        const maxH = isCollar ? 206 : isSleeve ? 400 : 514;
                        const scale = Math.min(maxW / imgW, maxH / imgH);

                        bgImg.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: isCollar ? 'top' : 'center',
                            left: 480,
                            top: isCollar ? 154 : 360,
                            selectable: false,
                        });

                        const bgName = view === 'front' ? 'jerseyFront'
                            : view === 'back' ? 'jerseyBack'
                                : view;
                        (bgImg as any).name = bgName;
                        canvasRef.add(bgImg);
                        canvasRef.sendObjectToBack(bgImg);

                        if (view === 'back') {
                            const br = bgImg.getBoundingRect();
                            const backCX = br.left + br.width / 2;
                            const np = viewData.name; const nump = viewData.number;

                            const nameText = new FabricText(player.playerName, {
                                ...(np || {}), text: player.playerName,
                                left: np?.left ?? backCX, top: np?.top ?? (br.top + br.height * 0.26),
                                fontSize: np?.fontSize ?? 38, fontFamily: np?.fontFamily ?? defaultFont, fill: np?.fill ?? defaultColor, originX: 'center', originY: 'center', selectable: false, objectCaching: false
                            });
                            (nameText as any).name = 'playerName'; canvasRef.add(nameText);

                            const numText = new FabricText(player.jerseyNumber, {
                                ...(nump || {}), text: player.jerseyNumber,
                                left: nump?.left ?? backCX, top: nump?.top ?? (br.top + br.height * 0.52),
                                fontSize: nump?.fontSize ?? 115, fontFamily: nump?.fontFamily ?? defaultFont, fill: nump?.fill ?? defaultColor, originX: 'center', originY: 'center', selectable: false, objectCaching: false
                            });
                            (numText as any).name = 'jerseyNumber'; canvasRef.add(numText);
                        }

                        for (const ct of (viewPlayerElements.customTexts || [])) {
                            const t = new FabricText(ct.text ?? '', { ...ct, selectable: false, objectCaching: false });
                            (t as any).name = 'customText'; canvasRef.add(t);
                        }
                        for (const cl of (viewPlayerElements.customLogos || [])) {
                            try {
                                if (!cl.src) continue;
                                let logoImg = logoCache.get(cl.src);
                                if (!logoImg) {
                                    logoImg = await FabricImage.fromURL(cl.src);
                                    logoCache.set(cl.src, logoImg as FabricImage);
                                }
                                
                                const clonedLogo = await logoImg!.clone();
                                clonedLogo.set({ ...cl, selectable: false });
                                (clonedLogo as any).name = 'customLogo'; 
                                canvasRef.add(clonedLogo);
                            } catch (e) { logger.warn('Logo load failed', e); }
                        }

                        canvasRef.renderAll();
                        // ⚡ Yield to main thread so progress UI can update smoothly
                        await new Promise(r => setTimeout(r, 20));

                        const bounds = getDesignBounds(canvasRef);
                        if (!bounds) {
                            const fallback = bgImg.getBoundingRect();
                            if (!fallback || fallback.width <= 0 || fallback.height <= 0) {
                                logger.warn(`Export: no bounds for view "${view}", skipping`);
                                continue;
                            }
                            Object.assign(fallback, {
                                left: Math.max(0, fallback.left),
                                top: Math.max(0, fallback.top),
                            });
                            const fallbackOptions = { left: fallback.left, top: fallback.top, width: fallback.width, height: fallback.height };
                            const htmlCanvas = canvasRef.toCanvasElement(1, fallbackOptions);
                            const blob = await nativeCanvasToBlobAsync(htmlCanvas);
                            playerFolder.file(`${view}.png`, blob);
                            exportedCount++;
                            continue;
                        }

                        let multiplier = getQualityMultiplier() * getSizeScaleFactorFromDim(player.size);
                        if (view === 'front' || view === 'back') {
                            multiplier = computeExportMultiplier(player.size, bounds.width, getTargetDpi());
                        }

                        const exportOptions = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
                        const htmlCanvas = canvasRef.toCanvasElement(multiplier, exportOptions);
                        const blob = await nativeCanvasToBlobAsync(htmlCanvas);
                        playerFolder.file(`${view}.png`, blob);
                        exportedCount++;
                    } catch (e) {
                        logger.error('Export failed for view', view, e);
                    }
                }

                // === FLUSH BATCH TO DISK ===
                // Every BATCH_SIZE players (or at the end), compile this chunk and download it.
                // This prevents holding hundreds of images in memory at once.
                const isLastPlayer = i === playersToExport.length - 1;
                const isBatchComplete = isTeamPack && ((i + 1) % BATCH_SIZE === 0);

                if (isBatchComplete || isLastPlayer) {
                    if (isCancelRequestedRef.current) throw new Error("Export cancelled by user");

                    const batchLabel = totalBatches > 1
                        ? `Part${String(batchNumber).padStart(2, '0')}_of_${totalBatches}`
                        : '';
                    const fileName = totalBatches > 1
                        ? `GxDrip_ROSTER_${batchLabel}_${Date.now()}.zip`
                        : `GxDrip_${type.toUpperCase()}_${Date.now()}.zip`;

                    setExportEta(totalBatches > 1
                        ? `Saving Part ${batchNumber} of ${totalBatches}...`
                        : 'Saving...');

                    const zipBlob = await currentZip.generateAsync({ type: "blob", compression: "STORE" });
                    
                    const tempKey = `temp_export_zip_${Date.now()}_${batchNumber}`;
                    await localforage.setItem(tempKey, zipBlob);
                    tempDownloadKeys.push({ key: tempKey, fileName });

                    batchNumber++;

                    // Free memory: discard old zip and create fresh one for next batch
                    if (!isLastPlayer) {
                        currentZip = new JSZip();
                        // Brief pause to let GC reclaim memory and browser save the file
                        await new Promise(r => setTimeout(r, 300));
                    }
                }
            }

            if (isCancelRequestedRef.current) throw new Error("Export cancelled by user");

            canvasRef.setViewportTransform(originalVT as any);

            // Restore original active canvas state
            // Emit event so DesignCanvas reloads its proper active view and elements
            window.dispatchEvent(new CustomEvent('jerseyDesigner:forceReloadView'));

            canvasRef.requestRenderAll();

            if (exportedCount === 0) throw new Error("No views exported.");

            setProgress(100);
            setExportEta("Done!");

            const partsMsg = totalBatches > 1 ? ` (${totalBatches} zip files)` : '';
            toast.success(`Pack ready! ${exportedCount} files exported${partsMsg} (${totalCost} pts).`);
            
            setDownloadKeys(tempDownloadKeys);
            setIsDownloadReady(true);
            (canvasRef as any).__isExporting = false;

        } catch (e: any) {
            logger.error('Outer Export Failed', e);
            if (pointsDeducted && e.message !== "Export cancelled by user") {
                // If it crashed but they already paid upfront, refund them
                await deductPoints(-totalCost, "Refund: Failed Export");
                toast.info("Points refunded due to export failure.");
            }

            if (e.message === "Export cancelled by user") {
                if (pointsDeducted) {
                    await deductPoints(-totalCost, "Refund: Cancelled Export");
                }
                toast.info("Export batch cancelled successfully. Zero points deducted.");
                
                // Restore original canvas view transform even on cancel
                if (originalVT) {
                    canvasRef.setViewportTransform(originalVT);
                    canvasRef.requestRenderAll();
                }
                setIsExporting(false);
            } else {
                toast.error(`Export Failed: ${e.message}`);
                setIsExporting(false);
            }
            (canvasRef as any).__isExporting = false;
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloadingAll(true);
        try {
            for (const { key, fileName } of downloadKeys) {
                const blob = await localforage.getItem<Blob>(key);
                if (blob) {
                    saveAs(blob, fileName);
                    // 500ms delay to prevent browser from blocking multiple file downloads
                    await new Promise(r => setTimeout(r, 500));
                }
                // Clean up memory after successful download trigger
                await localforage.removeItem(key);
            }
            toast.success("All parts downloaded!");
        } catch (e: any) {
            logger.error("Failed to download all parts", e);
            toast.error("Failed to download all parts. Some might be missing.");
        } finally {
            setIsDownloadingAll(false);
            setIsDownloadReady(false);
            setIsExporting(false);
            setDownloadKeys([]);
        }
    };

    const handleCancelExport = () => {
        if (isDownloadReady) {
            // They cancelled from the Download Ready screen, just clean up DB and close
            downloadKeys.forEach(k => localforage.removeItem(k.key));
            setIsDownloadReady(false);
            setIsExporting(false);
            setDownloadKeys([]);
        } else {
            isCancelRequestedRef.current = true;
        }
    };

    return (
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

            {/* Theme Accurate Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-black">
                <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-widest text-black flex items-center gap-3">
                        <FileOutput className="w-8 h-8" /> Downloads
                    </h3>
                    <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Auto-scaled to 450 DPI Print-Ready PNGs</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Coins className="w-6 h-6 text-black" />
                    <span className="font-black text-sm uppercase text-black tracking-widest">Balance:</span>
                    <span className="font-mono text-2xl font-black text-black">
                        {currentPoints} <span className="text-sm">PTS</span>
                    </span>
                </div>
            </div>

            {/* The 2 Interactive Theme Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Option 1: Selected Player Only */}
                <div className="group flex flex-col p-8 border-4 border-black bg-white hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6">
                        <User className="w-8 h-8" />
                    </div>

                    <h4 className="text-3xl font-black uppercase tracking-tight text-black mb-4">
                        Player Pack
                    </h4>

                    <p className="font-medium text-gray-500 leading-relaxed mb-6 h-[72px]">
                        Isolates the selected player and exports all available custom views into a ZIP file.
                    </p>

                    <div className="w-full mb-8">
                        <Select
                            value={exportPlayerIndex.toString()}
                            onValueChange={(val) => setExportPlayerIndex(parseInt(val))}
                        >
                            <SelectTrigger className="w-full h-14 bg-white border-2 border-black rounded-none font-bold text-black focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider">
                                <SelectValue placeholder="Select a player" />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                {playerData.map((player, idx) => (
                                    <SelectItem key={idx} value={idx.toString()} className="font-bold cursor-pointer py-3 uppercase">
                                        <span className="opacity-50 mr-2 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</span>
                                        {player.playerName} <span className="text-gray-400 ml-1">#{player.jerseyNumber}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-auto flex items-end justify-between w-full pt-6 border-t-4 border-black">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-black tracking-widest uppercase mb-1">Cost</span>
                            <span className="font-mono text-2xl font-black text-white bg-black px-3 py-1">{viewsAvailable} PTS</span>
                        </div>
                        <button
                            onClick={() => runExportSequence('playerPack')}
                            disabled={isExporting}
                            className="flex items-center justify-center h-14 px-6 bg-black text-white border-2 border-black font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                        >
                            <Download className="w-5 h-5 mr-3" /> Execute
                        </button>
                    </div>
                </div>

                {/* Option 2: The Full Roster */}
                <div className="group relative flex flex-col p-8 border-4 border-black bg-white hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                    <div className="absolute -top-4 right-6 bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        Most Popular
                    </div>

                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6">
                        <Users className="w-8 h-8" />
                    </div>

                    <h4 className="text-3xl font-black uppercase tracking-tight text-black mb-4">
                        Full Roster
                    </h4>

                    <p className="font-medium text-gray-500 leading-relaxed mb-8 h-[72px]">
                        Fully automated mass-production. Generates all available views for every single player instantly into a master ZIP.
                    </p>

                    <div className="mt-auto flex items-end justify-between w-full pt-6 border-t-4 border-black">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-black tracking-widest uppercase mb-1">Total Cost</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-2xl font-black text-white bg-black px-3 py-1">{playerData.length * viewsAvailable} PTS</span>
                                <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-black px-2 py-1">
                                    {viewsAvailable} PTS / Player
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => runExportSequence('teamPack')}
                            disabled={isExporting}
                            className="flex items-center justify-center h-14 px-6 bg-black text-white border-2 border-black font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                        >
                            <Download className="w-5 h-5 mr-3" /> Batch Output
                        </button>
                    </div>
                </div>

            </div>

            {/* Premium Fullscreen Glassmorphism Export Progress Modal */}
            {isExporting && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full max-w-xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative space-y-6">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b-4 border-black">
                            <h3 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-black" /> Batch Processing...
                            </h3>
                            <span className="font-mono bg-black text-white px-3 py-1 text-sm font-black uppercase tracking-wider">
                                {progress}% Done
                            </span>
                        </div>

                        {/* Stats Roster Info */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500">
                                <span>Active Player</span>
                                <span>View</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black font-mono">
                                        {exportingPlayerIndexState + 1}
                                    </div>
                                    <div>
                                        <div className="font-black text-lg uppercase text-black max-w-[240px] truncate">{exportingPlayerName || "Template"}</div>
                                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Player {exportingPlayerIndexState + 1} of {exportingTotalPlayers}</div>
                                    </div>
                                </div>
                                <div className="font-mono text-sm font-black uppercase bg-black text-white px-3 py-1 tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]">
                                    {exportingView.toUpperCase() || "READY"}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="w-full h-6 border-2 border-black bg-gray-100 overflow-hidden relative">
                                <div 
                                    className="h-full bg-black transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Time Stats */}
                        {isDownloadReady ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border-4 border-black">
                                <h4 className="text-xl font-black uppercase tracking-widest text-black mb-4">Export Complete</h4>
                                <p className="text-sm font-bold text-gray-500 mb-6 text-center">Your files are securely held in local storage.<br />Click below to save all {downloadKeys.length} parts to your device.</p>
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={isDownloadingAll}
                                    className="w-full flex items-center justify-center h-14 bg-black text-white border-4 border-black font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                >
                                    {isDownloadingAll ? (
                                        <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> DOWNLOADING...</>
                                    ) : (
                                        <><Download className="w-5 h-5 mr-3" /> DOWNLOAD ALL PARTS</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-4 border-black p-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Time Remaining</span>
                                    <div className="flex items-center gap-2 font-mono text-xl font-black text-black">
                                        <Clock className="w-5 h-5" /> {exportEta}
                                    </div>
                                </div>
                                <div className="border-4 border-black p-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Processing Speed</span>
                                    <div className="font-mono text-xl font-black text-black">
                                        {exportSpeed || '--'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alert Information */}
                        <div className="text-xs font-black text-red-600 uppercase tracking-wider bg-red-50 border-2 border-red-500 p-3 text-center flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse text-red-500" />
                            <span>Do not close this tab or navigate away. Points will be charged ONLY upon successful download.</span>
                        </div>

                        {/* Cancel/Close Footer */}
                        <div className="pt-4 mt-6 border-t-2 border-dashed border-gray-300 flex justify-end">
                            <button
                                onClick={handleCancelExport}
                                disabled={isCancelRequestedRef.current || isDownloadingAll}
                                className="h-12 px-6 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                            >
                                {isCancelRequestedRef.current ? (
                                    <><Loader2 className="w-4 h-4 text-black hover:text-white animate-spin transition-colors" /> CANCELLING...</>
                                ) : isDownloadReady ? (
                                    <><XCircle className="w-4 h-4 text-black hover:text-white transition-colors" /> CLOSE</>
                                ) : (
                                    <><XCircle className="w-4 h-4 text-red-500 hover:text-white transition-colors" /> CANCEL EXPORT</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};