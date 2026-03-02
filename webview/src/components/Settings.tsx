import React from "react";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        enableShadows: boolean;
        artworkShape: "square" | "circle";
        errorSoundEnabled: boolean;
        errorSoundCooldown: number; // milliseconds, 0 = no limit
        errorSoundDeduplication: boolean; // per-file deduplication
    };
    customSoundName?: string;
    onUpdateSettings: (settings: {
        enableShadows: boolean;
        artworkShape: "square" | "circle";
        errorSoundEnabled: boolean;
        errorSoundCooldown: number;
        errorSoundDeduplication: boolean;
    }) => void;
    onBrowseErrorSound: () => void;
    onClearErrorSound: () => void;
    onTestErrorSound: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    settings,
    customSoundName,
    onUpdateSettings,
    onBrowseErrorSound,
    onClearErrorSound,
    onTestErrorSound,
}) => {
    if (!isOpen) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal__header">
                    <h2>Settings</h2>
                    <button
                        className="settings-modal__close"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="settings-modal__content">
                    {/* Shadows */}
                    <div className="settings-item">
                        <label className="settings-item__label">
                            <span>Enable Shadows</span>
                            <span className="settings-item__description">Apply shadow effects to album art</span>
                        </label>
                        <button
                            className={`settings-toggle ${settings.enableShadows ? "settings-toggle--on" : ""}`}
                            onClick={() => onUpdateSettings({ ...settings, enableShadows: !settings.enableShadows })}
                            aria-label={settings.enableShadows ? "Disable shadows" : "Enable shadows"}
                        >
                            <span className="settings-toggle__slider" />
                        </button>
                    </div>

                    {/* Artwork Shape */}
                    <div className="settings-item">
                        <label className="settings-item__label">
                            <span>Artwork Shape</span>
                            <span className="settings-item__description">Choose album art appearance</span>
                        </label>
                        <div className="settings-shape-selector">
                            <button
                                className={`settings-shape-btn ${settings.artworkShape === "square" ? "settings-shape-btn--active" : ""}`}
                                onClick={() => onUpdateSettings({ ...settings, artworkShape: "square" })}
                                aria-label="Square artwork"
                                aria-pressed={settings.artworkShape === "square"}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                </svg>
                                <span>Square</span>
                            </button>
                            <button
                                className={`settings-shape-btn ${settings.artworkShape === "circle" ? "settings-shape-btn--active" : ""}`}
                                onClick={() => onUpdateSettings({ ...settings, artworkShape: "circle" })}
                                aria-label="Circular artwork"
                                aria-pressed={settings.artworkShape === "circle"}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                    <circle cx="12" cy="12" r="9" />
                                </svg>
                                <span>Disc</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Error Sound section ───────────────────────────────── */}
                    <div className="settings-section-title">Error Sound 🔊</div>

                    {/* Enable/disable toggle */}
                    <div className="settings-item">
                        <label className="settings-item__label">
                            <span>Play on errors</span>
                            <span className="settings-item__description">
                                Plays "Faaaaaah" when you open a file with errors
                            </span>
                        </label>
                        <button
                            className={`settings-toggle ${settings.errorSoundEnabled ? "settings-toggle--on" : ""}`}
                            onClick={() =>
                                onUpdateSettings({ ...settings, errorSoundEnabled: !settings.errorSoundEnabled })
                            }
                            aria-label={settings.errorSoundEnabled ? "Disable error sound" : "Enable error sound"}
                        >
                            <span className="settings-toggle__slider" />
                        </button>
                    </div>

                    {/* Custom sound file */}
                    <div className="settings-item settings-item--column">
                        <label className="settings-item__label">
                            <span>Custom Sound</span>
                            <span className="settings-item__description">
                                {customSoundName
                                    ? customSoundName
                                    : "Using default (Faaaaaah)"}
                            </span>
                        </label>
                        <div className="settings-sound-actions">
                            <button
                                className="settings-action-btn"
                                onClick={onBrowseErrorSound}
                                title="Pick a custom sound file"
                            >
                                Browse…
                            </button>
                            {customSoundName && (
                                <button
                                    className="settings-action-btn settings-action-btn--danger"
                                    onClick={onClearErrorSound}
                                    title="Revert to default sound"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                className="settings-action-btn settings-action-btn--accent"
                                onClick={onTestErrorSound}
                                title="Preview the error sound now"
                            >
                                Test 🔊
                            </button>
                        </div>
                    </div>

                    {/* Cooldown */}
                    <div className="settings-item settings-item--column">
                        <label className="settings-item__label">
                            <span>Cooldown</span>
                            <span className="settings-item__description">
                                {settings.errorSoundCooldown === 0
                                    ? "No limit — sound plays every time"
                                    : `Wait ${formatCooldown(settings.errorSoundCooldown)} between sounds`}
                            </span>
                        </label>
                        <div className="settings-cooldown-presets">
                            {[
                                { label: "5s", value: 5000 },
                                { label: "10s", value: 10000 },
                                { label: "30s", value: 30000 },
                                { label: "1m", value: 60000 },
                                { label: "5m", value: 300000 },
                                { label: "Never", value: 0 },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    className={`settings-cooldown-btn ${
                                        settings.errorSoundCooldown === preset.value
                                            ? "settings-cooldown-btn--active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        onUpdateSettings({ ...settings, errorSoundCooldown: preset.value })
                                    }
                                    aria-label={`Set cooldown to ${preset.label}`}
                                    aria-pressed={settings.errorSoundCooldown === preset.value}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Per-file deduplication toggle */}
                    <div className="settings-item">
                        <label className="settings-item__label">
                            <span>Per-file deduplication</span>
                            <span className="settings-item__description">
                                Sound plays only once per file (until file is closed)
                            </span>
                        </label>
                        <button
                            className={`settings-toggle ${settings.errorSoundDeduplication ? "settings-toggle--on" : ""}`}
                            onClick={() =>
                                onUpdateSettings({ ...settings, errorSoundDeduplication: !settings.errorSoundDeduplication })
                            }
                            aria-label={settings.errorSoundDeduplication ? "Disable per-file deduplication" : "Enable per-file deduplication"}
                        >
                            <span className="settings-toggle__slider" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Format cooldown milliseconds into a readable string. */
function formatCooldown(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}min`;
}
