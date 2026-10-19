import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
import {
  CURSOR_SEND_INTERVAL_MS,
  type Cursor,
  lobbyIdSchema,
  type Profile,
} from "@kresliarska/shared";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { PresenceOverlay } from "@/components/presence-overlay";
import { Button } from "@/components/ui/button";
import { useLobbyConnection } from "@/hooks/use-lobby-connection";
import type { Theme } from "@/hooks/use-system-theme";
import { type CursorRenderer, createCursorRenderer } from "@/lib/cursor-renderer";
import { loadOrCreateIdentity, saveIdentity } from "@/lib/identity";
import type { LobbyConnectionStatus } from "@/lib/lobby-socket";
import { throttle } from "@/lib/throttle";

const LobbyBoard = lazy(() =>
  import("@/components/lobby-board").then((module) => ({ default: module.LobbyBoard })),
);

const NOT_FOUND_MESSAGE = "This lobby doesn't exist or has expired.";

const TERMINAL_MESSAGE: Partial<Record<LobbyConnectionStatus, string>> = {
  not_found: NOT_FOUND_MESSAGE,
  full: "This lobby is full.",
  invalid: "Something went wrong joining this lobby.",
};

type PointerUpdate = Parameters<NonNullable<ExcalidrawProps["onPointerUpdate"]>>[0];

const LobbyMessage = ({ message }: { message: string }) => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <p className="text-muted-foreground">{message}</p>
    <Button variant="outline" asChild>
      <Link to="/">Back home</Link>
    </Button>
  </main>
);

const Lobby = ({ lobbyId, theme }: { lobbyId: string; theme: Theme }) => {
  const [self, setSelf] = useState(loadOrCreateIdentity);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const rendererRef = useRef<CursorRenderer | null>(null);

  const handleRemoteCursor = useCallback((clientId: string, cursor: Cursor | null) => {
    rendererRef.current?.setCursor(clientId, cursor);
  }, []);

  const { status, members, send } = useLobbyConnection(lobbyId, self, handleRemoteCursor);

  useEffect(() => {
    if (!api) {
      return;
    }
    const renderer = createCursorRenderer({
      render: (collaborators) => api.updateScene({ collaborators }),
    });
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [api]);

  useEffect(() => {
    if (api) {
      rendererRef.current?.setMembers(members);
    }
  }, [api, members]);

  const sendCursor = useMemo(
    () => throttle((cursor: Cursor) => send({ type: "cursor", cursor }), CURSOR_SEND_INTERVAL_MS),
    [send],
  );

  useEffect(() => sendCursor.cancel, [sendCursor]);

  const handlePointerUpdate = useCallback(
    ({ pointer, button }: PointerUpdate) => {
      sendCursor({ x: pointer.x, y: pointer.y, tool: pointer.tool, button });
    },
    [sendCursor],
  );

  const handlePointerLeave = useCallback(() => {
    sendCursor.cancel();
    send({ type: "cursor", cursor: null });
  }, [send, sendCursor]);

  const handleRename = (profile: Profile): void => {
    const next = { ...self, ...profile };
    saveIdentity(next);
    setSelf(next);
    send({ type: "rename", profile });
  };

  const terminalMessage = TERMINAL_MESSAGE[status];
  if (terminalMessage) {
    return <LobbyMessage message={terminalMessage} />;
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 isolate">
        <Suspense fallback={<div className="size-full bg-background" />}>
          <LobbyBoard
            theme={theme}
            onApi={setApi}
            onPointerUpdate={handlePointerUpdate}
            onPointerLeave={handlePointerLeave}
          />
        </Suspense>
      </div>
      <PresenceOverlay
        lobbyId={lobbyId}
        status={status}
        members={members}
        self={self}
        onRename={handleRename}
      />
    </main>
  );
};

export const LobbyScreen = ({ theme }: { theme: Theme }) => {
  const { lobbyId } = useParams();

  if (!lobbyId || !lobbyIdSchema.safeParse(lobbyId).success) {
    return <LobbyMessage message={NOT_FOUND_MESSAGE} />;
  }

  return <Lobby lobbyId={lobbyId} theme={theme} />;
};
