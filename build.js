import { build } from "vite";
import { copyFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { resolve } from "path";

// Icon paths
const iconSizes = [16, 48, 128];
const iconFiles = iconSizes.map((size) => `icon${size}.png`);

// Clean and recreate dist directory
if (existsSync("dist")) {
  try {
    rmSync("dist", { recursive: true, force: true });
  } catch (error) {
    console.error("Error cleaning dist directory:", error);
    process.exit(1);
  }
}

try {
  mkdirSync("dist", { recursive: true });
} catch (error) {
  console.error("Error creating dist directory:", error);
  process.exit(1);
}

// Build the extension using Vite
await build();

// Copy manifest.json to dist folder
copyFileSync(
  resolve(process.cwd(), "manifest.json"),
  resolve(process.cwd(), "dist/manifest.json")
);

// Copy popup.html from dist/src to dist
copyFileSync(
  resolve(process.cwd(), "dist/src/popup.html"),
  resolve(process.cwd(), "dist/popup.html")
);

// Copy icon files
iconFiles.forEach((iconFile) => {
  copyFileSync(
    resolve(process.cwd(), "icons", iconFile),
    resolve(process.cwd(), "dist/assets", iconFile)
  );
});

console.log("Build completed successfully!");
