import { JerseyImages, PlayerData } from '@/pages/Index';
import { toast } from 'sonner';
import localforage from 'localforage';

// Configure localforage to use IndexedDB explicitly if possible
localforage.config({
    name: 'GxStudioStitch',
    storeName: 'gxdrip_store',
    description: 'Storage for GxDrip Session Data'
});

const STORAGE_KEYS = {
    JERSEY_IMAGES: 'gxdrip_jersey_images',
    PLAYER_DATA: 'gxdrip_player_data',
    CURRENT_STEP: 'gxdrip_current_step',
    SELECTED_PLAYER_INDEX: 'gxdrip_selected_player',
    SESSION_ID: 'gxdrip_session_id',
    LAST_SAVE: 'gxdrip_last_save'
} as const;

export interface PersistedState {
    jerseyImages: JerseyImages;
    playerData: PlayerData[];
    currentStep: number;
    selectedPlayerIndex: number;
    defaultFont?: string;
    defaultColor?: string;
    sessionId: string;
    lastSave: string;
}

export interface CanvasObject {
    type: 'text' | 'image';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    name?: string;
    src?: string;
}

export interface PlayerCanvasData {
    playerIdentifier: string;
    objects: CanvasObject[];
    timestamp: string;
}

/**
 * Save the current state to localforage
 */
export const saveState = async (
    jerseyImages: JerseyImages,
    playerData: PlayerData[],
    currentStep: number,
    selectedPlayerIndex: number,
    defaultFont?: string,
    defaultColor?: string
): Promise<boolean> => {
    try {
        const sessionId = getSessionId();
        const lastSave = new Date().toISOString();

        await localforage.setItem(STORAGE_KEYS.JERSEY_IMAGES, jerseyImages);
        await localforage.setItem(STORAGE_KEYS.PLAYER_DATA, playerData);
        await localforage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep);
        await localforage.setItem(STORAGE_KEYS.SELECTED_PLAYER_INDEX, selectedPlayerIndex);
        if (defaultFont) await localforage.setItem('gxdrip_default_font', defaultFont);
        if (defaultColor) await localforage.setItem('gxdrip_default_color', defaultColor);
        await localforage.setItem(STORAGE_KEYS.LAST_SAVE, lastSave);

        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        toast.error('Failed to save progress. Storage error.');
        return false;
    }
};

/**
 * Load the persisted state from localforage
 */
export const loadState = async (): Promise<Partial<PersistedState> | null> => {
    try {
        const jerseyImages = await localforage.getItem<JerseyImages>(STORAGE_KEYS.JERSEY_IMAGES);
        const playerData = await localforage.getItem<PlayerData[]>(STORAGE_KEYS.PLAYER_DATA);
        const currentStep = await localforage.getItem<number>(STORAGE_KEYS.CURRENT_STEP);
        const selectedPlayerIndex = await localforage.getItem<number>(STORAGE_KEYS.SELECTED_PLAYER_INDEX);
        const defaultFont = await localforage.getItem<string>('gxdrip_default_font');
        const defaultColor = await localforage.getItem<string>('gxdrip_default_color');
        const lastSave = await localforage.getItem<string>(STORAGE_KEYS.LAST_SAVE);

        if (!jerseyImages && (!playerData || playerData.length === 0)) {
            return null; // No saved state
        }

        return {
            jerseyImages: jerseyImages || {},
            playerData: playerData || [],
            currentStep: currentStep || 1,
            selectedPlayerIndex: selectedPlayerIndex || 0,
            defaultFont: defaultFont || undefined,
            defaultColor: defaultColor || undefined,
            sessionId: getSessionId(),
            lastSave: lastSave || undefined
        };
    } catch (error) {
        console.error('Failed to load state:', error);
        toast.error('Failed to load previous session. Starting fresh.');
        return null;
    }
};

/**
 * Clear all persisted state
 */
export const clearState = async (): Promise<void> => {
    try {
        await Promise.all(
            Object.values(STORAGE_KEYS).map(key => localforage.removeItem(key))
        );
        await localforage.removeItem('gxdrip_default_font');
        await localforage.removeItem('gxdrip_default_color');

        // Also clear canvas persistence data for all players
        const keys = await localforage.keys();
        const keysToRemove = keys.filter(key => 
            key.startsWith('gxdrip_canvas_') || 
            key.startsWith('jerseyDesigner:playerElements_')
        );
        
        await Promise.all(keysToRemove.map(key => localforage.removeItem(key)));

        // Wipe the global designer template so custom logos/texts don't ghost onto new sessions
        await localforage.removeItem('jerseyDesigner:globalTemplate');

    } catch (error) {
        console.error('Failed to clear state:', error);
    }
};

/**
 * Get or create a session ID
 * Note: keeping this synchronous using localStorage is fine since it's just a tiny string
 */
export const getSessionId = (): string => {
    let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    return sessionId;
};

/**
 * Check if there's a saved session
 */
export const hasSavedSession = async (): Promise<boolean> => {
    const jerseyImages = await localforage.getItem(STORAGE_KEYS.JERSEY_IMAGES);
    const playerData = await localforage.getItem<any[]>(STORAGE_KEYS.PLAYER_DATA);
    return !!(jerseyImages || (playerData && playerData.length > 0));
};

/**
 * Get the last save timestamp
 */
export const getLastSaveTime = async (): Promise<Date | null> => {
    const lastSave = await localforage.getItem<string>(STORAGE_KEYS.LAST_SAVE);
    return lastSave ? new Date(lastSave) : null;
};

/**
 * Format the last save time for display
 */
export const formatLastSaveTime = async (): Promise<string> => {
    const lastSave = await getLastSaveTime();
    if (!lastSave) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSave.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * Generate a unique player identifier from player name and jersey number
 */
const getPlayerIdentifier = (playerName: string, jerseyNumber: string): string => {
    return `${playerName}_${jerseyNumber}`.replace(/\s+/g, '_');
};

/**
 * Save canvas objects for a specific player
 */
export const savePlayerCanvasObjects = async (
    playerName: string,
    jerseyNumber: string,
    objects: CanvasObject[]
): Promise<boolean> => {
    try {
        const playerIdentifier = getPlayerIdentifier(playerName, jerseyNumber);
        const key = `gxdrip_canvas_${playerIdentifier}`;

        const data: PlayerCanvasData = {
            playerIdentifier,
            objects,
            timestamp: new Date().toISOString()
        };

        await localforage.setItem(key, data);
        return true;
    } catch (error) {
        console.error('Failed to save player canvas objects:', error);
        return false;
    }
};

/**
 * Load canvas objects for a specific player
 */
export const loadPlayerCanvasObjects = async (
    playerName: string,
    jerseyNumber: string
): Promise<CanvasObject[]> => {
    try {
        const playerIdentifier = getPlayerIdentifier(playerName, jerseyNumber);
        const key = `gxdrip_canvas_${playerIdentifier}`;

        const data = await localforage.getItem<PlayerCanvasData>(key);
        return data?.objects || [];
    } catch (error) {
        console.error('Failed to load player canvas objects:', error);
        return [];
    }
};

/**
 * Clear canvas objects for a specific player
 */
export const clearPlayerCanvasObjects = async (
    playerName: string,
    jerseyNumber: string
): Promise<void> => {
    try {
        const playerIdentifier = getPlayerIdentifier(playerName, jerseyNumber);
        const key = `gxdrip_canvas_${playerIdentifier}`;
        await localforage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear player canvas objects:', error);
    }
};
