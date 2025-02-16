import React from "react";
import { createRoot } from "react-dom/client";

// Ultra-level ad selectors covering multiple ad networks and dynamic ads
const adSelectors = [
  // Google Ads
  "ins.adsbygoogle",
  'div[id^="google_ads_"]',
  'div[id*="google_ads"]',
  'div[class*="adsbygoogle"]',
  'div[id*="div-gpt-ad"]',
  'div[id*="gpt_unit_"]',
  "div[data-google-query-id]",
  "div[data-ad-client]",
  'div[id*="google-ad"]',
  'div[class*="google-ad"]',
  "div[data-ad-layout]",
  "div[data-ad-format]",
  // Ad iframes
  'iframe[id^="google_ads_"]',
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="serving-sys.com"]',
  'iframe[src*="adnxs.com"]',
  'iframe[src*="amazon-adsystem.com"]',
  // Common ad networks
  'div[id*="taboola"]',
  'div[class*="taboola"]',
  'div[id*="outbrain"]',
  'div[class*="outbrain"]',
  'div[id*="mgid"]',
  'div[class*="mgid"]',
  'div[id*="zergnet"]',
  'div[class*="zergnet"]',
  // Generic ad identifiers
  '[class*="ad-"]:not(.adfriend-widget)',
  '[class*="ads-"]:not(.adfriend-widget)',
  '[id*="ad-"]:not(.adfriend-widget)',
  '[id*="ads-"]:not(.adfriend-widget)',
  '[class*="advertisement"]:not(.adfriend-widget)',
  '[id*="advertisement"]:not(.adfriend-widget)',
  'iframe[src*="ad"]:not(.adfriend-widget)',
  'iframe[src*="ads"]:not(.adfriend-widget)',
  // Common patterns
  'div[id*="banner"]',
  'div[class*="banner"]',
  'div[class*="sponsored"]',
  'div[id*="sponsored"]',
  'div[class*="partner-content"]',
  'div[class*="promoted"]',
  'div[id*="promoted"]',
  // Social media ads
  "[data-ad-preview]",
  '[aria-label*="Sponsored"]',
  '[aria-label*="Advertisement"]',
  // Additional ad networks
  'div[id*="criteo"]',
  'div[class*="criteo"]',
  'div[id*="gemini"]',
  'div[class*="gemini"]',
  'div[id*="adsense"]',
  'div[class*="adsense"]',
];

// Function to calculate ad score for an element
function calculateAdScore(element: HTMLElement): number {
  let score = 0;

  // Check for common ad-related class names and IDs
  const adKeywords = ["ad", "ads", "advertisement", "sponsored", "promotion"];
  const classAndId = (element.className + " " + element.id).toLowerCase();
  adKeywords.forEach((keyword) => {
    if (classAndId.includes(keyword)) score += 10;
  });

  // Check for iframe elements (common in ads)
  if (element.tagName === "IFRAME") score += 15;

  // Check for size characteristics typical of ads
  const rect = element.getBoundingClientRect();
  if (rect.width === 300 && rect.height === 250) score += 20; // Medium Rectangle
  if (rect.width === 728 && rect.height === 90) score += 20; // Leaderboard
  if (rect.width === 160 && rect.height === 600) score += 20; // Wide Skyscraper

  return score;
}

// Widget component
function AdWidget({
  content,
}: {
  content: { quote: string; activity: string };
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg text-center">
      <div className="mb-4 text-lg font-semibold text-primary">
        {content.quote}
      </div>
      <div className="text-sm text-muted-foreground">{content.activity}</div>
    </div>
  );
}

type AdBlockingSettings = {
  enabled: boolean;
  intensity: number;
  siteWhitelist: string[];
  selectedWidgets: string[];
  blockScripts: boolean;
  blockIframes: boolean;
  statsEnabled: boolean;
};

let settings: AdBlockingSettings = {
  enabled: true,
  intensity: 70,
  siteWhitelist: [],
  selectedWidgets: ["motivational", "productivity", "mindfulness"],
  blockScripts: true,
  blockIframes: true,
  statsEnabled: true,
};

let totalBlocked = 0;

// Load settings from storage
chrome.storage.local.get(["adBlockingSettings"], (result) => {
  if (result.adBlockingSettings) {
    settings = result.adBlockingSettings;
  }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_AD_BLOCKING_SETTINGS") {
    settings = message.settings;
  }
  return true;
});

