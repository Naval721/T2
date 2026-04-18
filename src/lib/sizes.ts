// ─── Jersey Size Dimensions (W×L in inches) ──────────────────────────────────
// Source: Official GxStudio size chart

export interface JerseySizeDim {
    size: string;
    widthIn: number;   // Width in inches
    lengthIn: number;  // Length in inches
}

export const JERSEY_SIZE_DIMENSIONS: JerseySizeDim[] = [
    { size: '16', widthIn: 13.0, lengthIn: 18.0 },
    { size: '18', widthIn: 13.0, lengthIn: 18.0 },
    { size: '20', widthIn: 13.0, lengthIn: 19.0 },
    { size: '22', widthIn: 14.0, lengthIn: 20.0 },
    { size: '24', widthIn: 15.0, lengthIn: 21.0 },
    { size: '26', widthIn: 15.5, lengthIn: 21.5 },
    { size: '28', widthIn: 15.5, lengthIn: 22.5 },
    { size: '30', widthIn: 17.0, lengthIn: 24.0 },
    { size: '32', widthIn: 18.0, lengthIn: 26.0 },
    { size: '34', widthIn: 19.0, lengthIn: 27.0 },
    { size: '36', widthIn: 20.0, lengthIn: 28.0 },
    { size: '38', widthIn: 20.7, lengthIn: 29.0 },
    { size: '40', widthIn: 21.2, lengthIn: 30.0 },
    { size: '42', widthIn: 22.5, lengthIn: 31.0 },
    { size: '44', widthIn: 23.6, lengthIn: 31.4 },
    { size: '46', widthIn: 25.0, lengthIn: 33.0 },
    { size: '48', widthIn: 26.0, lengthIn: 34.0 },
    { size: '50', widthIn: 27.0, lengthIn: 35.0 },
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
