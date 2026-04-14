import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, Archive, LayoutTemplate, MonitorCheck } from "lucide-react";
import { Canvas as FabricCanvas, Text as FabricText, Image as FabricImage } from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerData, JerseyImages } from "@/pages/Index";
import { logger } from "@/lib/logger";

interface ExportPanelProps {
    canvasRef: FabricCanvas | null;
    selectedPlayer: PlayerData | null;
    playerData: PlayerData[];
    jerseyImages: JerseyImages;
}

/** Fail-safe dataURL to Blob converter */
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
    const { user, profile, deductPoints, currentPoints } = useAuth();

    const getQualityMultiplier = () => {
        switch (exportQuality) {
            case 'ultra': return 10.0; // 600 DPI Production (Vector sharpness)
            case 'high': return 7.5; // 450 DPI
            case 'medium': return 4.5; // 300 DPI (Basic Print)
            default: return 10.0;
        }
    };

    /** Calculates a multiplier based on player size, relative to a "standard" size 30 */
    const getSizeScaleFactor = (sizeStr: string): number => {
        const size = parseInt(sizeStr, 10);
        if (isNaN(size)) return 1.0;
        // Assume size 30 is base (1.0x). Size 46 = 1.1x, Size 22 = 0.9x approx.
        return 1.0 + ((size - 30) * 0.0125);
    };

    /**
     * Build a production-ready filename.
     * Bulk exports pass `seqIndex` (1-based) so files sort correctly in Finder/Explorer.
     * Format: 001_John_Doe_NO.7_SZ.30_Forward_Falcons.png
     */
    const generateFileName = (
        player: PlayerData,
        suffix: string,
        format: string,
        seqIndex?: number
    ) => {
        const pad = (n: number, total: number) =>
            String(n).padStart(String(total).length, '0');

        const seq = seqIndex !== undefined
            ? `${pad(seqIndex, playerData.length)}_`
            : '';

        const sanitize = (s: string) => s.replace(/[^a-z0-9]/gi, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');

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
        const designObjects = canvas.getObjects().filter(object => {
            if (!object.visible) return false;
            const name = (object as any).name as string | undefined;
            if (nameFilter) {
                return name && nameFilter.includes(name);
            }
            return name === 'jerseyFront' ||
                name === 'jerseyBack' ||
                name === 'leftSleeve' ||
                name === 'rightSleeve' ||
                name === 'collar' ||
                name === 'playerName' ||
                name === 'jerseyNumber' ||
                name === 'customText' ||
                name === 'customLogo' ||
                (!name && (object as any).src);
        });

        if (designObjects.length === 0) return null;

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        designObjects.forEach(object => {
            const rect = object.getBoundingRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.left + rect.width);
            maxY = Math.max(maxY, rect.top + rect.height);
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;

        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    };

    /** Updates player name & jersey number text objects on the current canvas in-place. */
    const updateCanvasPlayerText = (canvas: FabricCanvas, player: PlayerData) => {
        canvas.getObjects().forEach(obj => {
            const name = (obj as any).name;
            if (name === 'playerName') {
                (obj as FabricText).set({ text: player.playerName });
            }
            if (name === 'jerseyNumber') {
                (obj as FabricText).set({ text: player.jerseyNumber });
            }
        });
        canvas.renderAll();
    };

    const exportCurrentDesign = async () => {
        if (!canvasRef || !selectedPlayer) {
            toast.error("No design to export");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export designs");
            return;
        }
        if (currentPoints < 1) {
            toast.error("Insufficient points! Please buy more points to continue exporting.");
            return;
        }

        setIsExporting(true);
        try {
            const bounds = getDesignBounds(canvasRef);
            if (!bounds) {
                toast.error("No design content to export");
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
                enableRetinaScaling: false
            });

            const response = await fetch(dataURL);
            const finalBlob = await response.blob();
            const fileName = generateFileName(selectedPlayer, '', 'png');

            // Secure Authorization: Deduct points BEFORE downloading
            const result = await deductPoints(1, `Exported ${selectedPlayer.playerName} jersey`);
            if (!result.success) {
                toast.error("Failed to deduct points. Please try again.");
                return;
            }

            // Execute local download
            saveAs(finalBlob, fileName);

            const dpiText = exportQuality === 'ultra' ? '600 DPI' : exportQuality === 'high' ? '450 DPI' : '300 DPI';
            toast.success(`Design exported as PNG (${dpiText}) — ${fileName}`);
        } catch (error) {
            toast.error("Failed to export design");
            logger.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * MASTER EXPORT: Full Team Production Pack
     * 1. Iterates every player.
     * 2. For each player, iterates every view (Front, Back, Sleeves, Collar).
     * 3. Calculates total points (PlayerCount * 5).
     * 4. Deducts points once.
     * 5. Generates a ZIP organized by player folders.
     */
    const exportFullProductionPack = async () => {
        if (!canvasRef || playerData.length === 0) {
            toast.error("No data to export");
            return;
        }
        if (!user) {
            toast.error("Sign in required");
            return;
        }

        // Calculate expected cost: 5 points per player for a full production set
        const pointsPerPlayer = 5;
        const totalPointsNeeded = playerData.length * pointsPerPlayer;

        if (currentPoints < totalPointsNeeded) {
            toast.error(`Insufficient points. You need ${totalPointsNeeded} points for a full production team pack.`);
            return;
        }

        setIsExporting(true);
        (canvasRef as any).__isExporting = true;
        const zip = new JSZip();
        const rootFolder = zip.folder(`GxStudio_Production_Batch_${new Date().toISOString().split('T')[0]}`);

        try {
            // Early deduction to secure the credit transaction
            const pointsResult = await deductPoints(totalPointsNeeded, `Full Team Production Pack — ${playerData.length} players x 5 views`);
            if (!pointsResult.success) {
                toast.error("Transaction failed. Aborting.");
                setIsExporting(false);
                return;
            }

            toast.info(`Generating production ZIP for ${playerData.length} players. Please wait...`);

            // We need access to the canvas's internal loader to switch views
            // Since we are in ExportPanel, we'll try to trigger view switches 
            // via whatever mechanism is available or assume the user is okay with the flicker.

            // Helper to get image URL for a view
            const getViewUrl = (view: string) => {
                switch (view) {
                    case 'front': return jerseyImages.front;
                    case 'back': return jerseyImages.back;
                    case 'leftSleeve': return jerseyImages.leftSleeve;
                    case 'rightSleeve': return jerseyImages.rightSleeve;
                    case 'collar': return jerseyImages.collar;
                    default: return null;
                }
            };

            const views = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'];
            const internalNames: Record<string, string> = {
                front: 'jerseyFront',
                back: 'jerseyBack',
                leftSleeve: 'leftSleeve',
                rightSleeve: 'rightSleeve',
                collar: 'collar'
            };

            const globalTemplateRaw = localStorage.getItem('jerseyDesigner:globalTemplate');
            const globalTemplate = globalTemplateRaw ? JSON.parse(globalTemplateRaw) : {};
            const originalVT = [...canvasRef.viewportTransform!];
            canvasRef.setViewportTransform([1, 0, 0, 1, 0, 0]);

            for (let i = 0; i < playerData.length; i++) {
                const player = playerData[i];
                const playerFolder = rootFolder?.folder(`${String(i + 1).padStart(3, '0')}_${player.playerName.replace(/\s+/g, '_')}_#${player.jerseyNumber}`);

                // Update text once for the player
                updateCanvasPlayerText(canvasRef, player);

                try {
                    for (const view of views) {
                        try {
                            const imgUrl = getViewUrl(view);
                            if (!imgUrl) continue;

                            const viewData = globalTemplate[view] || {};

                            // 1. Clear ALL existing custom objects before rendering new view
                            const allObjects = canvasRef.getObjects();
                            allObjects.forEach(obj => {
                                const n = (obj as any).name;
                                // Keep only the "jersey" background image we just added and the base player text
                                if (n !== internalNames[view] && n !== 'playerName' && n !== 'jerseyNumber') {
                                    canvasRef.remove(obj);
                                }
                            });

                            // 2. Load the Jersey Background
                            const bgObj = canvasRef.getObjects().find(o => (o as any).name === internalNames[view]);
                            if (!bgObj) {
                                try {
                                    const imgLoader = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' });
                                    imgLoader.set({
                                        left: canvasRef.width! / 2,
                                        top: canvasRef.height! / 2,
                                        originX: 'center',
                                        originY: 'center',
                                        selectable: false,
                                        evented: false
                                    });
                                    (imgLoader as any).name = internalNames[view];
                                    canvasRef.add(imgLoader);
                                    canvasRef.sendObjectToBack(imgLoader);
                                } catch (bgLoadErr) {
                                    logger.error(`Failed to load background for ${view}:`, bgLoadErr);
                                    continue;
                                }
                            }

                            // 3. Load Custom Texts for this view
                            if (viewData.customTexts) {
                                viewData.customTexts.forEach((ct: any) => {
                                    const textObj = new FabricText(ct.text, {
                                        ...ct,
                                        selectable: false,
                                        evented: false
                                    });
                                    (textObj as any).name = 'customText';
                                    canvasRef.add(textObj);
                                });
                            }

                            // 4. Load Custom Logos for this view
                            if (viewData.customLogos) {
                                for (const cl of viewData.customLogos) {
                                    try {
                                        const logoImg = await FabricImage.fromURL(cl.src, { crossOrigin: 'anonymous' });
                                        logoImg.set({
                                            ...cl,
                                            selectable: false,
                                            evented: false
                                        });
                                        (logoImg as any).name = 'customLogo';
                                        canvasRef.add(logoImg);
                                    } catch (e) {
                                        logger.error('Logo load fail in export:', cl.src);
                                    }
                                }
                            }

                            // Visibility toggles for player text (Only on Back)
                            const nameObj = canvasRef.getObjects().find(o => (o as any).name === 'playerName');
                            const numObj = canvasRef.getObjects().find(o => (o as any).name === 'jerseyNumber');
                            if (nameObj) {
                                nameObj.visible = (view === 'back');
                                nameObj.setCoords();
                            }
                            if (numObj) {
                                numObj.visible = (view === 'back');
                                numObj.setCoords();
                            }

                            canvasRef.requestRenderAll();
                            // VERY IMPORTANT: Allow a micro-tick for the browser to finalize rendering large images
                            await new Promise(resolve => setTimeout(resolve, 50));
                            canvasRef.calcOffset();

                            const bounds = getDesignBounds(canvasRef);
                            if (!bounds) {
                                logger.warn(`No bounds found for player ${player.playerName} view ${view}`);
                                continue;
                            }

                            // RESOLUTION SAFEGUARD: Cap total dimension to 7000px for stability
                            let multiplier = getQualityMultiplier() * getSizeScaleFactor(player.size);
                            const currentComplexityMultiplier = (view === 'front' || view === 'back') ? 1 : 0.6; // Scale down sleeves slightly to save memory
                            multiplier *= currentComplexityMultiplier;

                            const maxDim = Math.max(bounds.width, bounds.height) * multiplier;
                            if (maxDim > 7000) {
                                multiplier = 7000 / Math.max(bounds.width, bounds.height);
                            }

                            const dataURL = canvasRef.toDataURL({
                                format: 'png',
                                quality: 1.0,
                                multiplier: multiplier,
                                left: bounds.left,
                                top: bounds.top,
                                width: bounds.width,
                                height: bounds.height,
                                enableRetinaScaling: false // Explicitly disable to maintain absolute control
                            });

                            if (dataURL && dataURL.length > 20) {
                                try {
                                    const blob = dataURLToBlob(dataURL);
                                    playerFolder?.file(`${view}.png`, blob);
                                } catch (blobErr) {
                                    logger.error(`Blob conversion failed for ${player.playerName} / ${view}`, blobErr);
                                }
                            }
                        } catch (viewErr) {
                            logger.error(`Individual view export failed for player ${player.playerName} view ${view}`, viewErr);
                        }
                    }
                } catch (playerErr) {
                    logger.error(`Full player export failed for ${player.playerName}`, playerErr);
                }

                if ((i + 1) % 2 === 0 || i === playerData.length - 1) {
                    toast.info(`Progress: ${i + 1} / ${playerData.length} players packed...`);
                }
            }

            // RESTORE Viewport for the user
            canvasRef.setViewportTransform(originalVT as any);
            canvasRef.requestRenderAll();

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `GxStudio_FULL_PRODUCTION_BATCH_${new Date().getTime()}.zip`);
            toast.success("Full Team Production Pack generated successfully!");

        } catch (error) {
            logger.error('Full batch error:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            toast.error(`Export Failed: ${errMsg}`);
        } finally {
            setIsExporting(false);
        }
    };

    const exportAllDesigns = async () => {
        // Keeping the old method but improving it slightly to be "Standard Zip"
        if (!canvasRef || playerData.length === 0) return;

        setIsExporting(true);
        const zip = new JSZip();
        const folder = zip.folder("jersey_standard_bundle");

        try {
            // Deduct 1 point per player for standard bundle
            const pointsResult = await deductPoints(playerData.length, `Standard Bundle Export — ${playerData.length} players`);
            if (!pointsResult.success) return;

            for (let i = 0; i < playerData.length; i++) {
                const player = playerData[i];
                updateCanvasPlayerText(canvasRef, player);

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

                const blob = await (await fetch(dataURL)).blob();
                folder?.file(generateFileName(player, 'current_view', 'png', i + 1), blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `GxStudio_Standard_Bundle_${Date.now()}.zip`);
            toast.success("Standard bundle exported!");
        } finally {
            setIsExporting(false);
        }
    };

    const previewCurrentDesign = () => {
        if (!canvasRef || !selectedPlayer) return;

        const bounds = getDesignBounds(canvasRef);
        if (!bounds) {
            toast.error("Nothing to preview");
            return;
        }

        const dataURL = canvasRef.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 1 * getSizeScaleFactor(selectedPlayer.size),
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            enableRetinaScaling: false
        });

        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`
        <html>
          <head><title>Preview — ${selectedPlayer?.playerName}</title></head>
          <body style="margin:0; padding:0; background:transparent; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${dataURL}" style="max-width:100%; height:auto;" alt="${selectedPlayer?.playerName} Design" />
          </body>
        </html>
      `);
        }
    };

    const exportIndividualSleeve = async (sleeveType: 'leftSleeve' | 'rightSleeve') => {
        if (!canvasRef || !selectedPlayer) {
            toast.error("No design to export");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export");
            return;
        }
        if (currentPoints < 1) {
            toast.error("Insufficient points!");
            return;
        }

        setIsExporting(true);
        try {
            const bounds = getDesignBounds(canvasRef, [sleeveType]);
            if (!bounds) {
                toast.error(`No ${sleeveType === 'leftSleeve' ? 'left' : 'right'} sleeve found on canvas. Switch to that view first.`);
                return;
            }

            const dataURL = canvasRef.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: getQualityMultiplier(),
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                enableRetinaScaling: false
            });

            const response = await fetch(dataURL);
            const blob = await response.blob();
            const label = sleeveType === 'leftSleeve' ? 'left_sleeve' : 'right_sleeve';

            // Secure Authorization: Deduct points BEFORE downloading
            const result = await deductPoints(1, `${label} export for ${selectedPlayer.playerName}`);
            if (!result.success) {
                toast.error("Failed to deduct points.");
                return;
            }

            // Execute local download
            saveAs(blob, generateFileName(selectedPlayer, label, 'png'));

            const dpiText = exportQuality === 'ultra' ? '600 DPI' : exportQuality === 'high' ? '450 DPI' : '300 DPI';
            toast.success(`${sleeveType === 'leftSleeve' ? 'Left' : 'Right'} sleeve exported (${dpiText})`);
        } catch (e) {
            toast.error("Error exporting sleeve");
            logger.error('Sleeve export error:', e);
        } finally {
            setIsExporting(false);
        }
    };

    const exportCollar = async () => {
        if (!canvasRef || !selectedPlayer) {
            toast.error("No design to export");
            return;
        }
        if (!user) {
            toast.error("Please sign in to export");
            return;
        }
        if (currentPoints < 1) {
            toast.error("Insufficient points!");
            return;
        }

        setIsExporting(true);
        try {
            const bounds = getDesignBounds(canvasRef, ['collar']);
            if (!bounds) {
                toast.error("No collar found on canvas. Switch to the Collar view first.");
                return;
            }

            const dataURL = canvasRef.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: getQualityMultiplier(),
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                enableRetinaScaling: false
            });

            const response = await fetch(dataURL);
            const blob = await response.blob();

            // Secure Authorization: Deduct points BEFORE downloading
            const result = await deductPoints(1, `Collar export for ${selectedPlayer.playerName}`);
            if (!result.success) {
                toast.error("Failed to deduct points.");
                return;
            }

            // Execute local download
            saveAs(blob, generateFileName(selectedPlayer, 'collar', 'png'));

            const dpiText = exportQuality === 'ultra' ? '600 DPI' : exportQuality === 'high' ? '450 DPI' : '300 DPI';
            toast.success(`Collar exported (${dpiText})`);
        } catch (e) {
            toast.error("Error exporting collar");
            logger.error('Collar export error:', e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 p-4">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-dashed border-gray-300">
                <LayoutTemplate className="w-5 h-5" />
                <h3 className="text-lg font-bold uppercase tracking-wider">Export Configuration</h3>
            </div>

            {/* Export Settings */}
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">Quality</Label>
                    <Select value={exportQuality} onValueChange={(value: 'ultra' | 'high' | 'medium') => setExportQuality(value)}>
                        <SelectTrigger className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2 border-black rounded-none">
                            <SelectItem value="ultra">Ultra (600 DPI - Vector Sharp)</SelectItem>
                            <SelectItem value="high">High (450 DPI - Production Output)</SelectItem>
                            <SelectItem value="medium">Standard (300 DPI - Basic Print)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="bg-black" />

            {/* Single Export */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">Current View</Label>
                    <div className="font-mono text-xs font-bold bg-gray-100 px-2 py-1">
                        {selectedPlayer ? selectedPlayer.playerName : 'NO SELECTION'}
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
                        disabled={!selectedPlayer || !canvasRef || isExporting}
                        className="w-full h-12 bg-black text-white rounded-none border-2 border-black hover:bg-gray-800 transition-all uppercase font-bold text-xs tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Processing...' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Components */}
            <div className="space-y-4">
                <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">
                    Components <span className="font-normal normal-case text-gray-400">(switch to that view first)</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        onClick={() => exportIndividualSleeve('leftSleeve')}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting}
                    >
                        Left Sleeve
                    </Button>
                    <Button
                        onClick={() => exportIndividualSleeve('rightSleeve')}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting}
                    >
                        Right Sleeve
                    </Button>
                    <Button
                        onClick={exportCollar}
                        variant="outline"
                        className="h-10 border-2 border-gray-300 hover:border-black rounded-none hover:bg-gray-50 transition-all uppercase text-[10px] font-bold tracking-wider"
                        disabled={!selectedPlayer || !canvasRef || isExporting}
                    >
                        Collar
                    </Button>
                </div>
            </div>

            <Separator className="bg-black" />

            {/* Bulk Export */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold tracking-widest text-gray-500">Bulk Actions</Label>
                    <div className="font-mono text-xs font-bold bg-black text-white px-2 py-1">
                        ZIP ARCHIVE
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={exportAllDesigns}
                        disabled={playerData.length === 0 || !canvasRef || isExporting}
                        variant="outline"
                        className="w-full h-12 border-2 border-black rounded-none transition-all uppercase font-bold text-xs tracking-widest"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Standard Bundle (Current View Only)
                    </Button>

                    <p className="text-[10px] text-gray-500 font-mono italic">
                        * Standard bundle captures only the active view for all players.
                    </p>

                    <Button
                        onClick={exportFullProductionPack}
                        disabled={playerData.length === 0 || !canvasRef || isExporting}
                        className="w-full h-16 bg-black text-white rounded-none border-4 border-black hover:bg-gray-800 transition-all uppercase font-black tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Archive className="w-6 h-6 mr-3" />
                        {isExporting ? 'Processing Team...' : 'Full Production Team Pack'}
                    </Button>

                    <p className="text-[10px] text-black font-bold font-mono">
                        ★ BEST FOR PRINT SHOPS: Includes all 5 views for every player, organized into folders.
                    </p>
                </div>
            </div>
        </div>
    );
};