import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, Archive, LayoutTemplate, MonitorCheck, Coins } from "lucide-react";
import { Canvas as FabricCanvas, Text as FabricText, Image as FabricImage } from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerData, JerseyImages } from "@/pages/Index";
import { logger } from "@/lib/logger";
import { getSizeScaleFactorFromDim } from "@/lib/sizes";

interface ExportPanelProps {
    canvasRef: FabricCanvas | null;
    selectedPlayer: PlayerData | null;
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
}

/** Reliable dataURL to Blob converter (used consistently across all exports) */
const dataURLToBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

export const ExportPanel = ({ canvasRef, selectedPlayer, playerData, jerseyImages }: ExportPanelProps) => {
    const [exportQuality, setExportQuality] = useState<'ultra' | 'high' | 'medium'>('ultra');
    const [isExporting, setIsExporting] = useState(false);
    const { user, profile, deductPoints, addPoints, currentPoints, loading: authLoading } = useAuth();

    const getQualityMultiplier = () => {
        // Base canvas width for front/back is 640px.
        // Size 28 baseline width is 15.5 inches.
        // So for 600 DPI, target px = 15.5 * 600 = 9300 px.
        // Multiplier = 9300 / 640 = 14.53125.
        switch (exportQuality) {
            case 'ultra': return 14.53;  // Exactly 600 DPI
            case 'high': return 10.90;   // Exactly 450 DPI
            case 'medium': return 7.26;  // Exactly 300 DPI
            default: return 14.53;
        }
    };

    const getDpiLabel = () => {
        switch (exportQuality) {
            case 'ultra': return '600 DPI';
            case 'high': return '450 DPI';
            case 'medium': return '300 DPI';
        }
    };

    const getSizeScaleFactor = (sizeStr: string): number => {
        return getSizeScaleFactorFromDim(sizeStr);
    };

    const generateFileName = (
        player: PlayerData,
        suffix: string,
        format: string,
        seqIndex?: number
    ) => {
        const pad = (n: number, total: number) =>
            String(n).padStart(String(total).length, '0');
        const seq = seqIndex !== undefined ? `${pad(seqIndex, playerData.length)}_` : '';
        const sanitize = (s: string) =>
            s.replace(/[^a-z0-9]/gi, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
        const parts: string[] = [
            sanitize(player.playerName),
            `NO.${player.jerseyNumber}`,
            `SZ.${player.size}`,
        ];
        if (player.position) parts.push(sanitize(player.position));
        if (player.teamName) parts.push(sanitize(player.teamName));
        if (suffix) parts.push(suffix);
        return `${seq}${parts.join('_')}.${format}`;
    };

    /** Returns the bounding box of all visible named design objects on the canvas. */
    const getDesignBounds = (canvas: FabricCanvas, nameFilter?: string[]) => {
        const designObjects = canvas.getObjects().filter(obj => {
            if (!obj.visible) return false;
            const name = (obj as any).name as string | undefined;
            if (nameFilter) return name && nameFilter.includes(name);
            return name === 'jerseyFront' ||
                name === 'jerseyBack' ||
                name === 'leftSleeve' ||
                name === 'rightSleeve' ||
                name === 'collar' ||
                name === 'playerName' ||
                name === 'jerseyNumber' ||
                name === 'customText' ||
                name === 'customLogo' ||
                (!name && (obj as any).src);
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

    /** Swaps player name/number text on canvas WITHOUT switching full views */
    const updateCanvasPlayerText = (canvas: FabricCanvas, player: PlayerData) => {
        canvas.getObjects().forEach(obj => {
            const name = (obj as any).name;
            if (name === 'playerName') (obj as FabricText).set({ text: player.playerName });
            if (name === 'jerseyNumber') (obj as FabricText).set({ text: player.jerseyNumber });
        });
        canvas.renderAll();
    };

    // ─── EXPORT: Current view, current player ────────────────────────────────────
    const exportCurrentDesign = async () => {
        if (!canvasRef || !selectedPlayer) {
            toast.error("No design selected. Please pick a player from the roster.");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export.");
            return;
        }
        if (currentPoints < 1) {
            toast.error("Insufficient points! Please buy more points to export.");
            return;
        }

        setIsExporting(true);
        try {
            const bounds = getDesignBounds(canvasRef);
            if (!bounds) {
                toast.error("Nothing to export on the current view. Make sure a jersey view is loaded.");
                return;
            }

            // Deduct FIRST, then download
            const result = await deductPoints(1, `Exported ${selectedPlayer.playerName} – current view`);
            if (!result.success) {
                toast.error("Failed to deduct points. Please try again.");
                return;
            }

            const dataURL = canvasRef.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: getQualityMultiplier(),
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                enableRetinaScaling: false,
            });

            const blob = dataURLToBlob(dataURL);
            saveAs(blob, generateFileName(selectedPlayer, 'current_view', 'png'));
            toast.success(`Exported ${selectedPlayer.playerName} (${getDpiLabel()}) — 1 point used`);
        } catch (error) {
            toast.error("Export failed. Please try again.");
            logger.error('Single export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // ─── EXPORT: Individual sleeve (must be on that view) ────────────────────────
    const exportIndividualSleeve = async (sleeveType: 'leftSleeve' | 'rightSleeve') => {
        if (!canvasRef || !selectedPlayer) {
            toast.error("No design selected.");
            return;
        }
        if (!user) { toast.error("Please sign in to export."); return; }
        if (currentPoints < 1) { toast.error("Insufficient points!"); return; }

        setIsExporting(true);
        try {
            const label = sleeveType === 'leftSleeve' ? 'Left Sleeve' : 'Right Sleeve';
            // Try to find the sleeve on canvas first
            const sleeveOnCanvas = canvasRef.getObjects().find(o => (o as any).name === sleeveType);
            if (!sleeveOnCanvas) {
                toast.error(`${label} not on canvas. Please switch to the ${label} view in the editor first, then come back to export.`);
                return;
            }

            const bounds = getDesignBounds(canvasRef, [sleeveType, 'customText', 'customLogo']);
            if (!bounds) {
                toast.error(`No content found for ${label}.`);
                return;
            }

            const result = await deductPoints(1, `${label} export – ${selectedPlayer.playerName}`);
            if (!result.success) { toast.error("Failed to deduct points."); return; }

            const dataURL = canvasRef.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: getQualityMultiplier(),
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                enableRetinaScaling: false,
            });

            saveAs(dataURLToBlob(dataURL), generateFileName(selectedPlayer, sleeveType.toLowerCase(), 'png'));
            toast.success(`${label} exported (${getDpiLabel()}) — 1 point used`);
        } catch (e) {
            toast.error("Error exporting sleeve.");
            logger.error('Sleeve export error:', e);
        } finally {
            setIsExporting(false);
        }
    };

    // ─── EXPORT: Collar ──────────────────────────────────────────────────────────
    const exportCollar = async () => {
        if (!canvasRef || !selectedPlayer) { toast.error("No design selected."); return; }
        if (!user) { toast.error("Please sign in to export."); return; }
        if (currentPoints < 1) { toast.error("Insufficient points!"); return; }

        setIsExporting(true);
        try {
            const collarOnCanvas = canvasRef.getObjects().find(o => (o as any).name === 'collar');
            if (!collarOnCanvas) {
                toast.error("Collar not on canvas. Please switch to the Collar view in the editor first.");
                return;
            }

            const bounds = getDesignBounds(canvasRef, ['collar', 'customText']);
            if (!bounds) { toast.error("No collar content found."); return; }

            const result = await deductPoints(1, `Collar export – ${selectedPlayer.playerName}`);
            if (!result.success) { toast.error("Failed to deduct points."); return; }

            const dataURL = canvasRef.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: getQualityMultiplier(),
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                enableRetinaScaling: false,
            });

            saveAs(dataURLToBlob(dataURL), generateFileName(selectedPlayer, 'collar', 'png'));
            toast.success(`Collar exported (${getDpiLabel()}) — 1 point used`);
        } catch (e) {
            toast.error("Error exporting collar.");
            logger.error('Collar export error:', e);
        } finally {
            setIsExporting(false);
        }
    };

    // ─── PREVIEW ─────────────────────────────────────────────────────────────────
    const previewCurrentDesign = () => {
        if (!canvasRef || !selectedPlayer) return;
        const bounds = getDesignBounds(canvasRef);
        if (!bounds) { toast.error("Nothing to preview"); return; }

        const dataURL = canvasRef.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 1.5,
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            enableRetinaScaling: false,
        });
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`
        <html>
          <head><title>Preview — ${selectedPlayer.playerName}</title></head>
          <body style="margin:0;background:#1a1a1a;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${dataURL}" style="max-width:100%;height:auto;" alt="${selectedPlayer.playerName}" />
          </body>
        </html>`);
        }
    };

    // ─── STANDARD BUNDLE: Current view for all players ───────────────────────────
    const exportAllDesigns = async () => {
        if (!canvasRef || playerData.length === 0) {
            toast.error("No player data to export.");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export.");
            return;
        }
        const cost = playerData.length; // 1 point per player
        if (currentPoints < cost) {
            toast.error(`Not enough points. You need ${cost} points for a standard bundle (${playerData.length} players × 1 pt).`);
            return;
        }

        setIsExporting(true);
        let pointsDeducted = false;
        try {
            const pointsResult = await deductPoints(cost, `Standard Bundle – ${playerData.length} players`);
            if (!pointsResult.success) {
                toast.error("Transaction failed. No points were deducted.");
                return;
            }
            pointsDeducted = true;

            const zip = new JSZip();
            const folder = zip.folder("jersey_standard_bundle");
            let successCount = 0;

            for (let i = 0; i < playerData.length; i++) {
                try {
                    const player = playerData[i];
                    updateCanvasPlayerText(canvasRef, player);
                    await new Promise(r => setTimeout(r, 30)); // allow render

                    const bounds = getDesignBounds(canvasRef);
                    if (!bounds) continue;

                    const dataURL = canvasRef.toDataURL({
                        format: 'png',
                        multiplier: getQualityMultiplier(),
                        left: bounds.left,
                        top: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                    });

                    folder?.file(generateFileName(player, 'current_view', 'png', i + 1), dataURLToBlob(dataURL));
                    successCount++;
                } catch (playerErr) {
                    logger.error(`Failed to export player ${i + 1}`, playerErr);
                }
            }

            if (successCount === 0) throw new Error("No players exported successfully");

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `GxStudio_Standard_Bundle_${Date.now()}.zip`);
            toast.success(`Standard bundle: ${successCount}/${playerData.length} players exported (${cost} pts used)`);
        } catch (err) {
            logger.error('Standard bundle error:', err);
            // Attempt rollback if points were already taken
            if (pointsDeducted) {
                try {
                    await addPoints(cost, `Refund — failed standard bundle`);
                    toast.error("Export failed. Your points have been refunded.");
                } catch {
                    toast.error("Export failed. Please contact support for a points refund.");
                }
            } else {
                toast.error("Export failed. Please try again.");
            }
        } finally {
            setIsExporting(false);
        }
    };

    // ─── FULL PRODUCTION PACK: All 5 views for every player ─────────────────────
    const exportFullProductionPack = async () => {
        if (!canvasRef || playerData.length === 0) {
            toast.error("No player data to export.");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export.");
            return;
        }

        const pointsPerPlayer = 5;
        const totalCost = playerData.length * pointsPerPlayer;

        if (currentPoints < totalCost) {
            toast.error(`Not enough points. You need ${totalCost} pts (${playerData.length} players × 5 views).`);
            return;
        }

        setIsExporting(true);
        (canvasRef as any).__isExporting = true;
        let pointsDeducted = false;

        // Safe viewport transform save
        const originalVT = canvasRef.viewportTransform
            ? [...canvasRef.viewportTransform]
            : [1, 0, 0, 1, 0, 0];

        try {
            const pointsResult = await deductPoints(totalCost, `Full Production Pack — ${playerData.length} players × 5 views`);
            if (!pointsResult.success) {
                toast.error("Transaction failed. No points were deducted. Aborting.");
                return;
            }
            pointsDeducted = true;

            // Read design template from localStorage (saved by DesignCanvas on every edit)
            const globalTemplateRaw = localStorage.getItem('jerseyDesigner:globalTemplate');
            const globalTemplate = globalTemplateRaw ? JSON.parse(globalTemplateRaw) : {};

            const zip = new JSZip();
            const rootFolder = zip.folder(`GxStudio_Production_Batch_${new Date().toISOString().split('T')[0]}`);

            // Reset zoom/pan for clean exports
            canvasRef.setViewportTransform([1, 0, 0, 1, 0, 0]);

            const views = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'] as const;
            const internalNames: Record<string, string> = {
                front: 'jerseyFront', back: 'jerseyBack',
                leftSleeve: 'leftSleeve', rightSleeve: 'rightSleeve', collar: 'collar',
            };
            const viewImageUrls: Record<string, string | undefined> = {
                front: jerseyImages.front,
                back: jerseyImages.back,
                leftSleeve: jerseyImages.leftSleeve,
                rightSleeve: jerseyImages.rightSleeve,
                collar: jerseyImages.collar,
            };

            // Sizing constants matching DesignCanvas exactly
            const CANVAS_W = canvasRef.width!;
            const CANVAS_H = canvasRef.height!;
            const sizeConfig: Record<string, { maxW: number; maxH: number; originY: 'center' | 'top'; top?: number }> = {
                front: { maxW: 640, maxH: 514, originY: 'center' },
                back: { maxW: 640, maxH: 514, originY: 'center' },
                leftSleeve: { maxW: 400, maxH: 400, originY: 'center' },
                rightSleeve: { maxW: 400, maxH: 400, originY: 'center' },
                collar: { maxW: 560, maxH: 206, originY: 'top', top: 154 },
            };

            let totalExported = 0;
            const failures: string[] = [];

            for (let i = 0; i < playerData.length; i++) {
                const player = playerData[i];
                const safeName = player.playerName.replace(/[^a-z0-9]/gi, '_');
                const playerFolder = rootFolder?.folder(
                    `${String(i + 1).padStart(3, '0')}_${safeName}_#${player.jerseyNumber}`
                );

                for (const view of views) {
                    try {
                        const imgUrl = viewImageUrls[view];
                        if (!imgUrl) continue; // Skip unavailable views silently

                        const viewData = globalTemplate[view] || {};
                        const cfg = sizeConfig[view];

                        // --- Clear canvas, load fresh background ---
                        canvasRef.clear();
                        canvasRef.backgroundColor = 'transparent';

                        // Load background image — NO crossOrigin so blob: URLs work
                        const bgImg = await FabricImage.fromURL(imgUrl);
                        const scale = Math.min(cfg.maxW / bgImg.width!, cfg.maxH / bgImg.height!);
                        bgImg.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: cfg.originY,
                            left: CANVAS_W / 2,
                            top: cfg.originY === 'top' ? (cfg.top ?? CANVAS_H / 2) : CANVAS_H / 2,
                            selectable: false,
                            evented: false,
                        });
                        (bgImg as any).name = internalNames[view];
                        canvasRef.add(bgImg);
                        canvasRef.sendObjectToBack(bgImg);

                        // --- Player name / number on back view ---
                        if (view === 'back') {
                            const backRect = bgImg.getBoundingRect();
                            const backCX = backRect.left + backRect.width / 2;

                            // Use saved template positions if available, otherwise compute defaults
                            const nameProp = viewData.name;
                            const numProp = viewData.number;

                            const nameTop = nameProp?.top ?? (backRect.top + backRect.height * 0.26);
                            const numTop = numProp?.top ?? (backRect.top + backRect.height * 0.52);
                            const nameFs = nameProp?.fontSize ?? Math.max(16, Math.round(backRect.height * 0.08));
                            const numFs = numProp?.fontSize ?? Math.max(48, Math.round(backRect.height * 0.28));

                            const nameText = new FabricText(player.playerName, {
                                ...(nameProp || {}),
                                text: player.playerName,
                                left: nameProp?.left ?? backCX,
                                top: nameTop,
                                fontSize: nameFs,
                                fontFamily: nameProp?.fontFamily ?? 'Anton',
                                fill: nameProp?.fill ?? '#000000',
                                fontWeight: 'bold',
                                originX: 'center', originY: 'center',
                                selectable: false, evented: false,
                            });
                            (nameText as any).name = 'playerName';
                            canvasRef.add(nameText);

                            const numText = new FabricText(player.jerseyNumber, {
                                ...(numProp || {}),
                                text: player.jerseyNumber,
                                left: numProp?.left ?? backCX,
                                top: numTop,
                                fontSize: numFs,
                                fontFamily: numProp?.fontFamily ?? 'Anton',
                                fill: numProp?.fill ?? '#000000',
                                fontWeight: 'bold',
                                originX: 'center', originY: 'center',
                                selectable: false, evented: false,
                            });
                            (numText as any).name = 'jerseyNumber';
                            canvasRef.add(numText);
                        }

                        // --- Custom texts from template ---
                        for (const ct of (viewData.customTexts || [])) {
                            const t = new FabricText(ct.text ?? '', {
                                ...ct,
                                selectable: false, evented: false,
                            });
                            (t as any).name = 'customText';
                            canvasRef.add(t);
                        }

                        // --- Custom logos from template (NO crossOrigin — blob URLs) ---
                        for (const cl of (viewData.customLogos || [])) {
                            try {
                                if (!cl.src) continue;
                                const logoImg = await FabricImage.fromURL(cl.src);
                                logoImg.set({ ...cl, selectable: false, evented: false });
                                (logoImg as any).name = 'customLogo';
                                canvasRef.add(logoImg);
                            } catch (logoErr) {
                                logger.error('Logo load failed in bulk export:', cl.src, logoErr);
                            }
                        }

                        // Let the browser settle the render
                        canvasRef.requestRenderAll();
                        await new Promise(r => setTimeout(r, 120));

                        // --- Compute export bounds ---
                        const bounds = getDesignBounds(canvasRef);
                        if (!bounds) {
                            logger.warn(`No bounds – player ${player.playerName} view ${view}`);
                            continue;
                        }

                        // --- Calculate multiplier with safety cap ---
                        let multiplier = getQualityMultiplier() * getSizeScaleFactor(player.size);
                        const maxDim = Math.max(bounds.width, bounds.height) * multiplier;
                        if (maxDim > 12000) multiplier = 12000 / Math.max(bounds.width, bounds.height);

                        const dataURL = canvasRef.toDataURL({
                            format: 'png',
                            quality: 1.0,
                            multiplier,
                            left: bounds.left,
                            top: bounds.top,
                            width: bounds.width,
                            height: bounds.height,
                            enableRetinaScaling: false,
                        });

                        if (dataURL && dataURL.length > 200) {
                            playerFolder?.file(`${view}.png`, dataURLToBlob(dataURL));
                            totalExported++;
                        } else {
                            failures.push(`${player.playerName}/${view}`);
                        }
                    } catch (viewErr) {
                        const msg = viewErr instanceof Error ? viewErr.message : String(viewErr);
                        logger.error(`View ${view} failed for ${player.playerName}: ${msg}`);
                        failures.push(`${player.playerName}/${view}`);
                    }
                }

                // Progress toast every 5 players or on last
                if ((i + 1) % 5 === 0 || i === playerData.length - 1) {
                    toast.info(`Packing: ${i + 1} / ${playerData.length} players...`);
                }
            }

            // Restore canvas state for the user
            canvasRef.setViewportTransform(originalVT as any);
            canvasRef.requestRenderAll();

            if (totalExported === 0) {
                // Real failure — nothing exported at all
                throw new Error("No views were exported. Check that jersey images are valid and the design template has been saved.");
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `GxStudio_PRODUCTION_BATCH_${Date.now()}.zip`);

            if (failures.length > 0) {
                toast.warning(`Pack done with ${failures.length} skipped view(s). ${totalExported} files exported.`);
            } else {
                toast.success(`Production pack ready! ${totalExported} files exported (${totalCost} pts used).`);
            }

        } catch (err) {
            // Restore canvas even on failure
            try {
                canvasRef.setViewportTransform(originalVT as any);
                canvasRef.requestRenderAll();
            } catch { /* ignore */ }

            logger.error('Full production pack error:', err);
            if (pointsDeducted) {
                try {
                    await addPoints(totalCost, `Refund — failed production pack`);
                    const msg = err instanceof Error ? err.message : 'Unknown error';
                    toast.error(`Export failed: ${msg}. Your ${totalCost} points have been refunded.`);
                } catch {
                    toast.error(`Export failed. Please contact support — ${totalCost} points may need manual refund.`);
                }
            } else {
                const msg = err instanceof Error ? err.message : String(err);
                toast.error(`Export failed: ${msg}`);
            }
        } finally {
            (canvasRef as any).__isExporting = false;
            setIsExporting(false);
        }
    };


    return (
        <div className="space-y-8 p-4">
            {/* Points Balance */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black">
                <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Available Points</span>
                </div>
                <div className={`font-mono text-xl font-black ${currentPoints <= 0 && !authLoading ? 'text-red-600' : currentPoints < 5 && !authLoading ? 'text-yellow-600' : 'text-black'}`}>
                    {authLoading ? '...' : currentPoints} pts
                </div>
            </div>

            <div className="flex items-center gap-3 pb-2 border-b-2 border-dashed border-gray-300">
                <LayoutTemplate className="w-5 h-5" />
                <h3 className="text-lg font-bold uppercase tracking-wider">Export Configuration</h3>
            </div>

            {/* Quality Selector */}
            <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">Output Quality</Label>
                <Select value={exportQuality} onValueChange={(v: 'ultra' | 'high' | 'medium') => setExportQuality(v)}>
                    <SelectTrigger className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black rounded-none">
                        <SelectItem value="ultra">Ultra (600 DPI — Production Sharp)</SelectItem>
                        <SelectItem value="high">High (450 DPI — Print Quality)</SelectItem>
                        <SelectItem value="medium">Standard (300 DPI — Basic Print)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator className="bg-black" />

            {/* Single Export */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">
                        Current View Export <span className="font-normal normal-case text-gray-400">(1 pt)</span>
                    </Label>
                    <div className="font-mono text-xs font-bold bg-gray-100 px-2 py-1">
                        {selectedPlayer ? selectedPlayer.playerName : '— SELECT PLAYER —'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={previewCurrentDesign}
                        variant="outline"
                        className="w-full h-12 border-2 border-black rounded-none hover:bg-black hover:text-white transition-all uppercase font-bold text-xs tracking-widest"
                        disabled={!selectedPlayer || !canvasRef}
                    >
                        <MonitorCheck className="w-4 h-4 mr-2" />
                        Preview
                    </Button>

                    <Button
                        onClick={exportCurrentDesign}
                        disabled={!selectedPlayer || !canvasRef || isExporting || currentPoints < 1 || authLoading}
                        className="w-full h-12 bg-black text-white rounded-none border-2 border-black hover:bg-gray-800 transition-all uppercase font-bold text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Processing...' : 'Export PNG'}
                    </Button>
                </div>
            </div>

            {/* Component Exports */}
            <div className="space-y-3">
                <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">
                    Components <span className="font-normal normal-case text-gray-400">(1 pt each — must be on that view)</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        onClick={() => exportIndividualSleeve('leftSleeve')}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting || currentPoints < 1 || authLoading}
                    >
                        Left Sleeve
                    </Button>
                    <Button
                        onClick={() => exportIndividualSleeve('rightSleeve')}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting || currentPoints < 1 || authLoading}
                    >
                        Right Sleeve
                    </Button>
                    <Button
                        onClick={exportCollar}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting || currentPoints < 1 || authLoading}
                    >
                        Collar
                    </Button>
                </div>
            </div>

            <Separator className="bg-black" />

            {/* Bulk Exports */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">Bulk Actions</Label>
                    <div className="font-mono text-xs font-bold bg-black text-white px-2 py-1">ZIP ARCHIVE</div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={exportAllDesigns}
                        disabled={playerData.length === 0 || !canvasRef || isExporting || currentPoints < playerData.length || authLoading}
                        variant="outline"
                        className="w-full h-12 border-2 border-black rounded-none transition-all uppercase font-bold text-xs tracking-widest"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Standard Bundle — Current View ({playerData.length} pts)
                    </Button>

                    <p className="text-[10px] text-gray-500 font-mono italic">
                        * Exports the active canvas view for every player. Switch to the desired view before starting.
                    </p>

                    <Button
                        onClick={exportFullProductionPack}
                        disabled={playerData.length === 0 || !canvasRef || isExporting || currentPoints < playerData.length * 5 || authLoading}
                        className="w-full h-16 bg-black text-white rounded-none border-4 border-black hover:bg-gray-800 transition-all uppercase font-black tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Archive className="w-6 h-6 mr-3" />
                        {isExporting ? 'Generating Pack...' : `Full Production Pack (${playerData.length * 5} pts)`}
                    </Button>

                    <p className="text-[10px] text-black font-bold font-mono">
                        ★ BEST FOR PRINT SHOPS: All 5 views per player, organized into folders. Uses your saved design template.
                    </p>
                </div>
            </div>
        </div>
    );
};