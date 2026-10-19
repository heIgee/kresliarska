import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const subscribe = (onChange: () => void): (() => void) => {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const getSnapshot = (): Theme => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");

export const useSystemTheme = (): Theme => useSyncExternalStore(subscribe, getSnapshot);
