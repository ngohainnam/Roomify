import puter from "@heyputer/puter.js";

export const SETTINGS_KV_KEY = "roomify_user_settings";

export interface UserSettings {
    designStyle: string;
    colorPalette: string;
    lightingMood: string;
    furnitureStyle: string;
    extraInstructions: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
    designStyle: "",
    colorPalette: "",
    lightingMood: "",
    furnitureStyle: "",
    extraInstructions: "",
};

export const getSettings = async (): Promise<UserSettings> => {
    try {
        const saved = await puter.kv.get(SETTINGS_KV_KEY) as UserSettings | null;
        return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
};

export const saveSettings = async (settings: UserSettings): Promise<boolean> => {
    try {
        await puter.kv.set(SETTINGS_KV_KEY, settings);
        return true;
    } catch {
        return false;
    }
};

/**
 * Builds a prompt enhancement block from the user's settings.
 * This is APPENDED to the base ROOMIFY_RENDER_PROMPT, never replacing it.
 */
export const buildPromptEnhancement = (settings: UserSettings): string => {
    const parts: string[] = [];

    if (settings.designStyle.trim())
        parts.push(`- Architectural/interior design style: ${settings.designStyle.trim()}.`);

    if (settings.colorPalette.trim())
        parts.push(`- Preferred color palette / material tones: ${settings.colorPalette.trim()}.`);

    if (settings.lightingMood.trim())
        parts.push(`- Lighting mood: ${settings.lightingMood.trim()}.`);

    if (settings.furnitureStyle.trim())
        parts.push(`- Furniture and decor style: ${settings.furnitureStyle.trim()}.`);

    if (settings.extraInstructions.trim())
        parts.push(`- Additional instructions: ${settings.extraInstructions.trim()}`);

    if (parts.length === 0) return "";

    return `\n\nUSER STYLE PREFERENCES (apply on top of the rules above — do NOT override geometry or strict requirements):\n${parts.join("\n")}`;
};
