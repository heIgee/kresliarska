import { lobbyIdSchema, type Member } from "@kresliarska/shared";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLobbyPresence } from "@/hooks/use-lobby-presence";
import { loadOrCreateIdentity } from "@/lib/identity";
import type { LobbyConnectionStatus } from "@/lib/lobby-socket";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<LobbyConnectionStatus, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  not_found: "Not found",
  full: "Full",
  invalid: "Error",
};

const NOT_FOUND_MESSAGE = "This lobby doesn't exist or has expired.";

const TERMINAL_MESSAGE: Partial<Record<LobbyConnectionStatus, string>> = {
  not_found: NOT_FOUND_MESSAGE,
  full: "This lobby is full.",
  invalid: "Something went wrong joining this lobby.",
};

const LobbyMessage = ({ message }: { message: string }) => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
    <p className="text-muted-foreground">{message}</p>
    <Button variant="outline" asChild>
      <Link to="/">Back home</Link>
    </Button>
  </main>
);

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <Button variant="outline" size="sm" className="w-24" onClick={() => void handleCopy()}>
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
};

const Lobby = ({ lobbyId, self }: { lobbyId: string; self: Member }) => {
  const { status, members } = useLobbyPresence(lobbyId, self);
  const terminalMessage = TERMINAL_MESSAGE[status];

  if (terminalMessage) {
    return <LobbyMessage message={terminalMessage} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle className="font-mono">{lobbyId}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={status === "live" ? "default" : "secondary"} className="w-24">
              {STATUS_LABEL[status]}
            </Badge>
            <CopyLinkButton />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.clientId} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-3 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span>{member.name}</span>
                <span
                  className={cn(
                    "text-muted-foreground text-sm",
                    member.clientId !== self.clientId && "invisible",
                  )}
                >
                  (you)
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
};

export const LobbyScreen = () => {
  const { lobbyId } = useParams();
  const [self] = useState(loadOrCreateIdentity);

  if (!lobbyId || !lobbyIdSchema.safeParse(lobbyId).success) {
    return <LobbyMessage message={NOT_FOUND_MESSAGE} />;
  }

  return <Lobby lobbyId={lobbyId} self={self} />;
};