// Enhanced ad detection with intensity-based scoring
function shouldBlockElement(element: HTMLElement): boolean {
  if (!settings.enabled) return false;

  // Check whitelist
  const hostname = window.location.hostname;
  if (settings.siteWhitelist.includes(hostname)) return false;

  // Calculate score
  const score = calculateAdScore(element);
  const threshold = 100 - settings.intensity; // Inverse relationship

  // Block based on score and settings
  if (score > threshold) {
    if (element.tagName === "IFRAME" && !settings.blockIframes) return false;
    if (element.tagName === "SCRIPT" && !settings.blockScripts) return false;
    return true;
  }

  return false;
}

// Function to replace ads with widgets
function replaceAd(adElement: HTMLElement) {
  if (shouldBlockElement(adElement)) {
    const container = document.createElement("div");
    container.className = "adfriend-widget";
    adElement.parentNode?.replaceChild(container, adElement);

    // Update stats
    if (settings.statsEnabled) {
      totalBlocked++;
      chrome.runtime.sendMessage({
        type: "UPDATE_AD_STATS",
        totalBlocked: totalBlocked,
      });
    }

    // Create widget based on preferences
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <AdWidget content={getWidgetContent(settings.selectedWidgets)} />
      </React.StrictMode>
    );
  }
}

function replaceAdsWithWidgets() {
  chrome.runtime.sendMessage({ type: "GET_WIDGET_CONTENT" }, (response) => {
    if (response && response.success) {
      const adElements = document.querySelectorAll(adSelectors.join(","));

      adElements.forEach((adElement) => {
        if (!adElement.closest(".adfriend-widget")) {
          // Calculate ad score to determine if this is likely an ad
          const score = calculateAdScore(adElement as HTMLElement);
          if (score >= 20) {
            // Threshold for considering element as an ad
            const widgetContainer = document.createElement("div");
            widgetContainer.className = "adfriend-widget";
            adElement.replaceWith(widgetContainer);

            createRoot(widgetContainer).render(
              <React.StrictMode>
                <AdWidget content={response.content} />
              </React.StrictMode>
            );
          }
        }
      });
    }
  });
}

// Initialize ad detection and replacement
function init() {
  // Replace existing ads
  replaceAdsWithWidgets();

  // Watch for new ads
  const adObserver = new MutationObserver((mutations) => {
    let shouldReplaceAds = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (adSelectors.some((selector) => node.matches(selector))) {
            shouldReplaceAds = true;
          }
        }
      });
    });
    if (shouldReplaceAds) replaceAdsWithWidgets();
  });

  adObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id"],
  });
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function getWidgetContent(selectedWidgets: string[]) {
  const content = {
    motivational: {
      quotes: [
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
      ],
      activities: [
        "Take a moment to reflect on your goals",
        "Write down three things you're grateful for",
        "Visualize your success for 5 minutes",
      ],
    },
    productivity: {
      quotes: [
        "Time is what we want most, but what we use worst.",
        "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
        "Don't wait. The time will never be just right.",
      ],
      activities: [
        "Break your next task into smaller steps",
        "Try the Pomodoro Technique for 25 minutes",
        "Clear your workspace for better focus",
      ],
    },
    mindfulness: {
      quotes: [
        "The present moment is the only moment available to us.",
        "Peace comes from within. Do not seek it without.",
        "Mindfulness isn't difficult, we just need to remember to do it.",
      ],
      activities: [
        "Take three deep breaths",
        "Notice five things you can see right now",
        "Do a quick body scan meditation",
      ],
    },
    habit: {
      quotes: [
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        "Small habits make big changes.",
        "Success is the product of daily habits.",
      ],
      activities: [
        "Track one of your daily habits",
        "Start a new positive habit today",
        "Review your habit progress",
      ],
    },
  };

  // Select a random widget type from enabled widgets
  const availableTypes = selectedWidgets.filter((type) => type in content);
  if (availableTypes.length === 0)
    return { quote: "Stay focused!", activity: "Take a mindful break" };

  const selectedType =
    availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const selectedContent = content[selectedType];

  return {
    quote:
      selectedContent.quotes[
        Math.floor(Math.random() * selectedContent.quotes.length)
      ],
    activity:
      selectedContent.activities[
        Math.floor(Math.random() * selectedContent.activities.length)
      ],
  };
}
