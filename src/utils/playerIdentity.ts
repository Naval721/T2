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

    const playerLabel = new FabricText(labelText, {
        fontSize: 6, // Small — identity check only
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fill: '#000000',
        opacity: 0.75,
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
        objectCaching: true,
    });

    let labelLeft = 8;
    let labelTop = (canvas.height ?? 720) - 3 - (playerLabel.height || 0);

    if (targetImage) {
        const rect = targetImage.getBoundingRect();
        labelLeft = rect.left + rect.width - (playerLabel.width || 0) - 3;
        labelTop = rect.top + rect.height - (playerLabel.height || 0) - 3;
    }

    playerLabel.set({
        left: labelLeft,
        top: labelTop,
    });

    playerLabel.shadow = new Shadow({
        color: 'rgba(255, 255, 255, 0.95)',
        blur: 5,
        offsetX: 0,
        offsetY: 0,
    });

    (playerLabel as FabricText & { name?: string }).name = 'playerIdentity';
    canvas.add(playerLabel);
    return playerLabel;
};
