import { useEffect, useState } from "react";

type AdBlockingSettings = {
  enabled: boolean;
  intensity: number;
  siteWhitelist: string[];
  selectedWidgets: string[];
  blockScripts: boolean;
  blockIframes: boolean;
  statsEnabled: boolean;
};

type SiteStats = {
  totalBlocked: number;
  lastUpdated: string;
};

export function AdBlockingWidget() {
  const [settings, setSettings] = useState<AdBlockingSettings>({
    enabled: true,
    intensity: 70,
    siteWhitelist: [],
    selectedWidgets: ["motivational", "productivity", "mindfulness"],
    blockScripts: true,
    blockIframes: true,
    statsEnabled: true,
  });

  const [currentSite, setCurrentSite] = useState<string>("");
  const [stats, setStats] = useState<SiteStats>({
    totalBlocked: 0,
    lastUpdated: new Date().toISOString(),
  });

  useEffect(() => {
    // Get initial settings
    chrome.storage.local.get(["adBlockingSettings", "adStats"], (result) => {
      if (result.adBlockingSettings) {
        setSettings(result.adBlockingSettings);
      }
      if (result.adStats) {
        setStats(result.adStats);
      }
    });

    // Listen for stats updates from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "UPDATE_AD_STATS") {
        setStats({
          totalBlocked: message.totalBlocked,
          lastUpdated: new Date().toISOString(),
        });
      }
      return true;
    });

    // Get current site
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentSite(url.hostname);
      }
    });
  }, []);

  const updateSettings = (newSettings: Partial<AdBlockingSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    chrome.storage.local.set({ adBlockingSettings: updatedSettings });

    // Notify content script of settings change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "UPDATE_AD_BLOCKING_SETTINGS",
          settings: updatedSettings,
        });
      }
    });
  };

  const toggleSiteWhitelist = () => {
    const whitelist = new Set(settings.siteWhitelist);
    if (whitelist.has(currentSite)) {
      whitelist.delete(currentSite);
    } else {
      whitelist.add(currentSite);
    }
    updateSettings({ siteWhitelist: Array.from(whitelist) });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ad Blocking</h2>
        <button
          onClick={() => updateSettings({ enabled: !settings.enabled })}
          className={`px-4 py-2 rounded-lg transition-colors ${
            settings.enabled
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {settings.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            Blocking Intensity: {settings.intensity}%
          </label>
          <input
            aria-label="Blocking Intensity Slider"
            title="Adjust blocking intensity level"
            placeholder="Adjust blocking intensity"
            type="range"
            min="0"
            max="100"
            value={settings.intensity}
            onChange={(e) =>
              updateSettings({ intensity: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Current Site: {currentSite}</span>
          <button
            onClick={toggleSiteWhitelist}
            className={`px-3 py-1 text-sm rounded-md ${
              settings.siteWhitelist.includes(currentSite)
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {settings.siteWhitelist.includes(currentSite)
              ? "Remove from Whitelist"
              : "Add to Whitelist"}
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Widget Preferences</h3>
          <div className="grid grid-cols-2 gap-2">
            {["motivational", "productivity", "mindfulness", "habit"].map(
              (widget) => (
                <label key={widget} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.selectedWidgets.includes(widget)}
                    onChange={() => {
                      const widgets = settings.selectedWidgets.includes(widget)
                        ? settings.selectedWidgets.filter((w) => w !== widget)
                        : [...settings.selectedWidgets, widget];
                      updateSettings({ selectedWidgets: widgets });
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{widget}</span>
                </label>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Advanced Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.blockScripts}
                onChange={(e) =>
                  updateSettings({ blockScripts: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Block Ad Scripts</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.blockIframes}
                onChange={(e) =>
                  updateSettings({ blockIframes: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Block Ad iFrames</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.statsEnabled}
                onChange={(e) =>
                  updateSettings({ statsEnabled: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Enable Statistics</span>
            </label>
          </div>
        </div>

        {settings.statsEnabled && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold">Statistics</h3>
            <p className="text-sm text-muted-foreground">
              Ads Blocked: {stats.totalBlocked}
              <br />
              Last Updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
