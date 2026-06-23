// ─── Jersey Size Dimensions (W×L in inches) ──────────────────────────────────
// Source: Official GxDrip size chart

export interface JerseySizeDim {
    size: string;
    widthIn: number;   // Width in inches
    lengthIn: number;  // Length in inches
    sleeveWidthIn?: number;
    sleeveLengthIn?: number;
    collarLengthIn?: number;
    collarWidthIn?: number;
}

export const JERSEY_SIZE_DIMENSIONS: JerseySizeDim[] = [
    { size: '16', widthIn: 13.0, lengthIn: 18.0, sleeveLengthIn: 8, sleeveWidthIn: 4, collarLengthIn: 12.0, collarWidthIn: 2.0 },
    { size: '18', widthIn: 13.0, lengthIn: 18.0, sleeveLengthIn: 9, sleeveWidthIn: 5, collarLengthIn: 12.0, collarWidthIn: 2.0 },
    { size: '20', widthIn: 13.0, lengthIn: 19.0, sleeveLengthIn: 10, sleeveWidthIn: 5, collarLengthIn: 13.0, collarWidthIn: 2.0 },
    { size: '22', widthIn: 14.0, lengthIn: 20.0, sleeveLengthIn: 11, sleeveWidthIn: 6, collarLengthIn: 13.5, collarWidthIn: 2.0 },
    { size: '24', widthIn: 15.0, lengthIn: 21.0, sleeveLengthIn: 12, sleeveWidthIn: 6, collarLengthIn: 14.0, collarWidthIn: 2.0 },
    { size: '26', widthIn: 15.5, lengthIn: 21.5, sleeveLengthIn: 13, sleeveWidthIn: 7, collarLengthIn: 14.5, collarWidthIn: 2.0 },
    { size: '28', widthIn: 15.5, lengthIn: 22.5, sleeveLengthIn: 14, sleeveWidthIn: 7, collarLengthIn: 15.0, collarWidthIn: 2.0 },
    { size: '30', widthIn: 17.0, lengthIn: 24.0, sleeveLengthIn: 15, sleeveWidthIn: 7.5, collarLengthIn: 15.5, collarWidthIn: 2.0 },
    { size: '32', widthIn: 18.0, lengthIn: 26.0, sleeveLengthIn: 16, sleeveWidthIn: 8, collarLengthIn: 16.0, collarWidthIn: 2.0 },
    { size: '34', widthIn: 19.0, lengthIn: 27.0, sleeveLengthIn: 17, sleeveWidthIn: 8.5, collarLengthIn: 17.0, collarWidthIn: 2.0 },
    { size: '36', widthIn: 20.0, lengthIn: 28.0, sleeveLengthIn: 18, sleeveWidthIn: 9, collarLengthIn: 17.5, collarWidthIn: 2.0 },
    { size: '38', widthIn: 20.7, lengthIn: 29.0, sleeveLengthIn: 19, sleeveWidthIn: 9.5, collarLengthIn: 18.0, collarWidthIn: 2.0 },
    { size: '40', widthIn: 21.2, lengthIn: 30.0, sleeveLengthIn: 20, sleeveWidthIn: 10, collarLengthIn: 18.5, collarWidthIn: 2.0 },
    { size: '42', widthIn: 22.5, lengthIn: 31.0, sleeveLengthIn: 21, sleeveWidthIn: 10.5, collarLengthIn: 19.0, collarWidthIn: 2.0 },
    { size: '44', widthIn: 23.6, lengthIn: 31.4, sleeveLengthIn: 22, sleeveWidthIn: 11, collarLengthIn: 20.0, collarWidthIn: 2.0 },
    { size: '46', widthIn: 25.0, lengthIn: 33.0, sleeveLengthIn: 23, sleeveWidthIn: 12, collarLengthIn: 20.5, collarWidthIn: 2.0 },
    { size: '48', widthIn: 26.0, lengthIn: 34.0, sleeveLengthIn: 24, sleeveWidthIn: 13, collarLengthIn: 21.0, collarWidthIn: 2.0 },
    { size: '50', widthIn: 27.0, lengthIn: 35.0, sleeveLengthIn: 25, sleeveWidthIn: 13, collarLengthIn: 22.0, collarWidthIn: 2.0 },
];

/** All valid jersey sizes as strings */
export const ALLOWED_SIZES = JERSEY_SIZE_DIMENSIONS.map(d => d.size);

/** Look up a size's physical dimensions */
export const getSizeDim = (size: string): JerseySizeDim | undefined =>
    JERSEY_SIZE_DIMENSIONS.find(d => d.size === size.trim());

/**
 * Returns the canvas scale factor for a given size, relative to size 28
 * (size 28 = baseline 1.0 → 15.5" wide)
 */
export const getSizeScaleFactorFromDim = (size: string | undefined): number => {
    if (!size) return 1;
    const dim = getSizeDim(size);
    if (!dim) {
        // Graceful fallback for non-standard sizes
        const n = parseInt(size);
        if (isNaN(n)) return 1;
        const base = JERSEY_SIZE_DIMENSIONS.find(d => d.size === '28')!;
        // Linear interpolate from the table
        const closest = JERSEY_SIZE_DIMENSIONS.reduce((prev, cur) =>
            Math.abs(parseInt(cur.size) - n) < Math.abs(parseInt(prev.size) - n) ? cur : prev
        );
        return closest.widthIn / base.widthIn;
    }
    const base = getSizeDim('28')!;
    return dim.widthIn / base.widthIn;
};

