import { useNavigate, useOutletContext } from "react-router";
import { useEffect, useState } from "react";
import { Box, Save, RotateCcw, X, Sliders } from "lucide-react";
import Button from "../../components/ui/Button";
import {
    getSettings,
    saveSettings,
    DEFAULT_SETTINGS,
    type UserSettings,
} from "../../lib/settings.action";
import { ROOMIFY_RENDER_PROMPT } from "../../lib/constants";

const STYLE_PRESETS = [
    "Scandinavian", "Japandi", "Mid-Century Modern", "Industrial",
    "Minimalist", "Bohemian", "Contemporary", "Art Deco", "Coastal", "Rustic",
];

const LIGHTING_PRESETS = [
    "Bright neutral daylight", "Warm golden hour", "Cool overcast",
    "Dramatic side lighting", "Soft diffused light", "Night with artificial lighting",
];

const FURNITURE_PRESETS = [
    "Modern & sleek", "Vintage & retro", "Rustic & reclaimed wood",
    "Luxury & high-end", "Minimalist & sparse", "Maximalist & eclectic",
];

interface FieldProps {
    label: string;
    hint: string;
    presets?: string[];
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    multiline?: boolean;
}

const SettingField = ({ label, hint, presets, value, onChange, placeholder, multiline }: FieldProps) => (
    <div className="setting-field">
        <label className="field-label">{label}</label>
        <p className="field-hint">{hint}</p>
        {presets && (
            <div className="presets">
                {presets.map(p => (
                    <button
                        key={p}
                        type="button"
                        className={`preset-chip ${value === p ? 'active' : ''}`}
                        onClick={() => onChange(value === p ? '' : p)}
                    >
                        {p}
                    </button>
                ))}
            </div>
        )}
        {multiline ? (
            <textarea
                className="field-input"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
            />
        ) : (
            <input
                type="text"
                className="field-input"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        )}
    </div>
);

export default function Settings() {
    const navigate = useNavigate();
    const { isSignedIn } = useOutletContext<AuthContext>();

    const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getSettings().then(s => {
            setSettings(s);
            setIsLoading(false);
        });
    }, []);

    const set = (key: keyof UserSettings) => (val: string) =>
        setSettings(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const ok = await saveSettings(settings);
        setIsSaving(false);
        if (ok) {
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2000);
        }
    };

    const handleReset = () => setSettings({ ...DEFAULT_SETTINGS });

    const previewPrompt = ROOMIFY_RENDER_PROMPT + buildPreview(settings);

    return (
        <div className="settings-page">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="exit">
                    <X className="icon" /> Back to Home
                </Button>
            </nav>

            <div className="settings-body">
                <div className="settings-header">
                    <div className="settings-title">
                        <Sliders className="title-icon" />
                        <div>
                            <h1>AI Style Settings</h1>
                            <p>Customize how Roomify's AI interprets and renders your floor plans.</p>
                        </div>
                    </div>
                </div>

                {!isSignedIn && (
                    <div className="settings-notice">
                        Sign in to save your settings. Changes made now will be lost on refresh.
                    </div>
                )}

                <div className="settings-layout">
                    <div className="settings-form">
                        <SettingField
                            label="Which design style are you following?"
                            hint="Pick a preset or type your own. This sets the overall aesthetic language."
                            presets={STYLE_PRESETS}
                            value={settings.designStyle}
                            onChange={set('designStyle')}
                            placeholder="e.g. Scandinavian, Japandi, Art Deco..."
                        />

                        <SettingField
                            label="What color palette or material tones do you prefer?"
                            hint="Describe the dominant colors, textures, or material family you want to see."
                            value={settings.colorPalette}
                            onChange={set('colorPalette')}
                            placeholder="e.g. Warm oak wood, white walls, terracotta accents..."
                        />

                        <SettingField
                            label="What lighting mood should the render have?"
                            hint="Lighting dramatically changes the feel of a space."
                            presets={LIGHTING_PRESETS}
                            value={settings.lightingMood}
                            onChange={set('lightingMood')}
                            placeholder="e.g. Warm golden hour, bright neutral daylight..."
                        />

                        <SettingField
                            label="What furniture and decor style do you want?"
                            hint="This guides how icons in your floor plan are rendered into 3D objects."
                            presets={FURNITURE_PRESETS}
                            value={settings.furnitureStyle}
                            onChange={set('furnitureStyle')}
                            placeholder="e.g. Modern & sleek, Vintage & retro..."
                        />

                        <SettingField
                            label="Any additional instructions for the AI?"
                            hint="Add anything else you want the AI to keep in mind. Be specific."
                            value={settings.extraInstructions}
                            onChange={set('extraInstructions')}
                            placeholder="e.g. Add potted plants near windows. Use polished concrete floors in the kitchen."
                            multiline
                        />

                        <div className="form-actions">
                            <Button variant="ghost" size="sm" onClick={handleReset} className="reset-btn">
                                <RotateCcw size={14} className="mr-1" /> Reset to defaults
                            </Button>
                            <Button size="md" onClick={handleSave} disabled={isSaving} className="save-btn">
                                <Save size={14} className="mr-1" />
                                {isSaving ? 'Saving…' : savedOk ? '✓ Saved!' : 'Save Settings'}
                            </Button>
                        </div>
                    </div>

                    <div className="prompt-preview">
                        <div className="preview-header">
                            <h3>Live Prompt Preview</h3>
                            <p>This is the exact prompt that will be sent to the AI.</p>
                        </div>
                        <pre className="prompt-box">{isLoading ? 'Loading…' : previewPrompt}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

function buildPreview(settings: UserSettings): string {
    const parts: string[] = [];

    if (settings.designStyle.trim())
        parts.push(`Design style: ${settings.designStyle.trim()}.`);

    if (settings.colorPalette.trim())
        parts.push(`Color palette and materials: ${settings.colorPalette.trim()}.`);

    if (settings.lightingMood.trim())
        parts.push(`Lighting mood: ${settings.lightingMood.trim()}.`);

    if (settings.furnitureStyle.trim())
        parts.push(`Furniture style: ${settings.furnitureStyle.trim()}.`);

    if (settings.extraInstructions.trim())
        parts.push(`Extra details: ${settings.extraInstructions.trim()}`);

    if (parts.length === 0) {
        return `
        
USER STYLE PREFERENCES:
- Use a clean, minimal modern style with neutral colors and balanced daylight lighting.

IMPORTANT:
- These preferences ONLY affect visual styling.
- DO NOT change layout, structure, or geometry.
- DO NOT add or remove rooms, walls, doors, or windows.
`;
    }

    return `

USER STYLE PREFERENCES (STRICTLY SECONDARY TO ALL RULES ABOVE):

Apply the following ONLY as visual styling (materials, colors, lighting, decor):
${parts.map(p => `- ${p}`).join("\n")}

HARD CONSTRAINTS:
- These preferences MUST NOT modify layout or geometry.
- DO NOT move walls, resize rooms, or change structure.
- ONLY apply styles to surfaces and existing elements.
- If a preference conflicts with the floor plan → IGNORE the preference.

BEHAVIOR RULE:
- Prioritize geometric accuracy over aesthetics at all times.
- When unsure → apply minimal styling and preserve structure.

`;
}
