import type { Member, Profile } from "@kresliarska/shared";
import { useState } from "react";
import { ProfilePopover } from "@/components/profile-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const AVATAR_CLASS =
  "flex size-8 items-center justify-center rounded-full font-medium text-white text-xs";

const initialsOf = (name: string): string =>
  name
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

type PresenceOverlayProps = {
  lobbyId: string;
  status: LobbyConnectionStatus;
  members: Member[];
  self: Member;
  onRename: (profile: Profile) => void;
};

export const PresenceOverlay = ({
  lobbyId,
  status,
  members,
  self,
  onRename,
}: PresenceOverlayProps) => (
  <aside className="absolute top-18 right-4 z-10 flex flex-col gap-2 rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur">
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{lobbyId}</span>
      <Badge variant={status === "live" ? "default" : "secondary"} className="w-24">
        {STATUS_LABEL[status]}
      </Badge>
      <CopyLinkButton />
    </div>
    <ul aria-label="Members" className="flex flex-wrap gap-1">
      {members.map((member) => {
        if (member.clientId !== self.clientId) {
          return (
            <li
              key={member.clientId}
              title={member.name}
              className={AVATAR_CLASS}
              style={{ backgroundColor: member.color }}
            >
              <span aria-hidden>{initialsOf(member.name)}</span>
              <span className="sr-only">{member.name}</span>
            </li>
          );
        }
        return (
          <li key={member.clientId}>
            <ProfilePopover profile={{ name: self.name, color: self.color }} onSave={onRename}>
              <button
                type="button"
                title={`${self.name} (you) — edit profile`}
                className={cn(
                  AVATAR_CLASS,
                  "cursor-pointer ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: self.color }}
              >
                <span aria-hidden>{initialsOf(self.name)}</span>
                <span className="sr-only">{self.name} (you), edit profile</span>
              </button>
            </ProfilePopover>
          </li>
        );
      })}
    </ul>
  </aside>
);
