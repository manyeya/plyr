import React from "react";

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        enableShadows: boolean;
        artworkShape: "square" | "circle";
    };
    onUpdateSettings: (settings: { enableShadows: boolean; artworkShape: "square" | "circle" }) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
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
                </div>
            </div>
        </div>
    );
};
