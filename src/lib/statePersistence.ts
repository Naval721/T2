import { JerseyImages, PlayerData } from '@/pages/Index';
import { toast } from 'sonner';

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
    sessionId: string;
    lastSave: string;
}

/**
 * Save the current state to localStorage
 */
export const saveState = (
    jerseyImages: JerseyImages,
    playerData: PlayerData[],
    currentStep: number,
    selectedPlayerIndex: number
): boolean => {
    try {
        const sessionId = getSessionId();
        const state: PersistedState = {
            jerseyImages,
            playerData,
            currentStep,
            selectedPlayerIndex,
            sessionId,
            lastSave: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.JERSEY_IMAGES, JSON.stringify(jerseyImages));
        localStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(playerData));
        localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
        localStorage.setItem(STORAGE_KEYS.SELECTED_PLAYER_INDEX, selectedPlayerIndex.toString());
        localStorage.setItem(STORAGE_KEYS.LAST_SAVE, state.lastSave);

        return true;
    } catch (error) {
        console.error('Failed to save state:', error);
        toast.error('Failed to save progress. Storage may be full.');
        return false;
    }
};

/**
 * Load the persisted state from localStorage
 */
export const loadState = (): Partial<PersistedState> | null => {
    try {
        const jerseyImagesStr = localStorage.getItem(STORAGE_KEYS.JERSEY_IMAGES);
        const playerDataStr = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
        const currentStepStr = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
        const selectedPlayerIndexStr = localStorage.getItem(STORAGE_KEYS.SELECTED_PLAYER_INDEX);
        const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);

        if (!jerseyImagesStr && !playerDataStr) {
            return null; // No saved state
        }

        return {
            jerseyImages: jerseyImagesStr ? JSON.parse(jerseyImagesStr) : {},
            playerData: playerDataStr ? JSON.parse(playerDataStr) : [],
            currentStep: currentStepStr ? parseInt(currentStepStr, 10) : 1,
            selectedPlayerIndex: selectedPlayerIndexStr ? parseInt(selectedPlayerIndexStr, 10) : 0,
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
export const clearState = (): void => {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Also clear canvas persistence data for all players
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gxdrip_canvas_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Wipe the global designer template so custom logos/texts don't ghost onto new sessions
        localStorage.removeItem('jerseyDesigner:globalTemplate');

    } catch (error) {
        console.error('Failed to clear state:', error);
    }
};

/**
 * Get or create a session ID
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
export const hasSavedSession = (): boolean => {
    const jerseyImages = localStorage.getItem(STORAGE_KEYS.JERSEY_IMAGES);
    const playerData = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
    return !!(jerseyImages || playerData);
};

/**
 * Get the last save timestamp
 */
export const getLastSaveTime = (): Date | null => {
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    return lastSave ? new Date(lastSave) : null;
};

/**
 * Format the last save time for display
 */
export const formatLastSaveTime = (): string => {
    const lastSave = getLastSaveTime();
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