/**
 * Computes the exact export multiplier so the canvas content
 * renders at the correct physical pixel dimensions for a given DPI.
 *
 * @param size       jersey size string (e.g. "38")
 * @param contentPx  pixel width of the design content on screen (from getBoundingRect)
 * @param dpi        target DPI (default 300)
 * @returns multiplier to pass to canvas.toDataURL()
 */
export const computeExportMultiplier = (
    size: string,
    contentPx: number,
    dpi: number = 300,
): number => {
    const dim = getSizeDim(size);
    // Target pixel width = physical width × DPI
    const targetWidth = dim ? dim.widthIn * dpi : contentPx; // fallback: no scaling
    if (contentPx <= 0) return 1;
    // Cap to ~16000px to avoid browser memory limits
    const raw = targetWidth / contentPx;
    const maxMul = 16000 / Math.max(contentPx, 1);
    return Math.min(raw, maxMul);
};

/** Format: "15.5 × 22.5 inches" */
export const formatSizeDim = (size: string): string => {
    const dim = getSizeDim(size);
    if (!dim) return '';
    return `${dim.widthIn} × ${dim.lengthIn} in`;
};

/**
 * Compute size-aware display dimensions for jersey images on canvas.
 * Maps the physical jersey size (width × length in inches) to proportional
 * pixel dimensions so the image fits the size's shape without stretching.
 */
export const getSizeDisplayBox = (
    playerSize: string | undefined,
    canvasWidth: number,
    canvasHeight: number,
    viewType: 'body' | 'sleeve' | 'collar' = 'body',
    imageAspectRatio: number = 1 // Pass the actual loaded image aspect ratio (width/height) to know orientation
): { maxW: number; maxH: number } => {
    const dim = getSizeDim(playerSize || '');

    if (viewType === 'sleeve') {
        if (!dim || !dim.sleeveWidthIn || !dim.sleeveLengthIn) return { maxW: 400, maxH: 400 };
        const ppi = 28;
        
        // Map the physical sleeve dimensions to pixels.
        // We ensure that the longer dimension from the chart maps to the longer dimension of the image.
        const longSide = Math.max(dim.sleeveLengthIn, dim.sleeveWidthIn) * ppi;
        const shortSide = Math.min(dim.sleeveLengthIn, dim.sleeveWidthIn) * ppi;
        
        let targetW, targetH;
        if (imageAspectRatio >= 1) {
            // Image is landscape (wider than tall)
            targetW = longSide;
            targetH = shortSide;
        } else {
            // Image is portrait (taller than wide)
            targetW = shortSide;
            targetH = longSide;
        }

        // Clamp to canvas limits with some breathing room
        const maxCanvasW = canvasWidth * 0.73;
        const maxCanvasH = canvasHeight * 0.88;
        if (targetW > maxCanvasW || targetH > maxCanvasH) {
            const clamp = Math.min(maxCanvasW / targetW, maxCanvasH / targetH);
            targetW *= clamp;
            targetH *= clamp;
        }
        
        // Ensure minimum visible size for the smallest jerseys
        const minW = canvasWidth * 0.33;
        const minH = canvasHeight * 0.45;
        if (targetW < minW && targetH < minH) {
            const boost = Math.max(minW / targetW, minH / targetH);
            targetW *= boost;
            targetH *= boost;
        }

        return { maxW: Math.round(targetW), maxH: Math.round(targetH) };
    }

    if (viewType === 'collar') {
        if (!dim || !dim.collarLengthIn || !dim.collarWidthIn) return { maxW: 560, maxH: 206 };
        const ppi = 28;
        
        let targetW = dim.collarLengthIn * ppi;
        let targetH = dim.collarWidthIn * ppi;
        
        // Clamp to canvas limits with some breathing room
        const maxCanvasW = canvasWidth * 0.73;
        const maxCanvasH = canvasHeight * 0.88;
        if (targetW > maxCanvasW || targetH > maxCanvasH) {
            const clamp = Math.min(maxCanvasW / targetW, maxCanvasH / targetH);
            targetW *= clamp;
            targetH *= clamp;
        }

        // Ensure minimum visible size for display purposes
        const minW = canvasWidth * 0.33;
        const minH = canvasHeight * 0.20;
        if (targetW < minW && targetH < minH) {
            const boost = Math.max(minW / targetW, minH / targetH);
            targetW *= boost;
            targetH *= boost;
        }
        
        return { maxW: Math.round(targetW), maxH: Math.round(targetH) };
    }

    // body (front / back)
    if (!dim) return { maxW: 640, maxH: 514 };

    // Fixed pixels-per-inch so that physical size maps to canvas pixels.
    const ppi = 28;
    let targetW = dim.widthIn * ppi;
    let targetH = dim.lengthIn * ppi;

    // Clamp to canvas limits with some breathing room
    const maxCanvasW = canvasWidth * 0.73;
    const maxCanvasH = canvasHeight * 0.88;
    if (targetW > maxCanvasW || targetH > maxCanvasH) {
        const clamp = Math.min(maxCanvasW / targetW, maxCanvasH / targetH);
        targetW *= clamp;
        targetH *= clamp;
    }

    // Ensure minimum visible size for the smallest jerseys
    const minW = canvasWidth * 0.33;
    const minH = canvasHeight * 0.45;
    if (targetW < minW && targetH < minH) {
        const boost = Math.max(minW / targetW, minH / targetH);
        targetW *= boost;
        targetH *= boost;
    }

    return { maxW: Math.round(targetW), maxH: Math.round(targetH) };
};
