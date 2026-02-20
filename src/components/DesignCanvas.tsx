import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Text as FabricText, TPointerEventInfo, Shadow, Pattern, Gradient } from "fabric";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Move, Download, Scissors } from "lucide-react";
import { toast } from "sonner";
import type { JerseyImages, PlayerData } from "@/pages/Index";
import { logger } from "@/lib/logger";

type TextProps = {
    text: string;
    left: number;
    top: number;
    fontSize: number;
    fontFamily: string;
    fill: string | Pattern | Gradient<any>;
    stroke: string | Pattern | Gradient<any>;
    strokeWidth: number;
    angle: number;
    textAlign: any;
    width?: number;
    height?: number;
    originX: 'center';
    originY: 'center';
};

type LogoProps = {
    src: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    originX: 'center';
    originY: 'center';
};

interface ExtendedFabricText extends FabricText {
    name?: string;
}

interface ExtendedFabricImage extends FabricImage {
    name?: string;
}

interface DesignCanvasProps {
    jerseyImages: JerseyImages;
    selectedPlayer: PlayerData | null;
    onCanvasReady: (canvas: FabricCanvas | null) => void;
    defaultFont?: string; // Default font for player names/numbers
    showTools?: boolean; // Toggle visibility of design tools for different steps
}

type ExportableCanvas = FabricCanvas & {
    getVisibleContentBounds?: () => CanvasBounds | null;
};

type CanvasBounds = {
    left: number;
    top: number;
    width: number;
    height: number;
};

const getVisibleContentBounds = (canvas: FabricCanvas): CanvasBounds | null => {
    // Filter to only include jersey design elements (exclude UI labels)
    const designObjects = canvas.getObjects().filter(object => {
        if (!object.visible) return false;
        const extendedObj = object as ExtendedFabricText | ExtendedFabricImage;
        const name = extendedObj.name;

        // Include jersey components, player name/number, custom texts, and custom logos
        // Exclude UI labels like player identifier
        return name === 'jerseyFront' ||
            name === 'jerseyBack' ||
            name === 'leftSleeve' ||
            name === 'rightSleeve' ||
            name === 'collar' ||
            name === 'playerName' ||
            name === 'jerseyNumber' ||
            name === 'customText' ||
            name === 'customLogo' ||
            // Include sleeve and collar images (they don't have names but are design elements)
            (!name && extendedObj instanceof FabricImage);
    });

    if (designObjects.length === 0) {
        return null;
    }

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

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        return null;
    }

    // NO padding - export only the exact bounds of the design
    return {
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

export const getSizeScaleFactor = (size: string | undefined): number => {
    if (!size) return 1;
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum)) return 1; // Handled non-numeric sizes
    // Scale factor: 22=0.8x, 46=1.2x, linear interpolation
    const minSize = 22, maxSize = 46;
    const minScale = 0.8, maxScale = 1.2;
    return ((sizeNum - minSize) / (maxSize - minSize)) * (maxScale - minScale) + minScale;
};

// Create a clean export function that exports only jersey design with white background for JPG
export const exportCleanJerseyDesign = (canvas: FabricCanvas, sizeMultiplier: number = 1): string => {
    // Filter to only include jersey design elements
    const designObjects = canvas.getObjects().filter(object => {
        if (!object.visible) return false;
        const extendedObj = object as ExtendedFabricText | ExtendedFabricImage;
        const name = extendedObj.name;

        // Include only jersey design elements, exclude UI labels
        return name === 'jerseyFront' ||
            name === 'jerseyBack' ||
            name === 'leftSleeve' ||
            name === 'rightSleeve' ||
            name === 'collar' ||
            name === 'playerName' ||
            name === 'jerseyNumber' ||
            name === 'customText' ||
            name === 'customLogo' ||
            // Include sleeve and collar images
            (!name && (extendedObj as any).src);
    });

    if (designObjects.length === 0) {
        return '';
    }

    // Calculate exact bounds
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

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        return '';
    }

    // Export with exact bounds, transparent bg (or white if you want), and 500 DPI
    return canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 5.21 * sizeMultiplier,
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        enableRetinaScaling: false,
    } as any); // Cast as any to avoid backgroundColor type error if changed in v6
};

