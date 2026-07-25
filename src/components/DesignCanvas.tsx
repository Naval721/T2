/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText as FabricText, TPointerEventInfo, Shadow, Pattern, Gradient } from "fabric";
import type { TFiller } from "fabric";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { RotateCcw, ZoomIn, ZoomOut, Move, Download, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { JerseyImages, PlayerData } from "@/pages/Index";
import { logger } from "@/lib/logger";
import { fitTextToWidth } from "@/lib/textFit";
import { getSizeScaleFactorFromDim, computeExportMultiplier, getSizeDim, getSizeDisplayBox } from '@/lib/sizes';
import { useAuth } from "@/hooks/useAuth";
import localforage from 'localforage';
import { addPlayerIdentityLabel } from "@/utils/playerIdentity";
import { getPlayerIdentifier } from "@/lib/statePersistence";

type TextProps = {
    text: string;
    left: number;
    top: number;
    fontSize: number;
    fontFamily: string;
    fill: string | TFiller;
    stroke: string | TFiller;
    strokeWidth: number;
    angle: number;
    textAlign: 'left' | 'center' | 'right' | 'justify' | 'justify-left' | 'justify-center' | 'justify-right';
    width?: number;
    height?: number;
    originX: 'center';
    originY: 'center';
    scaleX?: number;
    scaleY?: number;
    paintFirst?: 'fill' | 'stroke';
    relLeft?: number | null;
    relTop?: number | null;
    relScaleX?: number | null;
    relScaleY?: number | null;
    relFontSize?: number | null;
    relAspectScale?: number | null;
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
    relLeft?: number | null;
    relTop?: number | null;
    relScaleX?: number | null;
    relScaleY?: number | null;
};

type ViewTemplate = {
    name?: TextProps;
    number?: TextProps;
    customTexts?: TextProps[];
    customLogos?: LogoProps[];
};

type CanvasViewType = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar';

type GlobalTemplate = {
    [key in CanvasViewType]?: ViewTemplate;
};

interface ExtendedFabricText extends FabricText {
    name?: string;
}

interface ExtendedFabricImage extends FabricImage {
    name?: string;
}

interface DesignCanvasProps {
    jerseyImages: JerseyImages;
    playerData?: PlayerData[];
    selectedPlayer: PlayerData | null;
    onCanvasReady: (canvas: FabricCanvas | null) => void;
    defaultFont?: string;
    defaultColor?: string;
    defaultStrokeColor?: string;
    defaultStrokeWidth?: number;
    showTools?: boolean;
    initialView?: 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar';
    initialZoom?: number;
    initialCuttingOutline?: boolean;
    onViewChange?: (view: 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar') => void;
    onZoomChange?: (zoom: number) => void;
    onCuttingOutlineChange?: (show: boolean) => void;
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

const pickTextProps = (t: ExtendedFabricText, shirtObj?: ExtendedFabricImage | null, shirtRect?: CanvasBounds | null): TextProps => {
    let relLeft = null, relTop = null, relFontSize = null, relScaleX = null, relScaleY = null, relAspectScale = null;
    if (shirtObj && shirtRect && shirtRect.height > 0) {
        relLeft = (t.left! - shirtRect.left) / shirtRect.width;
        relTop = (t.top! - shirtRect.top) / shirtRect.height;
        // Effective font size is (fontSize * scaleY) relative to shirt height
        const effectiveFontSize = (t.fontSize ?? 38) * (t.scaleY ?? 1);
        relFontSize = effectiveFontSize / shirtRect.height;
        relAspectScale = (t.scaleX ?? 1) / (t.scaleY ?? 1);
        relScaleX = t.scaleX! / shirtObj.scaleX!;
        relScaleY = t.scaleY! / shirtObj.scaleY!;
    }

    return {
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
        scaleX: t.scaleX ?? 1,
        scaleY: t.scaleY ?? 1,
        paintFirst: t.paintFirst ?? 'stroke',
        relLeft,
        relTop,
        relScaleX,
        relScaleY,
        relFontSize,
        relAspectScale,
    };
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
            name === 'playerIdentity' ||
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

/* eslint-disable react-refresh/only-export-components */
export const getSizeScaleFactor = getSizeScaleFactorFromDim;

export const exportCleanJerseyDesign = (
    canvas: FabricCanvas,
    sizeOrMultiplier: string | number = 1,
    dpi: number = 300,
): string => {
    const designObjects = canvas.getObjects().filter(object => {
        if (!object.visible) return false;
        const extendedObj = object as ExtendedFabricText | ExtendedFabricImage;
        const name = extendedObj.name;
        return name === 'jerseyFront' ||
            name === 'jerseyBack' ||
            name === 'leftSleeve' ||
            name === 'rightSleeve' ||
            name === 'collar' ||
            name === 'playerName' ||
            name === 'jerseyNumber' ||
            name === 'customText' ||
            name === 'customLogo' ||
            name === 'playerIdentity' ||
            (!name && (extendedObj as any).src);
    });

    if (designObjects.length === 0) return '';

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

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return '';

    const contentW = maxX - minX;
    const multiplier = typeof sizeOrMultiplier === 'string'
        ? computeExportMultiplier(sizeOrMultiplier, contentW, dpi)
        : 5.21 * sizeOrMultiplier;

    return canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier,
        left: minX,
        top: minY,
        width: contentW,
        height: maxY - minY,
        enableRetinaScaling: false,
    } as any);
};

export const DesignCanvas = ({ jerseyImages, playerData = [], selectedPlayer, onCanvasReady, defaultFont = 'Anton', defaultColor = '#000000', defaultStrokeColor = '#FFFFFF', defaultStrokeWidth = 0, showTools = false, initialView, initialZoom, initialCuttingOutline, onViewChange, onZoomChange, onCuttingOutlineChange }: DesignCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [currentView, setCurrentView] = useState<'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar'>(initialView || 'front');
    const [zoom, setZoom] = useState(initialZoom || 1);
    const [isPanMode, setIsPanMode] = useState(false);
    const [showCuttingOutline, setShowCuttingOutline] = useState(initialCuttingOutline || false);
    // Persist text placements/styles across views and sessions globally
    const textRef = useRef<{ [view: string]: { name?: TextProps; number?: TextProps; customTexts?: TextProps[]; customLogos?: LogoProps[] } }>({});
    const loadedViewRef = useRef<'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar'>('front');
    const currentViewRef = useRef<'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar'>('front');
    const loadedPlayerRef = useRef<PlayerData | null>(selectedPlayer);
    const isCanvasInitializedRef = useRef(false);
    // Always-current ref so event-handler closures never read a stale selectedPlayer
    const selectedPlayerRef = useRef<PlayerData | null>(selectedPlayer);
    // Flag to suppress persistState while loadJerseyView is rebuilding the canvas
    const isLoadingViewRef = useRef(false);
    const { deductPoints, currentPoints } = useAuth();
    const isInitialized = useRef(false);
    // BUG-A2/U3 FIX: State to control confirmation dialog before Apply to All
    const [showApplyAllConfirm, setShowApplyAllConfirm] = useState(false);

    // Global placement ratios for consistent Auto Center across all players
    const backPlacementRef = useRef({
        nameTopRatio: 0.26,   // slightly lower for balance
        numberTopRatio: 0.52, // just below center
        nameFontRatio: 0.08,  // larger name
        numberFontRatio: 0.28 // larger number
    });

    // --- Global Template System (positions apply to ALL players) ---
    // Instead of saving per-player, we save a global template
    const loadGlobalTemplate = async () => {
        try {
            const parsed = await localforage.getItem('jerseyDesigner:globalTemplate');
            if (parsed && typeof parsed === 'object') {
                textRef.current = parsed as any;
            }
        } catch (e) {
            // Ignore storage errors
        }
    };

    const saveGlobalTemplate = () => {
        try {
            const dataToSave = {
                ...textRef.current
            };
            localforage.setItem('jerseyDesigner:globalTemplate', dataToSave).catch((e) => { 
                logger.error("Failed to save global template:", e);
                toast.error("Storage full! Please clear some browser data to save your designs.");
            });
        } catch (e) {
            logger.error("Failed to save global template:", e);
            toast.error("Storage error! Could not save global template.");
        }
    };

    // Debounced version — max one write per 300 ms to prevent localStorage thrashing
    const saveGlobalTemplateDebounced = (() => {
        let timer: ReturnType<typeof setTimeout>;
        return () => {
            clearTimeout(timer);
            timer = setTimeout(saveGlobalTemplate, 300);
        };
    })();

    // Keep selectedPlayerRef always in sync
    useEffect(() => {
        selectedPlayerRef.current = selectedPlayer;
    }, [selectedPlayer]);

    // Keep currentViewRef always in sync with state and notify parent
    useEffect(() => {
        currentViewRef.current = currentView;
        onViewChange?.(currentView);
    }, [currentView, onViewChange]);

    useEffect(() => {
        if (!canvasRef.current || isInitialized.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
            width: 960,
            height: 720,
            backgroundColor: 'transparent',
            renderOnAddRemove: false, // Performance optimization
            skipOffscreen: true, // Performance optimization
            enableRetinaScaling: true, // High-DPI support
        });

        // Expose helper to compute the minimal bounding box of visible objects for exporting
        (canvas as ExportableCanvas).getVisibleContentBounds = () => getVisibleContentBounds(canvas);

        setFabricCanvas(canvas);
        onCanvasReady(canvas);
        isInitialized.current = true;

        return () => {
            canvas.dispose();
            isInitialized.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleForceReload = (e: Event) => {
            const customEvent = e as CustomEvent;
            const activeObjectInfo = customEvent.detail?.activeObjectInfo;
            loadJerseyView(undefined, activeObjectInfo).catch(e => logger.error("Failed to reload view:", e));
        };
        window.addEventListener('jerseyDesigner:forceReloadView', handleForceReload);
        return () => window.removeEventListener('jerseyDesigner:forceReloadView', handleForceReload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!fabricCanvas || !jerseyImages) return;
        loadJerseyView().catch(err => logger.error("Failed to load jersey view:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fabricCanvas, jerseyImages, currentView, selectedPlayer, showCuttingOutline]);

    const persistState = () => {
        // Use ref so this always reads the CURRENT player, even inside stale event-handler closures
        const currentPlayer = selectedPlayerRef.current;
        if (!currentPlayer || !fabricCanvas || isLoadingViewRef.current) return;

        const view = loadedViewRef.current;
        const objects = fabricCanvas.getObjects();
        const nameObj = objects.find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
        const numberObj = objects.find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;
        const customTexts = objects.filter(o => (o as ExtendedFabricText).name === 'customText') as ExtendedFabricText[];
        const customLogos = objects.filter(o => (o as ExtendedFabricImage).name === 'customLogo') as ExtendedFabricImage[];

        if (!textRef.current[view]) {
            textRef.current[view] = {};
        }

        // Find shirt object to compute relative coordinates
        const shirtObj = fabricCanvas.getObjects().find(o => {
            const n = (o as ExtendedFabricImage).name;
            return n === 'jerseyFront' || n === 'jerseyBack' ||
                n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
        }) as ExtendedFabricImage | undefined;
        const shirtRect = shirtObj ? shirtObj.getBoundingRect() : null;

        // Persist name and number globally
        if (nameObj && view === 'back') {
            textRef.current[view].name = pickTextProps(nameObj, shirtObj, shirtRect);
        }
        if (numberObj && view === 'back') {
            textRef.current[view].number = pickTextProps(numberObj, shirtObj, shirtRect);
        }

        // Persist custom texts & logos into the global template too,
        // so they act as defaults for players without per-player overrides.
        const pickLogoSrc = (logo: ExtendedFabricImage): string => {
            // Use custom property first, fall back to Fabric's getSrc()
            const custom = (logo as any).src || '';
            if (custom) return custom;
            if (typeof (logo as any).getSrc === 'function') return (logo as any).getSrc() || '';
            return '';
        };



        const mapLogo = (logo: ExtendedFabricImage) => {
            let relLeft = null, relTop = null, relScaleX = null, relScaleY = null;
            if (shirtRect && shirtObj) {
                relLeft = (logo.left! - shirtRect.left) / shirtRect.width;
                relTop = (logo.top! - shirtRect.top) / shirtRect.height;
                relScaleX = logo.scaleX! / shirtObj.scaleX!;
                relScaleY = logo.scaleY! / shirtObj.scaleY!;
            }
            return {
                src: pickLogoSrc(logo),
                left: logo.left ?? 0,
                top: logo.top ?? 0,
                scaleX: logo.scaleX ?? 1,
                scaleY: logo.scaleY ?? 1,
                angle: logo.angle ?? 0,
                originX: 'center' as const,
                originY: 'center' as const,
                relLeft,
                relTop,
                relScaleX,
                relScaleY
            };
        };

        textRef.current[view].customTexts = customTexts.map(t => pickTextProps(t, shirtObj, shirtRect));
        textRef.current[view].customLogos = customLogos.map(mapLogo);
        const customElementsData = {
            customTexts: customTexts.map(t => pickTextProps(t, shirtObj, shirtRect)),
            customLogos: customLogos.map(mapLogo)
        };

        const playerKey = `jerseyDesigner:playerElements_${currentPlayer.playerName}_${currentPlayer.jerseyNumber}`;

        localforage.getItem<any>(playerKey).then(existingData => {
            const data = existingData || {};
            data[view] = customElementsData;

            // Check approximate size to avoid hitting storage limits silently (though IndexedDB limit is high)
            const dataToSave = JSON.stringify(data);
            if (dataToSave.length > 50 * 1024 * 1024) { // 50MB warning
                logger.error('Data exceeds safe limits');
                toast.error('Logos are extremely large. Performance may degrade.');
            }

            localforage.setItem(playerKey, data).catch(e => {
                logger.error('persistState: failed to save to localforage:', e);
                toast.error("Storage full! Failed to save player design. Please clear browser data.");
            });
        }).catch(e => {
            logger.error('persistState: failed to read localforage:', e);
            toast.error("Storage read error! Player design could not be loaded.");
        });

        saveGlobalTemplateDebounced();
    };

    // Track dragging/move to persist text positions live for all views
    useEffect(() => {
        if (!fabricCanvas) return;

        let persistTimer: ReturnType<typeof setTimeout>;
        const debouncedPersistState = () => {
            clearTimeout(persistTimer);
            persistTimer = setTimeout(() => {
                persistState();
            }, 100);
        };

        const handler = (opt: any) => {
            // BUG-C2 FIX: Check isLoadingViewRef FIRST — before any other condition —
            // to guarantee we never persist during a view rebuild, even if opt.target exists.
            if (isLoadingViewRef.current) return;
            if (!selectedPlayer || !fabricCanvas || !opt.target) return;
            if ((fabricCanvas as any).__isExporting) return;
            persistState();
        };

        const continuousHandler = (opt: any) => {
            if (!selectedPlayer || !fabricCanvas || !opt.target) return;
            if ((fabricCanvas as any).__isExporting) return;
            debouncedPersistState();
        };

        const movingHandler = (opt: any) => {
            const obj = opt.target;
            if (!obj || !fabricCanvas || (fabricCanvas as any).__isExporting) return;

            const name = (obj as any).name;
            if ((name === 'playerName' || name === 'jerseyNumber') && loadedViewRef.current === 'back') {
                const backImg = fabricCanvas.getObjects().find(o => (o as any).name === 'jerseyBack');
                if (backImg) {
                    const rect = backImg.getBoundingRect();
                    const centerX = rect.left + rect.width / 2;
                    obj.set({ left: centerX });
                    obj.setCoords();
                }
            }
        };

        fabricCanvas.on('object:added', handler);
        fabricCanvas.on('object:removed', handler);
        fabricCanvas.on('object:modified', handler);
        fabricCanvas.on('object:moving', continuousHandler);
        fabricCanvas.on('object:moving', movingHandler);
        fabricCanvas.on('object:scaling', continuousHandler);
        fabricCanvas.on('object:rotating', continuousHandler);

        return () => {
            fabricCanvas.off('object:added', handler);
            fabricCanvas.off('object:removed', handler);
            fabricCanvas.off('object:modified', handler);
            fabricCanvas.off('object:moving', continuousHandler);
            fabricCanvas.off('object:moving', movingHandler);
            fabricCanvas.off('object:scaling', continuousHandler);
            fabricCanvas.off('object:rotating', continuousHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fabricCanvas, selectedPlayer]);

    // Load global template once on mount (applies to all players)
    useEffect(() => {
        loadGlobalTemplate();
    }, []);

    // Prevent race conditions when switching views quickly
    const loadTokenRef = useRef(0);
    const loadJerseyView = async (view?: typeof currentView, activeObjectInfo?: any) => {
        if (!fabricCanvas) return;

        // Cache the loading state before we set it to true
        const wasLoading = isLoadingViewRef.current;

        loadTokenRef.current++;
        const myToken = loadTokenRef.current;
        // Block object:added → persistState during the entire async load so that
        // adding the jersey image does NOT wipe out stored logo data.
        isLoadingViewRef.current = true;

        const activeView = view || currentView;

        // Persist current view objects before clearing (to keep manual placements)
        // Guard: Do not save if we were ALREADY in the middle of loading a view (prevents race conditions)
        if (isCanvasInitializedRef.current && !wasLoading) {
            try {
                const prevView = loadedViewRef.current;
                const prevPlayer = loadedPlayerRef.current;
                // BUG-C3 FIX: Capture the player KEY (identity string) immediately before
                // the first await, so even if loadedPlayerRef.current changes mid-async,
                // we always write to the correct player's storage slot.
                const prevPlayerKey = prevPlayer
                    ? `jerseyDesigner:playerElements_${prevPlayer.playerName}_${prevPlayer.jerseyNumber}`
                    : null;
                const objs = fabricCanvas.getObjects();
                const nameObjPrev = objs.find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
                const numberObjPrev = objs.find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;
                const customTextsPrev = objs.filter(o => (o as ExtendedFabricText).name === 'customText') as ExtendedFabricText[];
                const customLogosPrev = objs.filter(o => (o as ExtendedFabricImage).name === 'customLogo') as ExtendedFabricImage[];

                if (!textRef.current[prevView]) {
                    textRef.current[prevView] = {};
                }

                // Persist the current view's custom elements to the local player store before clearing
                const shirtObj = fabricCanvas.getObjects().find(o => {
                    const n = (o as ExtendedFabricImage).name;
                    return n === 'jerseyFront' || n === 'jerseyBack' ||
                        n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
                }) as ExtendedFabricImage | undefined;
                const shirtRect = shirtObj ? shirtObj.getBoundingRect() : null;

                if (nameObjPrev) textRef.current[prevView].name = pickTextProps(nameObjPrev, shirtObj, shirtRect);
                if (numberObjPrev) textRef.current[prevView].number = pickTextProps(numberObjPrev, shirtObj, shirtRect);

                const mapLogo = (logo: ExtendedFabricImage) => {
                    let relLeft = null, relTop = null, relScaleX = null, relScaleY = null;
                    if (shirtRect && shirtObj) {
                        relLeft = (logo.left! - shirtRect.left) / shirtRect.width;
                        relTop = (logo.top! - shirtRect.top) / shirtRect.height;
                        relScaleX = logo.scaleX! / shirtObj.scaleX!;
                        relScaleY = logo.scaleY! / shirtObj.scaleY!;
                    }
                    return {
                        src: (logo as any).src || ((logo as any).getSrc?.() ?? '') || '',
                        left: logo.left ?? 0,
                        top: logo.top ?? 0,
                        scaleX: logo.scaleX ?? 1,
                        scaleY: logo.scaleY ?? 1,
                        angle: logo.angle ?? 0,
                        originX: 'center',
                        originY: 'center',
                        relLeft,
                        relTop,
                        relScaleX,
                        relScaleY
                    };
                };

                const customElementsData = {
                    customTexts: customTextsPrev.map(t => pickTextProps(t, shirtObj, shirtRect)),
                    customLogos: customLogosPrev.map(mapLogo)
                };

                // Also update global template ref so logos propagate to all players
                textRef.current[prevView].customTexts = customElementsData.customTexts;
                textRef.current[prevView].customLogos = customElementsData.customLogos as any;

                if (prevPlayerKey) {
                    try {
                        const existingData: any = await localforage.getItem(prevPlayerKey) || {};
                        existingData[prevView] = customElementsData;
                        await localforage.setItem(prevPlayerKey, existingData);
                    } catch (e) {
                        logger.error('loadJerseyView: failed to save player elements:', e);
                    }
                }

                saveGlobalTemplateDebounced();
            } catch (_ignored) { /* intentionally ignored - global template save is best-effort */ }
        }

        // Get persisted text for current view globally
        const existingNameObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'playerName') as ExtendedFabricText | undefined;
        const existingNumberObj = fabricCanvas.getObjects().find(o => (o as ExtendedFabricText).name === 'jerseyNumber') as ExtendedFabricText | undefined;
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

                        // Scale jersey to fit the player's size-proportional bounding box
                        const { maxW, maxH } = getSizeDisplayBox(selectedPlayer?.size, fabricCanvas.width!, fabricCanvas.height!, 'body');
                        const scaleX = maxW / jerseyImg.width!;
                        const scaleY = maxH / jerseyImg.height!;

                        jerseyImg.set({
                            scaleX: scaleX,
                            scaleY: scaleY,
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
                        (jerseyImg as any).src = jerseyImageUrl;

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

                        const { maxW: slvMaxW, maxH: slvMaxH } = getSizeDisplayBox(selectedPlayer?.size, fabricCanvas.width!, fabricCanvas.height!, 'sleeve', leftSleeve.width! / leftSleeve.height!);
                        const scaleX = slvMaxW / leftSleeve.width!;
                        const scaleY = slvMaxH / leftSleeve.height!;
                        leftSleeve.set({
                            scaleX: scaleX,
                            scaleY: scaleY,
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

                        const { maxW: rSlvMaxW, maxH: rSlvMaxH } = getSizeDisplayBox(selectedPlayer?.size, fabricCanvas.width!, fabricCanvas.height!, 'sleeve', rightSleeve.width! / rightSleeve.height!);
                        const scaleX = rSlvMaxW / rightSleeve.width!;
                        const scaleY = rSlvMaxH / rightSleeve.height!;
                        rightSleeve.set({
                            scaleX: scaleX,
                            scaleY: scaleY,
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

                        const { maxW: colMaxW, maxH: colMaxH } = getSizeDisplayBox(selectedPlayer?.size, fabricCanvas.width!, fabricCanvas.height!, 'collar');
                        const scaleX = colMaxW / collarImg.width!;
                        const scaleY = colMaxH / collarImg.height!;

                        collarImg.set({
                            scaleX: scaleX,
                            scaleY: scaleY,
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
                const currentShirt = fabricCanvas.getObjects().find(o => {
                    const n = (o as ExtendedFabricImage).name;
                    return n === 'jerseyFront' || n === 'jerseyBack' ||
                        n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
                }) as ExtendedFabricImage | undefined;
                const rect = currentShirt ? currentShirt.getBoundingRect() : null;

                // Player name (preserve previous placement/style if existed)
                const defaultNameTop = 103;
                let nameProps = prevNameProps ?? {
                    text: selectedPlayer.playerName,
                    left: fabricCanvas.width! / 2,
                    top: defaultNameTop,
                    fontSize: 38,
                    fontFamily: defaultFont,
                    fill: defaultColor,
                    stroke: defaultStrokeWidth > 0 ? defaultStrokeColor : '',
                    strokeWidth: defaultStrokeWidth,
                    paintFirst: 'stroke',
                    textAlign: 'center' as const,
                    width: 960,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
                
                if (rect && nameProps.relLeft !== undefined && nameProps.relLeft !== null) {
                    nameProps = {
                        ...nameProps,
                        text: selectedPlayer.playerName,
                        left: rect.left + (nameProps.relLeft * rect.width),
                        top: rect.top + (nameProps.relTop! * rect.height),
                        fontSize: nameProps.relFontSize ? Math.round(nameProps.relFontSize * rect.height) : nameProps.fontSize,
                        scaleY: nameProps.relFontSize ? 1 : nameProps.scaleY,
                        scaleX: nameProps.relFontSize ? (nameProps.relAspectScale ?? 1) : nameProps.scaleX,
                    };
                }

                const nameText = new FabricText(selectedPlayer.playerName, {
                    ...nameProps,
                    objectCaching: false,
                }) as ExtendedFabricText;
                nameText.name = 'playerName';
                nameText.set({ fontWeight: 'bold', selectable: true });
                fabricCanvas.add(nameText);

                // Jersey number (preserve previous placement/style if existed)
                const defaultNumberTop = 257;
                let numberProps = prevNumberProps ?? {
                    text: selectedPlayer.jerseyNumber,
                    left: fabricCanvas.width! / 2,
                    top: defaultNumberTop,
                    fontSize: 115,
                    fontFamily: defaultFont,
                    fill: defaultColor,
                    stroke: defaultStrokeWidth > 0 ? defaultStrokeColor : '',
                    strokeWidth: defaultStrokeWidth,
                    paintFirst: 'stroke',
                    textAlign: 'center' as const,
                    height: 720,
                    originX: 'center' as const,
                    originY: 'center' as const,
                };
                
                if (rect && numberProps.relLeft !== undefined && numberProps.relLeft !== null) {
                    numberProps = {
                        ...numberProps,
                        text: selectedPlayer.jerseyNumber,
                        left: rect.left + (numberProps.relLeft * rect.width),
                        top: rect.top + (numberProps.relTop! * rect.height),
                        fontSize: numberProps.relFontSize ? Math.round(numberProps.relFontSize * rect.height) : numberProps.fontSize,
                        scaleY: numberProps.relFontSize ? 1 : numberProps.scaleY,
                        scaleX: numberProps.relFontSize ? (numberProps.relAspectScale ?? 1) : numberProps.scaleX,
                    };
                }

                const numberText = new FabricText(selectedPlayer.jerseyNumber, {
                    ...numberProps,
                    objectCaching: false,
                }) as ExtendedFabricText;
                numberText.name = 'jerseyNumber';
                numberText.set({ fontWeight: 'bold', selectable: true });
                fabricCanvas.add(numberText);

                // Auto-center only if no previous saved placement
                const shouldAutoCenter = !prevNameProps || !prevNumberProps;
                setTimeout(async () => {
                    if (myToken !== loadTokenRef.current) return;
                    await document.fonts.ready;
                    if (myToken !== loadTokenRef.current) return;

                    // Find jersey back image to compute bounds for text fitting
                    const backImg = fabricCanvas.getObjects().find(o => (o as ExtendedFabricImage).name === 'jerseyBack') as ExtendedFabricImage | undefined;

                    if (shouldAutoCenter && backImg) {
                        const rect = backImg.getBoundingRect();
                        const backTop = rect.top;
                        const backHeight = rect.height;
                        const centerX = rect.left + rect.width / 2; // center to jersey back
                        const nameTop = backTop + backHeight * backPlacementRef.current.nameTopRatio;
                        const numberTop = backTop + backHeight * backPlacementRef.current.numberTopRatio;
                        const nameFont = Math.max(16, Math.round(backHeight * backPlacementRef.current.nameFontRatio));
                        const numberFont = Math.max(48, Math.round(backHeight * backPlacementRef.current.numberFontRatio));
                        // Auto-fit name within back width with margins
                        const maxTextWidth = rect.width * 0.85;
                        nameText.set({ left: centerX, top: nameTop, originX: 'center', originY: 'center', textAlign: 'center', fontSize: nameFont });
                        fitTextToWidth(nameText, maxTextWidth, 12);
                        numberText.set({ left: centerX, top: numberTop, originX: 'center', originY: 'center', textAlign: 'center', fontSize: numberFont });
                        fitTextToWidth(numberText, maxTextWidth, 24);
                        // Persist the auto-center positions immediately without wiping out loading logos
                        if (!textRef.current[activeView]) textRef.current[activeView] = {};
                        textRef.current[activeView].name = pickTextProps(nameText, backImg, rect);
                        textRef.current[activeView].number = pickTextProps(numberText, backImg, rect);
                        saveGlobalTemplateDebounced();
                    } else if (backImg) {
                        // Even with saved placements, clamp text that overflows the jersey
                        const rect = backImg.getBoundingRect();
                        const maxTextWidth = rect.width * 0.85;
                        fitTextToWidth(nameText, maxTextWidth, 12);
                        fitTextToWidth(numberText, maxTextWidth, 24);
                    }
                    fabricCanvas.requestRenderAll();
                }, 0);
            }

            // Read per-player custom elements
            const playerKey = `jerseyDesigner:playerElements_${getPlayerIdentifier(selectedPlayer?.playerName || '', selectedPlayer?.jerseyNumber || '')}`;
            const playerElementsData: any = await localforage.getItem(playerKey) || {};

            const rawPlayerView = playerElementsData[activeView] || {};
            const globalTemplateView = textRef.current[activeView] || {};

            // Fallback to globalTemplate if player has no custom overrides for this view
            const viewPlayerElements = {
                customTexts: (rawPlayerView.customTexts !== undefined)
                    ? rawPlayerView.customTexts
                    : (globalTemplateView.customTexts || []),
                customLogos: (rawPlayerView.customLogos !== undefined)
                    ? rawPlayerView.customLogos
                    : (globalTemplateView.customLogos || []),
            };

            // Add custom texts for this view
            const customTexts = viewPlayerElements.customTexts || [];
            const customTextObjects = customTexts.map((customTextProps: any) => {
                const propsToUse = { ...customTextProps };
                
                const currentShirt = fabricCanvas.getObjects().find(o => {
                    const n = (o as ExtendedFabricImage).name;
                    return n === 'jerseyFront' || n === 'jerseyBack' ||
                        n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
                }) as ExtendedFabricImage | undefined;
                
                if (currentShirt && propsToUse.relLeft !== undefined && propsToUse.relLeft !== null) {
                    const rect = currentShirt.getBoundingRect();
                    propsToUse.left = rect.left + (propsToUse.relLeft * rect.width);
                    propsToUse.top = rect.top + (propsToUse.relTop * rect.height);
                    if (propsToUse.relFontSize) {
                        propsToUse.fontSize = Math.round(propsToUse.relFontSize * rect.height);
                        propsToUse.scaleY = 1;
                        propsToUse.scaleX = propsToUse.relAspectScale ?? 1;
                    }
                }

                const customText = new FabricText(propsToUse.text, {
                    ...propsToUse,
                    paintFirst: 'stroke',
                    objectCaching: false,
                }) as ExtendedFabricText;
                customText.name = 'customText';
                customText.set({ selectable: true });
                fabricCanvas.add(customText);
                return customText;
            });

            // Load custom logos for ALL views
            if (activeView === 'front' || activeView === 'back' || activeView === 'leftSleeve' || activeView === 'rightSleeve' || activeView === 'collar') {
                const customLogos = viewPlayerElements.customLogos || [];
                const customLogoPromises = customLogos.map(async (logoProps: any) => {
                    try {
                        if (logoProps.src) {
                            const logoImg = await FabricImage.fromURL(logoProps.src) as unknown as ExtendedFabricImage;
                            // Guard: if another loadJerseyView started while we were awaiting,
                            // discard this result to avoid adding logos to the wrong player's canvas.
                            if (myToken !== loadTokenRef.current) return null;
                            let targetLeft = logoProps.left;
                            let targetTop = logoProps.top;
                            let targetScaleX = logoProps.scaleX;
                            let targetScaleY = logoProps.scaleY;

                            // Find current shirt rect to compute relative positions
                            const currentShirt = fabricCanvas.getObjects().find(o => {
                                const n = (o as ExtendedFabricImage).name;
                                return n === 'jerseyFront' || n === 'jerseyBack' ||
                                    n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
                            }) as ExtendedFabricImage | undefined;

                            if (currentShirt && logoProps.relLeft !== undefined && logoProps.relLeft !== null) {
                                const rect = currentShirt.getBoundingRect();
                                targetLeft = rect.left + (logoProps.relLeft * rect.width);
                                targetTop = rect.top + (logoProps.relTop * rect.height);
                                
                                if (logoProps.relScaleX !== undefined && logoProps.relScaleX !== null) {
                                    targetScaleX = logoProps.relScaleX * currentShirt.scaleX!;
                                    targetScaleY = logoProps.relScaleY * currentShirt.scaleY!;
                                }
                            }

                            logoImg.set({
                                left: targetLeft,
                                top: targetTop,
                                scaleX: targetScaleX,
                                scaleY: targetScaleY,
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

            // Player identity tag — monospace bold text snapped to bottom-right corner of jersey
            if (selectedPlayer) {
                const shirtObj = fabricCanvas.getObjects().find(o => {
                    const n = (o as ExtendedFabricImage).name;
                    return n === 'jerseyFront' || n === 'jerseyBack' ||
                        n === 'leftSleeve' || n === 'rightSleeve' || n === 'collar';
                }) as ExtendedFabricImage | undefined;

                addPlayerIdentityLabel({
                    canvas: fabricCanvas,
                    player: selectedPlayer,
                    targetImage: shirtObj,
                });
            }

            if (myToken !== loadTokenRef.current) return;
            loadedViewRef.current = activeView;
            loadedPlayerRef.current = selectedPlayer;
            isCanvasInitializedRef.current = true;

            if (activeObjectInfo) {
                const newObjs = fabricCanvas.getObjects();
                const match = newObjs.find(obj =>
                    (obj as any).name === activeObjectInfo.name &&
                    obj.type === activeObjectInfo.type &&
                    (activeObjectInfo.text === undefined || (obj as any).text === activeObjectInfo.text)
                );
                if (match) {
                    fabricCanvas.setActiveObject(match);
                }
            }
            fabricCanvas.renderAll();
        } catch (error) {
            // Silent failure to avoid noisy notifications; log only for debugging
            logger.error('Canvas loading error:', error);
        } finally {
            // Always re-enable user-driven persistState once loading is done
            isLoadingViewRef.current = false;
        }
    };

    // Note: export functions were removed to fix duplicate points logic and out-of-sync DPI configurations.
    // All exports are now strictly handled by ExportPanel.tsx via Step 4.

    const handleDeleteSelected = () => {
        if (!fabricCanvas) return;
        const activeObjects = fabricCanvas.getActiveObjects();

        if (activeObjects.length > 0) {
            let deletedCount = 0;
            activeObjects.forEach((obj) => {
                const extendedObj = obj as ExtendedFabricText | ExtendedFabricImage;
                // Only allow deleting custom logos or custom text
                if (extendedObj.name === 'customLogo' || extendedObj.name === 'customText') {
                    fabricCanvas.remove(obj);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                fabricCanvas.discardActiveObject();
                fabricCanvas.requestRenderAll();
                saveGlobalTemplateDebounced(); // Save global template
                toast.success(`Removed ${deletedCount} item(s)`);
            } else {
                toast.error("Can only delete custom logos and text");
            }
        } else {
            toast.info("Select a custom logo or text to delete");
        }
    };

    const applyCustomElementsToAll = async () => {
        if (!selectedPlayer) return;
        const playerKey = `jerseyDesigner:playerElements_${getPlayerIdentifier(selectedPlayer.playerName, selectedPlayer.jerseyNumber)}`;
        const parsedData: any = await localforage.getItem(playerKey);

        if (!parsedData) {
            toast.info("No custom graphic/text elements placed on this player to apply.");
            return;
        }

        if (playerData.length === 0) {
            toast.error("No players found to apply customizations.");
            return;
        }

        if (fabricCanvas) {
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
        }

        try {
            // 1. Merge custom elements into the global template ref and save to localforage
            // We MUST NOT overwrite textRef.current entirely, because it contains `name` and `number` which aren't in parsedData!
            Object.keys(parsedData).forEach(viewKey => {
                if (!textRef.current[viewKey]) {
                    textRef.current[viewKey] = {};
                }
                textRef.current[viewKey].customTexts = parsedData[viewKey].customTexts;
                textRef.current[viewKey].customLogos = parsedData[viewKey].customLogos;
            });
            await localforage.setItem('jerseyDesigner:globalTemplate', textRef.current);

            // 2. Remove all player-specific overrides for all other players
            // to ensure they fall back to the global template and don't take up duplicate space.
            await Promise.all(playerData.map(p => {
                const pKey = `jerseyDesigner:playerElements_${getPlayerIdentifier(p.playerName, p.jerseyNumber)}`;
                return localforage.removeItem(pKey);
            }));

            toast.success(`Custom design applied to all ${playerData.length} players!`);
        } catch (e) {
            logger.error("Failed to apply custom elements to all:", e);
            toast.error("Failed to apply customizations to all players.");
        }
    };

    // Listen for Delete key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent triggering if user is typing in an input field or contenteditable (but let Fabric handle its own text editing)
            const activeEl = document.activeElement;
            if (activeEl) {
                const tag = activeEl.tagName.toLowerCase();
                const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
                const isEditable = (activeEl as HTMLElement).isContentEditable;
                if (isInput || isEditable) return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (fabricCanvas && fabricCanvas.getActiveObject()) {
                    // Only trigger if a fabric text isn't actively being edited
                    const activeObj = fabricCanvas.getActiveObject() as FabricText;
                    if (!activeObj.isEditing) {
                        e.preventDefault();
                        handleDeleteSelected();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fabricCanvas]);

    const handleZoomIn = () => {
        if (!fabricCanvas) return;
        const newZoom = Math.min(zoom * 1.2, 3);
        fabricCanvas.setZoom(newZoom);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
    };

    const handleZoomOut = () => {
        if (!fabricCanvas) return;
        const newZoom = Math.max(zoom / 1.2, 0.3);
        fabricCanvas.setZoom(newZoom);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
    };

    const handleResetView = () => {
        if (!fabricCanvas) return;
        fabricCanvas.setZoom(1);
        fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
        onZoomChange?.(1);
    };

    const togglePanMode = () => {
        if (!fabricCanvas) return;

        if (isPanMode) {
            // Disable pan mode
            fabricCanvas.selection = true;
            fabricCanvas.off('mouse:down');
            fabricCanvas.off('mouse:move');
            fabricCanvas.off('mouse:up');
            setIsPanMode(false);
            toast.info("Pan mode disabled");
            return;
        }

        // Enable pan mode
        setIsPanMode(true);
        fabricCanvas.selection = false;
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        const mouseDownHandler = (opt: any) => {
            isDragging = true;
            lastPosX = opt.e.clientX;
            lastPosY = opt.e.clientY;
        };

        const mouseMoveHandler = (opt: any) => {
            if (!isDragging) return;
            const vpt = fabricCanvas.viewportTransform!;
            vpt[4] += opt.e.clientX - lastPosX;
            vpt[5] += opt.e.clientY - lastPosY;
            fabricCanvas.requestRenderAll();
            lastPosX = opt.e.clientX;
            lastPosY = opt.e.clientY;
        };

        const mouseUpHandler = () => {
            isDragging = false;
            fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
        };

        fabricCanvas.on('mouse:down', mouseDownHandler);
        fabricCanvas.on('mouse:move', mouseMoveHandler);
        fabricCanvas.on('mouse:up', mouseUpHandler);
        toast.info("Pan mode enabled — drag to pan, click again to disable");
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

        // Persist the new auto-centered positions immediately
        if (nameObj) nameObj.setCoords();
        if (numberObj) numberObj.setCoords();

        persistState();

        fabricCanvas.requestRenderAll();
        toast.success("Name and number positioned perfectly!");
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

    // React to colour changes
    useEffect(() => {
        if (!fabricCanvas || !defaultColor) return;
        let changed = false;
        fabricCanvas.getObjects().forEach(obj => {
            const extendedObj = obj as ExtendedFabricText;
            if (extendedObj.name === 'playerName' || extendedObj.name === 'jerseyNumber') {
                if (extendedObj.fill !== defaultColor) {
                    extendedObj.set('fill', defaultColor);
                    changed = true;
                }
            }
        });
        const views = ['front', 'back', 'leftSleeve', 'rightSleeve', 'collar'];
        views.forEach(view => {
            if (textRef.current[view]) {
                if (textRef.current[view].name) (textRef.current[view].name as any).fill = defaultColor;
                if (textRef.current[view].number) (textRef.current[view].number as any).fill = defaultColor;
            }
        });
        if (changed) {
            fabricCanvas.requestRenderAll();
            saveGlobalTemplate();
        }
    }, [defaultColor, fabricCanvas]);

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
                        disabled={!jerseyImages.collar}
                    >
                        Collar
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={centerFitBackNameNumber}
                        disabled={currentView !== 'back'}
                        title="Center name & number on back (like example)"
                    >
                        Auto Center
                    </Button>
                    {showTools && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowApplyAllConfirm(true)}
                            className="bg-black text-white ml-2 shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]"
                            title="Copy this player's custom text and logos to ALL players"
                        >
                            Apply Customizations to All
                        </Button>
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
                            <Button
                                variant={isPanMode ? 'default' : 'outline'}
                                size="sm"
                                onClick={togglePanMode}
                                title={isPanMode ? 'Click to exit pan mode' : 'Pan mode — drag to move canvas'}
                            >
                                <Move className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleResetView} title="Reset View">
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDeleteSelected} title="Delete Selected Layer (Del)">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                            <Button
                                variant={showCuttingOutline ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    const next = !showCuttingOutline;
                                    setShowCuttingOutline(next);
                                    onCuttingOutlineChange?.(next);
                                }}
                                title="Toggle cutting outline"
                            >
                                <Scissors className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Zoom: {Math.round(zoom * 100)}% | Export: PNG (450 DPI)
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
                    ? "Use the customization tools to add logos, adjust text, and personalize the design. Proceed to the next step for high-res exports."
                    : "Review your designs and switch between views. Click 'Continue to Customization' to proceed."}
            </div>

            {/* BUG-A2/U3 FIX: Confirmation dialog before destructively applying to all players */}
            <ConfirmationDialog
                open={showApplyAllConfirm}
                onOpenChange={setShowApplyAllConfirm}
                onConfirm={() => {
                    setShowApplyAllConfirm(false);
                    applyCustomElementsToAll();
                }}
                onCancel={() => setShowApplyAllConfirm(false)}
                title="Apply to All Players?"
                description={`This will copy the current player's custom logos and text to ALL ${playerData.length} players, overwriting any individual designs they have. This cannot be undone.`}
                confirmText="Yes, Apply to All"
                cancelText="Cancel"
                destructive={true}
            />
        </Card>
    );
};