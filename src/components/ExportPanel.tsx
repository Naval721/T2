import { useState, useEffect } from "react";
import { Coins, Download, User, Users, FileOutput } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Canvas as FabricCanvas, Text as FabricText, Image as FabricImage } from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerData, JerseyImages } from "@/pages/Index";
import { getSizeScaleFactorFromDim, computeExportMultiplier } from "@/lib/sizes";

interface ExportPanelProps {
    canvasRef: FabricCanvas | null;
    selectedPlayer: PlayerData | null;
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
}

const dataURLToBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

export const ExportPanel = ({
    canvasRef,
    selectedPlayer,
    playerData,
    jerseyImages,
}: ExportPanelProps) => {
    const { deductPoints, currentPoints } = useAuth();
    const [isExporting, setIsExporting] = useState(false);

    const [exportPlayerIndex, setExportPlayerIndex] = useState<number>(0);

    useEffect(() => {
        if (selectedPlayer && playerData.length > 0) {
            const idx = playerData.findIndex(p => p.playerName === selectedPlayer.playerName && p.jerseyNumber === selectedPlayer.jerseyNumber);
            setExportPlayerIndex(Math.max(0, idx));
        }
    }, [selectedPlayer, playerData]);

    const activeExportPlayer = playerData[exportPlayerIndex] || selectedPlayer || null;

    const viewKeys = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'] as const;
    const viewsAvailable = viewKeys.filter(view => !!(jerseyImages as any)[view]).length;

    const getQualityMultiplier = () => 10.42;
    const getTargetDpi = () => 450;

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

        const totalPlayers = playerData.length;
        const totalCost = type === 'playerPack' ? viewsPerPlayer : totalPlayers * viewsPerPlayer;

        if (currentPoints < totalCost) { toast.error("Insufficient points! Please buy more points."); return; }

        setIsExporting(true);
        (canvasRef as any).__isExporting = true;
        let pointsDeducted = false;

        try {
            const result = await deductPoints(totalCost, `Export: ${type}`);
            if (!result.success) throw new Error(`Payment failed: ${result.error || 'unknown reason'}`);
            pointsDeducted = true;

            const zip = new JSZip();
            const rootFolder = type === 'teamPack' ? zip.folder(`GxDrip_ROSTER_${Date.now()}`) : zip;
            let exportedCount = 0;

            const originalVT = canvasRef.viewportTransform?.slice();
            canvasRef.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const playersToExport = type === 'teamPack' ? playerData : (activeExportPlayer ? [activeExportPlayer] : []);
            if (playersToExport.length === 0) throw new Error("No player selected.");

            const rawTemplate = localStorage.getItem('jerseyDesigner:globalTemplate');
            const globalTemplate = rawTemplate ? JSON.parse(rawTemplate) : {};

            for (let i = 0; i < playersToExport.length; i++) {
                const player = playersToExport[i];
                let playerFolder = rootFolder;
                if (type === 'teamPack') {
                    const safeName = player.playerName.replace(/[^a-z0-9]/gi, '_');
                    playerFolder = rootFolder?.folder(`${String(i + 1).padStart(3, '0')}_${safeName}_#${player.jerseyNumber}`) || rootFolder;
                }

                for (const view of views) {
                    try {
                        const imgUrl = (jerseyImages as any)[view];
                        if (!imgUrl) continue;

                        const viewData = globalTemplate[view] || {};
                        const playerKey = `jerseyDesigner:playerElements_${player.playerName}_${player.jerseyNumber}`;
                        const playerElementsData = JSON.parse(localStorage.getItem(playerKey) || '{}');
                        const viewPlayerElements = playerElementsData[view] || {};

                        canvasRef.clear();
                        canvasRef.backgroundColor = 'transparent';

                        const bgImg = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' }).catch(
                            () => FabricImage.fromURL(imgUrl) // fallback without crossOrigin for blob: URLs
                        );

                        // Guard against zero/invalid image dimensions
                        const imgW = bgImg.width ?? 0;
                        const imgH = bgImg.height ?? 0;
                        if (imgW <= 0 || imgH <= 0) {
                            console.warn(`Export: image dimensions are 0 for view "${view}", skipping`);
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

                        // ⚠️ Use the EXACT names that getDesignBounds() checks for:
                        //   jerseyFront, jerseyBack, leftSleeve, rightSleeve, collar
                        const bgName = view === 'front' ? 'jerseyFront'
                            : view === 'back' ? 'jerseyBack'
                                : view; // 'leftSleeve' | 'rightSleeve' | 'collar'
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
                                fontSize: np?.fontSize ?? 38, fontFamily: np?.fontFamily ?? 'Anton', fill: np?.fill ?? '#000000', originX: 'center', originY: 'center', selectable: false
                            });
                            (nameText as any).name = 'playerName'; canvasRef.add(nameText);

                            const numText = new FabricText(player.jerseyNumber, {
                                ...(nump || {}), text: player.jerseyNumber,
                                left: nump?.left ?? backCX, top: nump?.top ?? (br.top + br.height * 0.52),
                                fontSize: nump?.fontSize ?? 115, fontFamily: nump?.fontFamily ?? 'Anton', fill: nump?.fill ?? '#000000', originX: 'center', originY: 'center', selectable: false
                            });
                            (numText as any).name = 'jerseyNumber'; canvasRef.add(numText);
                        }

                        for (const ct of (viewPlayerElements.customTexts || [])) {
                            const t = new FabricText(ct.text ?? '', { ...ct, selectable: false });
                            (t as any).name = 'customText'; canvasRef.add(t);
                        }
                        for (const cl of (viewPlayerElements.customLogos || [])) {
                            try {
                                if (!cl.src) continue;
                                const logoImg = await FabricImage.fromURL(cl.src);
                                logoImg.set({ ...cl, selectable: false });
                                (logoImg as any).name = 'customLogo'; canvasRef.add(logoImg);
                            } catch (e) { console.warn('Logo load failed', e); }
                        }

                        canvasRef.requestRenderAll();
                        // Give the browser a frame to finish painting before capturing
                        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));

                        const bounds = getDesignBounds(canvasRef);
                        if (!bounds) {
                            // Final fallback: use the bg image bounding rect directly
                            const fallback = bgImg.getBoundingRect();
                            if (!fallback || fallback.width <= 0 || fallback.height <= 0) {
                                console.warn(`Export: no bounds for view "${view}", skipping`);
                                continue;
                            }
                            // Use whole canvas if fallback is available
                            Object.assign(fallback, {
                                left: Math.max(0, fallback.left),
                                top: Math.max(0, fallback.top),
                            });
                            const dataURL = canvasRef.toDataURL({ format: 'png', quality: 1.0, multiplier: 1, left: fallback.left, top: fallback.top, width: fallback.width, height: fallback.height });
                            playerFolder?.file(`${view}.png`, dataURLToBlob(dataURL));
                            exportedCount++;
                            continue;
                        }

                        let multiplier = getQualityMultiplier() * getSizeScaleFactorFromDim(player.size);
                        if (view === 'front' || view === 'back') {
                            multiplier = computeExportMultiplier(player.size, bounds.width, getTargetDpi());
                        }

                        const dataURL = canvasRef.toDataURL({ format: 'png', quality: 1.0, multiplier, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
                        playerFolder?.file(`${view}.png`, dataURLToBlob(dataURL));
                        exportedCount++;
                    } catch (e) {
                        console.error('Export failed for view', view, e);
                    }
                }
                toast.info(`Packing ${i + 1} / ${playersToExport.length}...`);
            }

            canvasRef.setViewportTransform(originalVT as any);
            canvasRef.requestRenderAll();

            if (exportedCount === 0) throw new Error("No views exported.");

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `GxDrip_${type.toUpperCase()}_${Date.now()}.zip`);
            toast.success(`Pack ready! ${exportedCount} files exported (${totalCost} pts).`);

        } catch (e: any) {
            console.error('Outer Export Failed', e);
            toast.error(pointsDeducted ? `Failed. ${totalCost} pts refunded.` : `Export Failed: ${e.message}`);
            if (pointsDeducted) { try { await deductPoints(-totalCost, "Refund"); } catch { } }
        } finally {
            (canvasRef as any).__isExporting = false;
            setIsExporting(false);
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
        </div>
    );
};