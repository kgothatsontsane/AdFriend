import React from "react";
import ReactDOM from "react-dom/client";
import { AdBlockingWidget } from "@/components/widgets/ad-blocking-widget";
import "@/styles/globals.css";

function App() {
  return (
    <div className="w-[400px] h-[500px] p-4 bg-background text-foreground">
      <AdBlockingWidget />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
