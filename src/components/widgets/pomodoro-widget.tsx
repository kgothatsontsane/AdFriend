import { useEffect, useState } from "react";

interface PomodoroState {
  isRunning: boolean;
  timeLeft: number;
  currentPhase: "work" | "break";
}

interface StorageData {
  pomodoroTimer?: PomodoroState;
}

export function PomodoroWidget(): JSX.Element {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    currentPhase: "work",
  });

  useEffect(() => {
    // Get initial state
    chrome.storage.local.get(["pomodoroTimer"], (result: StorageData) => {
      if (result.pomodoroTimer) {
        setState(result.pomodoroTimer);
      }
    });
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (state.isRunning && state.timeLeft > 0) {
      timer = window.setInterval(() => {
        setState((prev: PomodoroState) => {
          const newState = { ...prev, timeLeft: prev.timeLeft - 1 };
          // Save state to storage
          chrome.storage.local.set({ pomodoroTimer: newState });
          return newState;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isRunning]);

  const toggleTimer = (): void => {
    setState((prev: PomodoroState) => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      chrome.storage.local.set({ pomodoroTimer: newState });
      return newState;
    });
  };

  const resetTimer = (): void => {
    const newState: PomodoroState = {
      isRunning: false,
      timeLeft: state.currentPhase === "work" ? 25 * 60 : 5 * 60,
      currentPhase: state.currentPhase,
    };
    setState(newState);
    chrome.storage.local.set({ pomodoroTimer: newState });
  };

  const switchPhase = (): void => {
    const newPhase = state.currentPhase === "work" ? "break" : "work";
    const newState: PomodoroState = {
      isRunning: false,
      timeLeft: newPhase === "work" ? 25 * 60 : 5 * 60,
      currentPhase: newPhase,
    };
    setState(newState);
    chrome.storage.local.set({ pomodoroTimer: newState });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Pomodoro Timer</h2>
      <div className="text-center">
        <div className="text-4xl font-bold mb-4">
          {formatTime(state.timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Current Phase: {state.currentPhase === "work" ? "Work" : "Break"}
        </div>
        <div className="space-x-2">
          <button
            onClick={toggleTimer}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            {state.isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
          >
            Reset
          </button>
          <button
            onClick={switchPhase}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
          >
            Switch to {state.currentPhase === "work" ? "Break" : "Work"}
          </button>
        </div>
      </div>
    </div>
  );
}
