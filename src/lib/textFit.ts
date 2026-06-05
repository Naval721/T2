import { Text as FabricText } from "fabric";

/**
 * Shrinks the fontSize of a Fabric Text object until its rendered width
 * fits within `maxWidth`. Prevents text from overflowing jersey boundaries.
 *
 * @param textObj  – The Fabric text object to resize
 * @param maxWidth – Maximum allowed rendered width (pixels)
 * @param minFont  – Floor font size (default 10) to avoid text becoming invisible
 */
export const fitTextToWidth = (
    textObj: FabricText,
    maxWidth: number,
    minFont: number = 10
): void => {
    if (maxWidth <= 0) return;

    // Account for scaleX if the user has manually stretched the object
    const scaleX = textObj.scaleX ?? 1;

    while (textObj.getScaledWidth() > maxWidth && (textObj.fontSize ?? 0) > minFont) {
        textObj.set({ fontSize: (textObj.fontSize ?? 12) - 1 });
    }

    // If even at minFont it still overflows, scale the object down uniformly
    const finalWidth = textObj.getScaledWidth();
    if (finalWidth > maxWidth) {
        const shrinkRatio = maxWidth / finalWidth;
        textObj.set({
            scaleX: (textObj.scaleX ?? 1) * shrinkRatio,
            scaleY: (textObj.scaleY ?? 1) * shrinkRatio,
        });
    }
};
