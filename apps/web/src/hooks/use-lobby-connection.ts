import type { Cursor, LobbyClientMessage, Member } from "@kresliarska/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { connectLobby, type LobbyConnection, type LobbyConnectionStatus } from "@/lib/lobby-socket";

type LobbyConnectionState = {
  status: LobbyConnectionStatus;
  members: Member[];
  send: (message: LobbyClientMessage) => void;
};

export const useLobbyConnection = (
  lobbyId: string,
  self: Member,
  onCursor: (clientId: string, cursor: Cursor | null) => void,
): LobbyConnectionState => {
  const [status, setStatus] = useState<LobbyConnectionStatus>("connecting");
  const [members, setMembers] = useState<Member[]>([]);
  const connectionRef = useRef<LobbyConnection | null>(null);
  const selfRef = useRef(self);
  const onCursorRef = useRef(onCursor);

  useEffect(() => {
    selfRef.current = self;
    onCursorRef.current = onCursor;
  });

  useEffect(() => {
    const connection = connectLobby({
      lobbyId,
      getMember: () => selfRef.current,
      onStatus: setStatus,
      onMembers: setMembers,
      onCursor: (clientId, cursor) => onCursorRef.current(clientId, cursor),
    });
    connectionRef.current = connection;
    return () => {
      connection.dispose();
      connectionRef.current = null;
    };
  }, [lobbyId]);

  const send = useCallback((message: LobbyClientMessage) => {
    connectionRef.current?.send(message);
  }, []);

  return { status, members, send };
};
