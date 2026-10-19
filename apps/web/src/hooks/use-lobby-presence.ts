import type { Member } from "@kresliarska/shared";
import { useEffect, useState } from "react";
import { connectLobby, type LobbyConnectionStatus } from "@/lib/lobby-socket";

type LobbyPresence = {
  status: LobbyConnectionStatus;
  members: Member[];
};

export const useLobbyPresence = (lobbyId: string, member: Member): LobbyPresence => {
  const [status, setStatus] = useState<LobbyConnectionStatus>("connecting");
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(
    () => connectLobby({ lobbyId, member, onStatus: setStatus, onMembers: setMembers }),
    [lobbyId, member],
  );

  return { status, members };
};
