chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension data
  chrome.storage.local.set({
    focusMode: false,
    pomodoroTimer: {
      isRunning: false,
      timeLeft: 25 * 60, // 25 minutes in seconds
      currentPhase: "work",
    },
    habits: [],
    widgets: {
      enabled: true,
      quotes: [
        "Every small step counts!",
        "You've got this!",
        "Make today amazing!",
        "Stay focused, stay awesome!",
        "Your potential is limitless!",
      ],
      activities: [
        "Time for a quick stretch!",
        "Have you done your burpees today?",
        "Take a deep breath and relax",
        "Drink some water!",
        "Stand up and move around",
      ],
    },
  });
});

// Listen for messages from popup or content scripts
type Message = {
  type: "GET_STATE" | "UPDATE_STATE" | "GET_WIDGET_CONTENT";
  payload?: any;
};

function injectContentScript(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
}

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    switch (message.type) {
      case "GET_STATE":
        chrome.storage.local.get(null, (data) => {
          sendResponse(data);
        });
        return true;

      case "UPDATE_STATE":
        chrome.storage.local.set(message.payload, () => {
          sendResponse({ success: true });
        });
        return true;

      case "GET_WIDGET_CONTENT":
        chrome.storage.local.get(["widgets"], (result) => {
          if (result.widgets) {
            const quotes = result.widgets.quotes;
            const activities = result.widgets.activities;
            const randomQuote =
              quotes[Math.floor(Math.random() * quotes.length)];
            const randomActivity =
              activities[Math.floor(Math.random() * activities.length)];
            sendResponse({
              success: true,
              content: {
                quote: randomQuote,
                activity: randomActivity,
              },
            });
          } else {
            sendResponse({ success: false });
          }
        });
        return true;

      default:
        sendResponse({ success: false, error: "Unknown message type" });
        return true;
    }
  }
);

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    injectContentScript(tabId);
  }
});
