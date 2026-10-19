import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import type { Theme } from "@/hooks/use-system-theme";

// Fonts are copied into public/ by scripts/copy-excalidraw-fonts.mjs instead of loading from a CDN.
window.EXCALIDRAW_ASSET_PATH = "/";

// File open/save/export would bypass the lobby; theme follows the system.
const UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
    export: false,
    toggleTheme: false,
  },
} as const;

type LobbyBoardProps = {
  theme: Theme;
  onApi: (api: ExcalidrawImperativeAPI) => void;
  onPointerUpdate: NonNullable<ExcalidrawProps["onPointerUpdate"]>;
  onPointerLeave: () => void;
};

export const LobbyBoard = ({ theme, onApi, onPointerUpdate, onPointerLeave }: LobbyBoardProps) => (
  <div className="size-full" onPointerLeave={onPointerLeave}>
    <Excalidraw
      theme={theme}
      UIOptions={UI_OPTIONS}
      excalidrawAPI={onApi}
      onPointerUpdate={onPointerUpdate}
    >
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    </Excalidraw>
  </div>
);
