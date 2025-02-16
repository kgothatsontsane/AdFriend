// Import icons
import icon16 from "../assets/icon16.png";
import icon48 from "../assets/icon48.png";
import icon128 from "../assets/icon128.png";

export const icons = {
  16: icon16,
  48: icon48,
  128: icon128,
} as const;

export type IconSizes = keyof typeof icons;