export const DesignCanvas = ({ jerseyImages, selectedPlayer, onCanvasReady, defaultFont = 'Anton', showTools = false }: DesignCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [currentView, setCurrentView] = useState<'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar'>('front');
    const [zoom, setZoom] = useState(1);
    const [showCuttingOutline, setShowCuttingOutline] = useState(false);
    // Persist text placements/styles across views and sessions globally
    const textRef = useRef<{ [view: string]: { name?: TextProps; number?: TextProps; customTexts?: TextProps[]; customLogos?: LogoProps[] } }>({});
    const currentViewRef = useRef<'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar'>('front');
    const isInitialized = useRef(false);

    // Global placement ratios for consistent Auto Center across all players
    const backPlacementRef = useRef({
        nameTopRatio: 0.26,   // slightly lower for balance
        numberTopRatio: 0.52, // just below center
        nameFontRatio: 0.08,  // larger name
        numberFontRatio: 0.28 // larger number
    });

    // --- Global Template System (positions apply to ALL players) ---
    // Instead of saving per-player, we save a global template
    const loadGlobalTemplate = () => {
        try {
            const raw = localStorage.getItem('jerseyDesigner:globalTemplate');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    textRef.current = parsed;
                }
            }
        } catch (e) {
            // Ignore storage errors
        }
    };

    const saveGlobalTemplate = () => {
        try {
            const dataToSave = {
                ...textRef.current,
                lastModified: Date.now()
            };
            localStorage.setItem('jerseyDesigner:globalTemplate', JSON.stringify(dataToSave));
        } catch (e) {
            // Ignore storage errors
        }
    };

    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    useEffect(() => {
        if (!canvasRef.current || isInitialized.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: 960,
            height: 720,
            backgroundColor: 'transparent',
            renderOnAddRemove: false, // Performance optimization
            skipOffscreen: true, // Performance optimization
        });

        // Enable hardware acceleration
        canvas.enableRetinaScaling = true;

        // Expose helper to compute the minimal bounding box of visible objects for exporting
        (canvas as ExportableCanvas).getVisibleContentBounds = () => getVisibleContentBounds(canvas);

        setFabricCanvas(canvas);
        onCanvasReady(canvas);
        isInitialized.current = true;

        // Don't dispose canvas on unmount - keep it alive for position persistence
    }, [onCanvasReady]);

    useEffect(() => {
        if (!fabricCanvas || !jerseyImages) return;

        // Batch canvas updates for better performance
        fabricCanvas.renderOnAddRemove = false;
        loadJerseyView().catch(err => logger.error("Failed to load jersey view:", err));
        fabricCanvas.renderAll();
    }, [fabricCanvas, jerseyImages, currentView, selectedPlayer, showCuttingOutline]);

    // Track dragging/move to persist text positions live for all views
    useEffect(() => {
        if (!fabricCanvas) return;

        const handler = (opt: any) => {
            if (!selectedPlayer || !fabricCanvas || !opt.target) return;

            const playerId = `${selectedPlayer.playerName}_${selectedPlayer.jerseyNumber}`;
            const view = currentViewRef.current;
            const objects = fabricCanvas.getObjects();
            const nameObj = objects.find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
            const numberObj = objects.find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;
            const customTexts = objects.filter(o => (o as ExtendedFabricText).name === 'customText') as ExtendedFabricText[];
            const customLogos = objects.filter(o => (o as ExtendedFabricImage).name === 'customLogo') as ExtendedFabricImage[];

            // Initialize view if not exists
            if (!textRef.current[view]) {
                textRef.current[view] = {};
            }

            if (nameObj && view === 'back') {
                textRef.current[view].name = {
                    text: nameObj.text || '',
                    left: nameObj.left ?? 0,
                    top: nameObj.top ?? 0,
                    fontSize: nameObj.fontSize ?? 38,
                    fontFamily: nameObj.fontFamily ?? 'Anton',
                    fill: (nameObj.fill as string) ?? '#000000',
                    stroke: (nameObj.stroke as string) ?? '',
                    strokeWidth: nameObj.strokeWidth ?? 0,
                    angle: nameObj.angle ?? 0,
                    textAlign: nameObj.textAlign ?? 'center',
                    width: nameObj.width ?? 960,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
            }
            if (numberObj && view === 'back') {
                textRef.current[view].number = {
                    text: numberObj.text || '',
                    left: numberObj.left ?? 0,
                    top: numberObj.top ?? 0,
                    fontSize: numberObj.fontSize ?? 115,
                    fontFamily: numberObj.fontFamily ?? 'Anton',
                    fill: (numberObj.fill as string) ?? '#000000',
                    stroke: (numberObj.stroke as string) ?? '',
                    strokeWidth: numberObj.strokeWidth ?? 0,
                    angle: numberObj.angle ?? 0,
                    textAlign: numberObj.textAlign ?? 'center',
                    height: numberObj.height ?? 720,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
            }

            // Persist custom texts globally
            if (customTexts.length > 0) {
                textRef.current[view].customTexts = customTexts.map(text => ({
                    text: text.text || '',
                    left: text.left ?? 0,
                    top: text.top ?? 0,
                    fontSize: text.fontSize ?? 38,
                    fontFamily: text.fontFamily ?? 'Anton',
                    fill: (text.fill as string) ?? '#000000',
                    stroke: (text.stroke as string) ?? '',
                    strokeWidth: text.strokeWidth ?? 0,
                    angle: text.angle ?? 0,
                    textAlign: text.textAlign ?? 'center',
                    width: text.width,
                    height: text.height,
                    originX: 'center' as const,
                    originY: 'center' as const,
                }));
            }

            // Persist custom logos only on front view
            if (customLogos.length > 0 && view === 'front') {
                textRef.current[view].customLogos = customLogos.map(logo => ({
                    src: (logo as any).src || '',
                    left: logo.left ?? 0,
                    top: logo.top ?? 0,
                    scaleX: logo.scaleX ?? 1,
                    scaleY: logo.scaleY ?? 1,
                    angle: logo.angle ?? 0,
                    originX: 'center' as const,
                    originY: 'center' as const,
                }));
            }

            // Persist any change to global template (applies to all players)
            saveGlobalTemplate();
        };

        fabricCanvas.on('object:added', handler);
        fabricCanvas.on('object:modified', handler);
        fabricCanvas.on('object:moving', handler);
        fabricCanvas.on('object:scaling', handler);
        fabricCanvas.on('object:rotating', handler);

        return () => {
            fabricCanvas.off('object:added', handler);
            fabricCanvas.off('object:modified', handler);
            fabricCanvas.off('object:moving', handler);
            fabricCanvas.off('object:scaling', handler);
            fabricCanvas.off('object:rotating', handler);
        };
    }, [fabricCanvas, selectedPlayer]);

    // Load global template once on mount (applies to all players)
    useEffect(() => {
        loadGlobalTemplate();
    }, []);

    // Prevent race conditions when switching views quickly
    const loadTokenRef = useRef(0);
    const loadJerseyView = async (view?: typeof currentView) => {
        if (!fabricCanvas) return;
        loadTokenRef.current++;
        const myToken = loadTokenRef.current;

        const activeView = view || currentView;

        // Persist current view objects before clearing (to keep manual placements)
        try {
            const prevView = currentViewRef.current;
            const objs = fabricCanvas.getObjects();
            const nameObjPrev = objs.find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
            const numberObjPrev = objs.find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;
            const customTextsPrev = objs.filter(o => (o as ExtendedFabricText).name === 'customText') as ExtendedFabricText[];
            const customLogosPrev = objs.filter(o => (o as ExtendedFabricImage).name === 'customLogo') as ExtendedFabricImage[];

            if (!textRef.current[prevView]) {
                textRef.current[prevView] = {};
            }

            const pickTextProps = (t: ExtendedFabricText): TextProps => ({
                text: t.text || '',
                left: t.left ?? 0,
                top: t.top ?? 0,
                fontSize: t.fontSize ?? 38,
                fontFamily: t.fontFamily ?? 'Anton',
                fill: (t.fill as string) ?? '#000000',
                stroke: (t.stroke as string) ?? '',
                strokeWidth: t.strokeWidth ?? 0,
                angle: t.angle ?? 0,
                textAlign: t.textAlign ?? 'center',
                width: t.width,
                height: t.height,
                originX: 'center',
                originY: 'center',
            });

            if (nameObjPrev) textRef.current[prevView].name = pickTextProps(nameObjPrev);
            if (numberObjPrev) textRef.current[prevView].number = pickTextProps(numberObjPrev);
            if (customTextsPrev.length > 0) {
                textRef.current[prevView].customTexts = customTextsPrev.map(pickTextProps);
            }
            if (customLogosPrev.length > 0 && prevView === 'front') {
                textRef.current[prevView].customLogos = customLogosPrev.map(logo => ({
                    src: (logo as any).src || '',
                    left: logo.left ?? 0,
                    top: logo.top ?? 0,
                    scaleX: logo.scaleX ?? 1,
                    scaleY: logo.scaleY ?? 1,
                    angle: logo.angle ?? 0,
                    originX: 'center',
                    originY: 'center',
                }));
            }
            saveGlobalTemplate();
        } catch { }

        // Preserve player text positions/styles (if already placed) before clearing
        const pickTextProps = (t: ExtendedFabricText): TextProps => ({
            text: t.text || '',
            left: t.left ?? 0,
            top: t.top ?? 0,
            fontSize: t.fontSize ?? 38,
            fontFamily: t.fontFamily ?? 'Anton',
            fill: (t.fill as string) ?? '#000000',
            stroke: (t.stroke as string) ?? '',
            strokeWidth: t.strokeWidth ?? 0,
            angle: t.angle ?? 0,
            textAlign: t.textAlign ?? 'center',
            width: t.width,
            height: t.height,
            originX: 'center' as const,
            originY: 'center' as const,
        });

        const existingNameObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
        const existingNumberObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;

        // Get persisted text for current view globally
        const viewTextData = textRef.current[activeView] || {};
        const prevNameProps = viewTextData.name ?? (existingNameObj ? pickTextProps(existingNameObj) : null);
        const prevNumberProps = viewTextData.number ?? (existingNumberObj ? pickTextProps(existingNumberObj) : null);

        fabricCanvas.clear();
        fabricCanvas.backgroundColor = 'transparent';

        try {
            // Load jersey components based on active view
            if (activeView === 'front' || activeView === 'back') {
                const jerseyImageUrl = activeView === 'front' ? jerseyImages.front : jerseyImages.back;

                if (jerseyImageUrl) {
                    try {
                        const jerseyImg = await FabricImage.fromURL(jerseyImageUrl);

                        // Scale jersey to fit canvas with size-based adjustments
                        const maxWidth = 640;
                        const maxHeight = 514;
                        const scaleX = maxWidth / jerseyImg.width!;
                        const scaleY = maxHeight / jerseyImg.height!;
                        const baseScale = Math.min(scaleX, scaleY);
                        const scale = baseScale;

                        jerseyImg.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'center',
                            left: fabricCanvas.width! / 2,
                            top: fabricCanvas.height! / 2,
                            selectable: false,
                            evented: false,
                            stroke: showCuttingOutline ? '#000000' : undefined, // Black outline for cutting guide
                            strokeWidth: showCuttingOutline ? 2 : 0,
                        });
                        (jerseyImg as ExtendedFabricImage).name = activeView === 'front' ? 'jerseyFront' : 'jerseyBack';

                        if (myToken !== loadTokenRef.current) return; // view changed mid-load
                        fabricCanvas.add(jerseyImg);
                        fabricCanvas.sendObjectToBack(jerseyImg);
                        logger.info(`Loaded ${activeView} image successfully`, jerseyImageUrl);
                    } catch (error) {
                        logger.error(`Failed to load ${activeView} jersey image:`, error);
                        toast.error(`Failed to load ${activeView} jersey image`);
                    }
                }
            } else if (activeView === 'leftSleeve') {
                // Load left sleeve only
                if (jerseyImages.leftSleeve) {
                    try {
                        const leftSleeve = await FabricImage.fromURL(jerseyImages.leftSleeve) as unknown as ExtendedFabricImage;

                        if (myToken !== loadTokenRef.current) return;

                        const baseScale = Math.min(400 / leftSleeve.width!, 400 / leftSleeve.height!);
                        const scale = baseScale;
                        leftSleeve.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'center',
                            left: fabricCanvas.width! / 2,
                            top: fabricCanvas.height! / 2,
                            selectable: false,
                            evented: false,
                            stroke: showCuttingOutline ? '#000000' : undefined, // Black outline for cutting guide
                            strokeWidth: showCuttingOutline ? 2 : 0,
                        });
                        leftSleeve.name = 'leftSleeve';
                        (leftSleeve as any).src = jerseyImages.leftSleeve;

                        fabricCanvas.add(leftSleeve);
                    } catch (error) {
                        logger.error('Failed to load left sleeve image:', error);
                        toast.error('Failed to load left sleeve image');
                    }
                } else {
                    // Nothing to show for left sleeve view if not provided
                    fabricCanvas.renderAll();
                    return;
                }
            } else if (activeView === 'rightSleeve') {
                // Load right sleeve only
                if (jerseyImages.rightSleeve) {
                    try {
                        const rightSleeve = await FabricImage.fromURL(jerseyImages.rightSleeve) as unknown as ExtendedFabricImage;

                        if (myToken !== loadTokenRef.current) return;

                        const baseScale = Math.min(400 / rightSleeve.width!, 400 / rightSleeve.height!);
                        const scale = baseScale;
                        rightSleeve.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'center',
                            left: fabricCanvas.width! / 2,
                            top: fabricCanvas.height! / 2,
                            selectable: false,
                            evented: false,
                            stroke: showCuttingOutline ? '#000000' : undefined, // Black outline for cutting guide
                            strokeWidth: showCuttingOutline ? 2 : 0,
                        });
                        rightSleeve.name = 'rightSleeve';
                        (rightSleeve as any).src = jerseyImages.rightSleeve;

                        fabricCanvas.add(rightSleeve);
                    } catch (error) {
                        logger.error('Failed to load right sleeve image:', error);
                        toast.error('Failed to load right sleeve image');
                    }
                } else {
                    // Nothing to show for right sleeve view if not provided
                    fabricCanvas.renderAll();
                    return;
                }
            } else if (activeView === 'collar') {
                // Load collar
                if (jerseyImages.collar) {
                    try {
                        const collarImg = await FabricImage.fromURL(jerseyImages.collar) as unknown as ExtendedFabricImage;

                        if (myToken !== loadTokenRef.current) return;

                        const maxWidth = 560;
                        const maxHeight = 206;
                        const scaleX = maxWidth / collarImg.width!;
                        const scaleY = maxHeight / collarImg.height!;
                        const baseScale = Math.min(scaleX, scaleY);
                        const scale = baseScale;

                        collarImg.set({
                            scaleX: scale,
                            scaleY: scale,
                            originX: 'center',
                            originY: 'top',
                            left: fabricCanvas.width! / 2,
                            top: 154,
                            selectable: false,
                            evented: false,
                            stroke: showCuttingOutline ? '#000000' : undefined, // Black outline for cutting guide
                            strokeWidth: showCuttingOutline ? 2 : 0,
                        });
                        collarImg.name = 'collar';
                        (collarImg as any).src = jerseyImages.collar;

                        fabricCanvas.add(collarImg);
                    } catch (error) {
                        logger.error('Failed to load collar image:', error);
                        toast.error('Failed to load collar image');
                    }
                } else {
                    // Nothing to show for collar view if not provided
                    fabricCanvas.renderAll();
                    return;
                }
            }

            // Add player information if selected and on back view
            if (selectedPlayer && activeView === 'back') {
                // Player name (preserve previous placement/style if existed)
                const defaultNameTop = 103;
                const nameProps = prevNameProps ?? {
                    text: selectedPlayer.playerName,
                    left: fabricCanvas.width! / 2,
                    top: defaultNameTop,
                    fontSize: 38,
                    fontFamily: 'Anton',
                    fill: '#000000',
                    textAlign: 'center' as const,
                    width: 960,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
                const nameText = new FabricText(selectedPlayer.playerName, {
                    ...nameProps,
                }) as ExtendedFabricText;
                nameText.name = 'playerName';
                nameText.set({ fontWeight: 'bold', selectable: true });
                fabricCanvas.add(nameText);

                // Jersey number (preserve previous placement/style if existed)
                const defaultNumberTop = 257;
                const numberProps = prevNumberProps ?? {
                    text: selectedPlayer.jerseyNumber,
                    left: fabricCanvas.width! / 2,
                    top: defaultNumberTop,
                    fontSize: 115,
                    fontFamily: 'Anton',
                    fill: '#000000',
                    textAlign: 'center' as const,
                    height: 720,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
                const numberText = new FabricText(selectedPlayer.jerseyNumber, {
                    ...numberProps,
                }) as ExtendedFabricText;
                numberText.name = 'jerseyNumber';
                numberText.set({ fontWeight: 'bold', selectable: true });
                fabricCanvas.add(numberText);

                // Auto-center only if no previous saved placement
                const shouldAutoCenter = !prevNameProps || !prevNumberProps;
                setTimeout(() => {
                    if (myToken !== loadTokenRef.current) return;
                    if (shouldAutoCenter) {
                        const backImg = fabricCanvas.getObjects().find(o => (o as ExtendedFabricImage).name === 'jerseyBack') as ExtendedFabricImage | undefined;
                        if (!backImg) return;
                        const rect = backImg.getBoundingRect();
                        const backTop = rect.top;
                        const backHeight = rect.height;
                        const centerX = rect.left + rect.width / 2; // center to jersey back
                        const nameTop = backTop + backHeight * backPlacementRef.current.nameTopRatio;
                        const numberTop = backTop + backHeight * backPlacementRef.current.numberTopRatio;
                        const nameFont = Math.max(16, Math.round(backHeight * backPlacementRef.current.nameFontRatio));
                        const numberFont = Math.max(48, Math.round(backHeight * backPlacementRef.current.numberFontRatio));
                        // Auto-fit name within back width with margins
                        const maxTextWidth = rect.width * 0.7;
                        nameText.set({ left: centerX, top: nameTop, originX: 'center', originY: 'center', textAlign: 'center', fontSize: nameFont });
                        while (nameText.getScaledWidth() > maxTextWidth && nameText.fontSize! > 12) {
                            nameText.set({ fontSize: nameText.fontSize! - 1 });
                        }
                        numberText.set({ left: centerX, top: numberTop, originX: 'center', originY: 'center', textAlign: 'center', fontSize: numberFont });
                    }
                    fabricCanvas.requestRenderAll();
                }, 0);
            }

            // Add custom texts for this view
            const customTexts = viewTextData.customTexts || [];
            const customTextObjects = customTexts.map(customTextProps => {
                const customText = new FabricText(customTextProps.text, {
                    ...customTextProps,
                }) as ExtendedFabricText;
                customText.name = 'customText';
                customText.set({ selectable: true });
                fabricCanvas.add(customText);
                return customText;
            });

            // Add custom logos for this view (only on front)
            if (activeView === 'front') {
                const customLogos = viewTextData.customLogos || [];
                const customLogoPromises = customLogos.map(async (logoProps) => {
                    try {
                        if (logoProps.src) {
                            const logoImg = await FabricImage.fromURL(logoProps.src) as unknown as ExtendedFabricImage;
                            logoImg.set({
                                left: logoProps.left,
                                top: logoProps.top,
                                scaleX: logoProps.scaleX,
                                scaleY: logoProps.scaleY,
                                angle: logoProps.angle,
                                originX: 'center',
                                originY: 'center',
                                selectable: true,
                            });
                            logoImg.name = 'customLogo';
                            (logoImg as any).src = logoProps.src;
                            fabricCanvas.add(logoImg);
                            return logoImg;
                        }
                    } catch (error) {
                        logger.error('Failed to load custom logo:', logoProps.src, error);
                        toast.error(`Failed to load logo: ${logoProps.src}`);
                    }
                    return null;
                });
                await Promise.all(customLogoPromises);
            }

            // Player identifier (show on all views) - tiny label with name and number
            if (selectedPlayer) {
                const playerLabel = new FabricText(`${selectedPlayer.playerName} #${selectedPlayer.jerseyNumber}`, {
                    left: 16,
                    top: fabricCanvas.height! - 16,
                    fontSize: 10,
                    fill: '#444444',
                    opacity: 0.85,
                    selectable: false,
                    evented: false,
                    originX: 'left',
                    originY: 'bottom',
                });

                playerLabel.shadow = new Shadow({
                    color: 'rgba(255, 255, 255, 0.9)',
                    blur: 4,
                    offsetX: 0,
                    offsetY: 0,
                });

                fabricCanvas.add(playerLabel);
            }

            if (myToken !== loadTokenRef.current) return;
            fabricCanvas.renderAll();
        } catch (error) {
            // Silent failure to avoid noisy notifications; log only for debugging
            logger.error('Canvas loading error:', error);
        }
    };

    const exportAllViews = async () => {
        if (!fabricCanvas || !selectedPlayer) return;

        toast.info("Exporting all jersey views as PNG (500 DPI)...");

        const views: typeof currentView[] = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'];

        try {
            for (const view of views) {
                await loadJerseyView(view);

                // Use clean export function for PNG, passing the size multiplier
                const dataURL = exportCleanJerseyDesign(fabricCanvas, getSizeScaleFactor(selectedPlayer.size));

                if (dataURL) {
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = `${selectedPlayer.playerName}_${selectedPlayer.jerseyNumber}_${view}.png`;
                    link.click();
                    // Small delay to prevent browser from blocking multiple downloads
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // Reload current view
            await loadJerseyView();
            toast.success("All views exported as PNG (500 DPI) successfully!");
        } catch (error) {
            toast.error("Failed to export some views");
            logger.error('Export error:', error);
            // Still try to reload current view even if export failed
            try {
                await loadJerseyView();
            } catch (reloadError) {
                logger.error('Failed to reload current view:', reloadError);
            }
        }
    };

    const exportCurrentView = async () => {
        if (!fabricCanvas || !selectedPlayer) return;

        try {
            // Use clean export function for PNG, passing the size multiplier
            const dataURL = exportCleanJerseyDesign(fabricCanvas, getSizeScaleFactor(selectedPlayer.size));

            if (!dataURL) {
                toast.error("No design content to export");
                return;
            }

            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${selectedPlayer.playerName}_${selectedPlayer.jerseyNumber}_${currentView}.png`;
            link.click();
            toast.success(`Current view exported as PNG (500 DPI)!`);
        } catch (error) {
            toast.error("Failed to export current view");
            logger.error('Export error:', error);
        }
    };

    const handleZoomIn = () => {
        if (!fabricCanvas) return;
        const newZoom = Math.min(zoom * 1.2, 3);
        fabricCanvas.setZoom(newZoom);
        setZoom(newZoom);
    };

    const handleZoomOut = () => {
        if (!fabricCanvas) return;
        const newZoom = Math.max(zoom / 1.2, 0.3);
        fabricCanvas.setZoom(newZoom);
        setZoom(newZoom);
    };

    const handleResetView = () => {
        if (!fabricCanvas) return;
        fabricCanvas.setZoom(1);
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
    };

    const enablePanMode = () => {
        if (!fabricCanvas) return;

        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        fabricCanvas.selection = false;

        const mouseDownHandler = (opt: any) => {
            const evt = opt.e;
            isDragging = true;
            fabricCanvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        };

        const mouseMoveHandler = (opt: any) => {
            if (isDragging) {
                const evt = opt.e;
                const vpt = fabricCanvas.viewportTransform!;
                vpt[4] += evt.clientX - lastPosX;
                vpt[5] += evt.clientY - lastPosY;
                fabricCanvas.requestRenderAll();
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
            }
        };

        const mouseUpHandler = (opt: any) => {
            fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
            isDragging = false;
            fabricCanvas.selection = true;

            // Clean up event listeners after pan operation
            fabricCanvas.off('mouse:down', mouseDownHandler);
            fabricCanvas.off('mouse:move', mouseMoveHandler);
            fabricCanvas.off('mouse:up', mouseUpHandler);

            toast.success("Pan mode disabled - canvas controls restored");
        };

        fabricCanvas.on('mouse:down', mouseDownHandler);
        fabricCanvas.on('mouse:move', mouseMoveHandler);
        fabricCanvas.on('mouse:up', mouseUpHandler);

        toast.success("Pan mode enabled - drag to move canvas");
    };

    // Center-fit player's name and number over the back image (improved positioning)
    const centerFitBackNameNumber = () => {
        if (!fabricCanvas) return;

        const backImg = fabricCanvas.getObjects().find(o => (o as ExtendedFabricImage).name === 'jerseyBack') as ExtendedFabricImage | undefined;
        const nameObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
        const numberObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;

        if (!backImg) {
            toast.error('Back image not found');
            return;
        }

        // Compute back image bounds on canvas after scaling
        const rect = backImg.getBoundingRect();
        const backLeft = rect.left;
        const backTop = rect.top;
        const backWidth = rect.width;
        const backHeight = rect.height;
        const centerX = backLeft + backWidth / 2; // center to jersey back

        // Improved positioning based on jersey design patterns
        // Name positioned in upper third, number in center area
        const nameTop = backTop + backHeight * backPlacementRef.current.nameTopRatio;
        const numberTop = backTop + backHeight * backPlacementRef.current.numberTopRatio;

        if (nameObj) {
            nameObj.set({
                left: centerX,
                top: nameTop,
                originX: 'center',
                originY: 'center',
                textAlign: 'center',
            });
        }

        if (numberObj) {
            numberObj.set({
                left: centerX,
                top: numberTop,
                originX: 'center',
                originY: 'center',
                textAlign: 'center',
            });
        }

        // Update global font sizes as well based on back height
        const nameFont = Math.max(16, Math.round(backHeight * backPlacementRef.current.nameFontRatio));
        const numberFont = Math.max(48, Math.round(backHeight * backPlacementRef.current.numberFontRatio));
        if (nameObj) {
            nameObj.set({ fontSize: nameFont });
            const maxTextWidth = backWidth * 0.7;
            while (nameObj.getScaledWidth() > maxTextWidth && nameObj.fontSize! > 12) {
                nameObj.set({ fontSize: nameObj.fontSize! - 1 });
            }
        }
        if (numberObj) numberObj.set({ fontSize: numberFont });
        fabricCanvas.requestRenderAll();
        toast.success("Name and number positioned perfectly!");
    };

    // Auto-center name and number when loading back view (like example positioning)
    const autoCenterNameNumber = () => {
        if (!fabricCanvas || currentView !== 'back') return;

        const backImg = fabricCanvas.getObjects().find(o => (o as ExtendedFabricImage).name === 'jerseyBack') as ExtendedFabricImage | undefined;
        const nameObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
        const numberObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;

        if (backImg) {
            const rect = backImg.getBoundingRect();
            const backLeft = rect.left;
            const backTop = rect.top;
            const backWidth = rect.width;
            const backHeight = rect.height;
            const centerX = backLeft + backWidth / 2; // center to jersey back

            // Auto-position like example: name in upper area, number centered
            const nameTop = backTop + backHeight * 0.28;
            const numberTop = backTop + backHeight * 0.56;

            const nameFont = Math.max(16, Math.round(backHeight * 0.05)); // Example baseline ratio
            const numberFont = Math.max(48, Math.round(backHeight * 0.12)); // Example baseline ratio

            if (nameObj) {
                nameObj.set({
                    left: centerX,
                    top: nameTop,
                    originX: 'center',
                    originY: 'center',
                    textAlign: 'center',
                    fontSize: nameFont,
                });
                const maxTextWidth = backWidth * 0.7;
                while (nameObj.getScaledWidth() > maxTextWidth && nameObj.fontSize! > 12) {
                    nameObj.set({ fontSize: nameObj.fontSize! - 1 });
                }
            }

            if (numberObj) {
                numberObj.set({
                    left: centerX,
                    top: numberTop,
                    originX: 'center',
                    originY: 'center',
                    textAlign: 'center',
                    fontSize: numberFont,
                });
            }

            fabricCanvas.requestRenderAll();
        }
    };

    // React to font changes immediately: Update existing canvas objects & stored refs
    useEffect(() => {
        if (!fabricCanvas || !defaultFont) return;

        let changed = false;

        // 1. Update current canvas objects
        fabricCanvas.getObjects().forEach(obj => {
            const extendedObj = obj as ExtendedFabricText;
            if (extendedObj.name === 'playerName' || extendedObj.name === 'jerseyNumber') {
                if (extendedObj.fontFamily !== defaultFont) {
                    extendedObj.set('fontFamily', defaultFont);
                    changed = true;
                }
            }
        });

        // 2. Update stored refs for ALL views so font persists when switching views
        const views = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'];
        views.forEach(view => {
            if (textRef.current[view]) {
                if (textRef.current[view].name) {
                    textRef.current[view].name!.fontFamily = defaultFont;
                }
                if (textRef.current[view].number) {
                    textRef.current[view].number!.fontFamily = defaultFont;
                }
            }
        });

        if (changed) {
            fabricCanvas.requestRenderAll();
            saveGlobalTemplate();
        }
    }, [defaultFont, fabricCanvas]);

    if (!selectedPlayer) {
        return (
            <Card className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                    <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                        <Move className="w-12 h-12" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
                    <p>Choose a player from the list to start designing their jersey</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold">Design Canvas</h3>
                    <p className="text-sm text-muted-foreground">
                        {selectedPlayer.playerName} - #{selectedPlayer.jerseyNumber}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={currentView === 'front' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('front')}
                    >
                        Front
                    </Button>
                    <Button
                        variant={currentView === 'back' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('back')}
                    >
                        Back
                    </Button>
                    <Button
                        variant={currentView === 'leftSleeve' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('leftSleeve')}
                        disabled={!jerseyImages.leftSleeve}
                    >
                        Left Sleeve
                    </Button>
                    <Button
                        variant={currentView === 'rightSleeve' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('rightSleeve')}
                        disabled={!jerseyImages.rightSleeve}
                    >
                        Right Sleeve
                    </Button>
                    <Button
                        variant={currentView === 'collar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentView('collar')}
                    >
                        Collar
                    </Button>

                    {showTools && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={centerFitBackNameNumber}
                                disabled={currentView !== 'back'}
                                title="Center name & number on back (like example)"
                            >
                                Auto Center
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportCurrentView}
                                title="Export current view as PNG (500 DPI)"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Current
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportAllViews}
                                title="Export all views as PNG (500 DPI)"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export All
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className={`border rounded-lg overflow-hidden bg-white ${showTools ? 'border-border' : 'border-transparent'}`}>
                {showTools && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleZoomIn}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleZoomOut}>
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={enablePanMode}>
                                <Move className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleResetView}>
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={showCuttingOutline ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowCuttingOutline(!showCuttingOutline)}
                                title="Toggle cutting outline"
                            >
                                <Scissors className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Zoom: {Math.round(zoom * 100)}% | Export: PNG (500 DPI)
                        </div>
                    </div>
                )}

                <div className="flex justify-center p-4">
                    <canvas
                        ref={canvasRef}
                        className="border border-border rounded shadow-sm"
                    />
                </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
                {showTools
                    ? "Use the customization tools to add logos, adjust text, and personalize the design. All exports are in PNG format at 500 DPI for professional printing quality."
                    : "Review your designs and switch between views. Click 'Continue to Customization' to proceed."}
            </div>
        </Card>
    );
};