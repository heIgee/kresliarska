import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLobby, lobbyExists, parseLobbyCode } from "@/lib/lobby-api";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const id = await createLobby();
      await navigate(`/l/${id}`);
    } catch {
      setError("Could not create a lobby. Is the API running?");
      setBusy(false);
    }
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const id = parseLobbyCode(code);
    if (!id) {
      setError("Enter an 8-character lobby code or a lobby link.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!(await lobbyExists(id))) {
        setError("Lobby not found.");
        setBusy(false);
        return;
      }
      await navigate(`/l/${id}`);
    } catch {
      setError("Could not reach the API.");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Kresliarska</CardTitle>
          <CardDescription>Shared canvas lobbies for brainstorming together.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button disabled={busy} onClick={() => void handleCreate()}>
            Create lobby
          </Button>
          <form className="flex gap-2" onSubmit={(event) => void handleJoin(event)}>
            <Input
              aria-label="Lobby code or link"
              placeholder="Lobby code or link"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button type="submit" variant="outline" disabled={busy}>
              Join
            </Button>
          </form>
          <p role="alert" className="min-h-5 text-destructive text-sm">
            {error}
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
