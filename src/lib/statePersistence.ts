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
    CURRENT_VIEW: 'gxdrip_current_view',
    ZOOM: 'gxdrip_zoom',
    CUTTING_OUTLINE: 'gxdrip_cutting_outline',
    SESSION_ID: 'gxdrip_session_id',
    LAST_SAVE: 'gxdrip_last_save'
} as const;

export type CanvasViewType = 'front' | 'back' | 'leftSleeve' | 'rightSleeve' | 'collar';

export interface PersistedState {
    jerseyImages: JerseyImages;
    playerData: PlayerData[];
    currentStep: number;
    selectedPlayerIndex: number;
    defaultFont?: string;
    defaultColor?: string;
    defaultStrokeColor?: string;
    defaultStrokeWidth?: number;
    currentView?: CanvasViewType;
    zoom?: number;
    cuttingOutline?: boolean;
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
    defaultColor?: string,
    defaultStrokeColor?: string,
    defaultStrokeWidth?: number,
    currentView?: CanvasViewType,
    zoom?: number,
    cuttingOutline?: boolean
): Promise<boolean> => {
    try {
        getSessionId(); // ensure session ID exists
        const lastSave = new Date().toISOString();

        await localforage.setItem(STORAGE_KEYS.JERSEY_IMAGES, jerseyImages);
        await localforage.setItem(STORAGE_KEYS.PLAYER_DATA, playerData);
        await localforage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep);
        await localforage.setItem(STORAGE_KEYS.SELECTED_PLAYER_INDEX, selectedPlayerIndex);
        // BUG-C6 FIX: use explicit undefined/null checks so empty strings and #FFFFFF save correctly
        if (defaultFont !== undefined && defaultFont !== null) await localforage.setItem('gxdrip_default_font', defaultFont);
        if (defaultColor !== undefined && defaultColor !== null) await localforage.setItem('gxdrip_default_color', defaultColor);
        if (defaultStrokeColor !== undefined && defaultStrokeColor !== null) await localforage.setItem('gxdrip_default_stroke_color', defaultStrokeColor);
        if (defaultStrokeWidth !== undefined && defaultStrokeWidth !== null) await localforage.setItem('gxdrip_default_stroke_width', defaultStrokeWidth);
        if (currentView !== undefined) await localforage.setItem(STORAGE_KEYS.CURRENT_VIEW, currentView);
        if (zoom !== undefined) await localforage.setItem(STORAGE_KEYS.ZOOM, zoom);
        if (cuttingOutline !== undefined) await localforage.setItem(STORAGE_KEYS.CUTTING_OUTLINE, cuttingOutline);
        await localforage.setItem(STORAGE_KEYS.LAST_SAVE, lastSave);

        // Mark this tab session as active so we can auto-restore on warm returns
        sessionStorage.setItem('gxdrip_active_session', '1');

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
        const defaultStrokeColor = await localforage.getItem<string>('gxdrip_default_stroke_color');
        const defaultStrokeWidth = await localforage.getItem<number>('gxdrip_default_stroke_width');
        const currentView = await localforage.getItem<CanvasViewType>(STORAGE_KEYS.CURRENT_VIEW);
        const zoom = await localforage.getItem<number>(STORAGE_KEYS.ZOOM);
        const cuttingOutline = await localforage.getItem<boolean>(STORAGE_KEYS.CUTTING_OUTLINE);
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
            defaultStrokeColor: defaultStrokeColor || undefined,
            defaultStrokeWidth: defaultStrokeWidth !== null ? defaultStrokeWidth : undefined,
            currentView: currentView || undefined,
            zoom: zoom || undefined,
            cuttingOutline: cuttingOutline !== null ? cuttingOutline : undefined,
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
 * Check if this is a warm return (user navigated away and back in the same tab session)
 */
export const isWarmReturn = (): boolean => {
    return sessionStorage.getItem('gxdrip_active_session') === '1';
};

/**
 * Clear all persisted state
 */
export const clearState = async (): Promise<void> => {
    // BUG-C1 FIX: Run each cleanup in its own try/catch so a failure in one
    // step does not prevent the others from running. Global template is always
    // cleared last so ghost logos cannot persist across sessions.

    // Step 1: Clear session/app keys
    try {
        await Promise.all(
            Object.values(STORAGE_KEYS).map(key => localforage.removeItem(key))
        );
        await localforage.removeItem('gxdrip_default_font');
        await localforage.removeItem('gxdrip_default_color');
        await localforage.removeItem('gxdrip_default_stroke_color');
        await localforage.removeItem('gxdrip_default_stroke_width');
        sessionStorage.removeItem('gxdrip_active_session');
    } catch (error) {
        console.error('Failed to clear session keys:', error);
    }

    // Step 2: BUG-D4 FIX: Clear canvas/player-element keys in isolated try/catch
    try {
        const keys = await localforage.keys();
        const keysToRemove = keys.filter(key =>
            key.startsWith('gxdrip_canvas_') ||
            key.startsWith('jerseyDesigner:playerElements_')
        );
        if (keysToRemove.length > 0) {
            await Promise.all(keysToRemove.map(key => localforage.removeItem(key)));
        }
    } catch (error) {
        console.error('Failed to clear player canvas keys:', error);
    }

    // Step 3: BUG-C1 FIX: Always clear global template — guaranteed, even if step 2 failed
    try {
        await localforage.removeItem('jerseyDesigner:globalTemplate');
    } catch (error) {
        console.error('Failed to clear global template:', error);
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
    const playerData = await localforage.getItem<PlayerData[]>(STORAGE_KEYS.PLAYER_DATA);
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
