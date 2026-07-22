import { Canvas as FabricCanvas, Text as FabricText, Shadow, Image as FabricImage } from "fabric";
import type { PlayerData } from "@/pages/Index";

export interface PlayerIdentityOptions {
    canvas: FabricCanvas;
    player: PlayerData;
    targetImage?: FabricImage | null;
}

/**
 * Builds the text string for the player identity tag: NAME#NUMBER_SZSIZE_CUSTOMTAG
 */
export const createPlayerIdentityLabelText = (player: PlayerData): string => {
    const labelParts: string[] = [
        player.playerName.replace(/\s+/g, '').toUpperCase(),
        `#${player.jerseyNumber}`,
        `SZ${player.size.replace(/\s+/g, '').toUpperCase()}`,
    ];
    if (player.customTag && player.customTag.trim()) {
        labelParts.push(player.customTag.replace(/\s+/g, '').toUpperCase());
    }
    return labelParts.join('');
};

/**
 * Creates and attaches the exact player identity code label (in crisp monospace bold font
 * with white drop shadow) to the specified Fabric canvas, snapped to the bottom-right
 * corner of the jersey bounds.
 */
export const addPlayerIdentityLabel = ({
    canvas,
    player,
    targetImage,
}: PlayerIdentityOptions): FabricText => {
    const labelText = createPlayerIdentityLabelText(player);

    let labelLeft = 12;
    let labelTop = (canvas.height ?? 720) - 10;
    let originX: 'left' | 'right' = 'left';
    const originY = 'bottom' as const;

    if (targetImage) {
        const rect = targetImage.getBoundingRect();
        labelLeft = rect.left + rect.width - 8;
        labelTop = rect.top + rect.height - 8;
        originX = 'right';
    }

    const playerLabel = new FabricText(labelText, {
        left: labelLeft,
        top: labelTop,
        fontSize: 7,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fill: '#000000',
        opacity: 1.0,
        selectable: false,
        evented: false,
        originX,
        originY,
        objectCaching: false,
    });

    playerLabel.shadow = new Shadow({
        color: 'rgba(255, 255, 255, 0.95)',
        blur: 5,
        offsetX: 0,
        offsetY: 0,
    });

    (playerLabel as any).name = 'playerIdentity';
    canvas.add(playerLabel);
    return playerLabel;
};
