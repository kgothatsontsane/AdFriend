import { useEffect, useState } from "react";

type Habit = {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
};

export function HabitWidget() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");

  useEffect(() => {
    // Get initial state
    chrome.storage.local.get(["habits"], (result) => {
      setHabits(result.habits || []);
    });
  }, []);

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      setNewHabitName("");

      // Save to storage
      chrome.storage.local.set({ habits: updatedHabits });
    }
  };

  const toggleHabit = (id: string) => {
    const updatedHabits = habits.map((habit) =>
      habit.id === id ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);

    // Save to storage
    chrome.storage.local.set({ habits: updatedHabits });
  };

  const deleteHabit = (id: string) => {
    const updatedHabits = habits.filter((habit) => habit.id !== id);
    setHabits(updatedHabits);

    // Save to storage
    chrome.storage.local.set({ habits: updatedHabits });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Daily Habits</h2>
      <div className="flex space-x-2">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Enter a new habit"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onKeyPress={(e) => e.key === "Enter" && addHabit()}
        />
        <button
          onClick={addHabit}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <input
                aria-label={`Mark ${habit.name} as complete`}
                title={`Toggle completion status for ${habit.name}`}
                type="checkbox"
                checked={habit.completed}
                onChange={() => toggleHabit(habit.id)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span
                className={`${
                  habit.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {habit.name}
              </span>
            </div>
            <button
              onClick={() => deleteHabit(habit.id)}
              className="text-destructive hover:text-destructive/80"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
