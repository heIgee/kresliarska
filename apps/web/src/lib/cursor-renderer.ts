import type { Collaborator, SocketId } from "@excalidraw/excalidraw/types";
import type { Cursor, Member } from "@kresliarska/shared";

type Point = { x: number; y: number };

export type Collaborators = Map<SocketId, Collaborator>;

/** Fraction of the remaining distance covered per animation frame. */
const SMOOTHING = 0.35;
const SNAP_DISTANCE = 0.5;

// Excalidraw brands its collaborator map keys; our stable clientIds play that role.
const toSocketId = (clientId: string): SocketId => clientId as SocketId;

export const stepToward = (current: Point, target: Point, factor = SMOOTHING): Point => {
  const x = current.x + (target.x - current.x) * factor;
  const y = current.y + (target.y - current.y) * factor;
  return Math.hypot(target.x - x, target.y - y) < SNAP_DISTANCE ? target : { x, y };
};

type RendererOptions = {
  render: (collaborators: Collaborators) => void;
  requestFrame?: (callback: () => void) => number;
  cancelFrame?: (handle: number) => void;
};

export type CursorRenderer = {
  setCursor: (clientId: string, cursor: Cursor | null) => void;
  setMembers: (members: Member[]) => void;
  dispose: () => void;
};

/** Glides remote cursors toward their latest reported position instead of teleporting. */
export const createCursorRenderer = ({
  render,
  requestFrame = (callback) => window.requestAnimationFrame(callback),
  cancelFrame = (handle) => window.cancelAnimationFrame(handle),
}: RendererOptions): CursorRenderer => {
  const members = new Map<string, Member>();
  const cursors = new Map<string, { target: Cursor; shown: Point }>();
  let frame: number | undefined;

  const collaborators = (): Collaborators => {
    const result: Collaborators = new Map();
    for (const [clientId, { target, shown }] of cursors) {
      const member = members.get(clientId);
      if (!member) {
        continue;
      }
      result.set(toSocketId(clientId), {
        id: clientId,
        username: member.name,
        color: { background: member.color, stroke: member.color },
        button: target.button,
        pointer: { x: shown.x, y: shown.y, tool: target.tool },
      });
    }
    return result;
  };

  const tick = (): void => {
    frame = undefined;
    let moving = false;
    for (const cursor of cursors.values()) {
      cursor.shown = stepToward(cursor.shown, cursor.target);
      moving ||= cursor.shown !== cursor.target;
    }
    render(collaborators());
    if (moving) {
      frame = requestFrame(tick);
    }
  };

  const schedule = (): void => {
    frame ??= requestFrame(tick);
  };

  return {
    setCursor: (clientId, cursor) => {
      if (!cursor) {
        cursors.delete(clientId);
        render(collaborators());
        return;
      }
      const existing = cursors.get(clientId);
      cursors.set(clientId, { target: cursor, shown: existing?.shown ?? cursor });
      schedule();
    },
    setMembers: (list) => {
      members.clear();
      for (const member of list) {
        members.set(member.clientId, member);
      }
      for (const clientId of cursors.keys()) {
        if (!members.has(clientId)) {
          cursors.delete(clientId);
        }
      }
      render(collaborators());
    },
    dispose: () => {
      if (frame !== undefined) {
        cancelFrame(frame);
      }
      frame = undefined;
    },
  };
};
