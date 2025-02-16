import { useEffect, useState } from "react";

export function FocusWidget() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Get initial state
    chrome.storage.local.get(["focusMode"], (result) => {
      setIsActive(result.focusMode || false);
    });
  }, []);

  const toggleFocusMode = async () => {
    const newState = !isActive;
    setIsActive(newState);

    // Update storage
    await chrome.storage.local.set({ focusMode: newState });

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TOGGLE_FOCUS_MODE",
          enabled: newState,
        });
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Focus Mode</h2>
      <p className="text-sm text-muted-foreground">
        Block distracting content and stay focused on your tasks.
      </p>
      <button
        onClick={toggleFocusMode}
        className={`w-full p-2 rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
      >
        {isActive ? "Disable Focus Mode" : "Enable Focus Mode"}
      </button>
    </div>
  );
}
